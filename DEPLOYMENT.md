# 🚀 Production Deployment Guide

**Author**: opisboy29  
**Repository**: [discord-dsu-bot](https://github.com/opisboy29/discord-dsu-bot)

Complete guide for deploying the Discord DSU Bot to production with PM2 process management.

## 📋 Prerequisites

- Node.js 16+ installed on production server
- PM2 installed globally: `npm install -g pm2`
- Discord bot configured and tested locally
- Server with appropriate permissions

## 🔧 PM2 Configuration

### ecosystem.config.js Features

The included PM2 configuration provides:

- **Process Management**: Auto-restart, memory limits, crash recovery
- **Logging**: Separate files for errors, output, and combined logs  
- **Health Monitoring**: Uptime tracking, restart policies
- **Cron Restart**: Daily restart at 3 AM WIB for maintenance
- **Production Optimization**: Memory management, error handling

### Configuration Details

```javascript
{
  name: 'dsu-discord-bot',
  instances: 1,
  autorestart: true,
  max_memory_restart: '1G',
  log_file: 'logs/combined.log',
  error_file: 'logs/error.log',
  cron_restart: '0 3 * * *', // Daily restart at 3 AM WIB
  min_uptime: '10s',
  max_restarts: 5
}
```

## 🚀 Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/dsu-discord-bot
sudo chown $USER:$USER /var/www/dsu-discord-bot
```

### 2. Deploy Application

```bash
# Navigate to application directory
cd /var/www/dsu-discord-bot

# Clone or upload your project files
git clone git@github.com:opisboy29/discord-dsu-bot.git .
# OR
# Upload files via SCP/SFTP

# Install dependencies
npm install --production

# Create logs directory
mkdir -p logs

# Set up environment variables
cp .env.example .env
nano .env  # Configure your bot token and channel ID
```

### 3. Configure Environment

```bash
# Edit .env file with production values
NODE_ENV=production
DISCORD_BOT_TOKEN=your_production_bot_token
DSU_CHANNEL_ID=your_production_channel_id
```

### 4. Test Configuration

```bash
# Test bot connection
npm test

# Expected output:
# ✅ Bot Connection Successful!
# ✅ Channel Access Successful!
# ✅ All Tests Passed!
```

### 5. Start with PM2

```bash
# Start application with PM2
npm run pm2:start

# OR manually:
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the command
```

## 📊 Monitoring & Management

### PM2 Commands

```bash
# View application status
pm2 status

# View logs in real-time
npm run pm2:logs
# OR
pm2 logs dsu-discord-bot

# Monitor resources
npm run pm2:monit
# OR
pm2 monit

# Restart application
npm run pm2:restart
# OR
pm2 restart dsu-discord-bot

# Stop application
npm run pm2:stop
# OR
pm2 stop dsu-discord-bot

# Delete application from PM2
pm2 delete dsu-discord-bot
```

### Log Management

The application creates several log files in the `logs/` directory:

- **combined.log** - All log entries
- **error.log** - Error messages only
- **app.log** - General application logs
- **dsu.log** - DSU-specific activities
- **debug.log** - Debug information (development only)

```bash
# View recent logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log

# View DSU activity
tail -f logs/dsu.log

# View PM2 logs
pm2 logs dsu-discord-bot --lines 100
```

## 🔄 Log Rotation

The application includes automatic log rotation:

- **Rotation Trigger**: When log files exceed 50MB
- **Backup Files**: Keeps last 5 backup files
- **Cleanup**: Automatically removes old backups
- **Format**: `filename.YYYY-MM-DDTHH-mm-ss.backup`

## 🛡️ Production Security

### File Permissions

```bash
# Set proper permissions
sudo chown -R $USER:$USER /var/www/dsu-discord-bot
chmod 755 /var/www/dsu-discord-bot
chmod 600 .env  # Protect environment file
chmod -R 755 logs/
```

### Firewall Configuration

```bash
# If using UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 22/tcp
sudo ufw enable

# Bot doesn't need incoming connections
# Only outgoing to Discord API
```

### Environment Security

- ✅ Never commit `.env` file to version control
- ✅ Use strong, unique bot token
- ✅ Restrict bot permissions to minimum required
- ✅ Regular token rotation (if needed)
- ✅ Monitor logs for suspicious activity

## 📈 Performance Optimization

### Memory Management

```javascript
// ecosystem.config.js settings
max_memory_restart: '1G',    // Restart if memory exceeds 1GB
node_args: '--max_old_space_size=1024',  // V8 heap limit
```

### Process Monitoring

```bash
# Check resource usage
pm2 monit

# View process information
pm2 info dsu-discord-bot

# Check restart history
pm2 prettylist
```

## 🔧 Troubleshooting

### Common Issues

#### Bot Not Starting

```bash
# Check PM2 status
pm2 status

# View error logs
pm2 logs dsu-discord-bot --err

# Check environment variables
pm2 env dsu-discord-bot
```

#### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart if needed
pm2 restart dsu-discord-bot

# Adjust memory limit in ecosystem.config.js
```

#### Scheduled Messages Not Sending

```bash
# Check DSU logs
tail -f logs/dsu.log

# Verify timezone settings
timedatectl  # On Linux systems

# Test manual commands in Discord
!dsu-morning
!dsu-evening
```

### Health Checks

```bash
# Create health check script
cat > healthcheck.sh << 'EOF'
#!/bin/bash
PROCESS_COUNT=$(pm2 jlist | jq '.[] | select(.name=="dsu-discord-bot") | select(.pm2_env.status=="online")' | wc -l)

if [ $PROCESS_COUNT -eq 0 ]; then
    echo "DSU Bot is not running!"
    pm2 restart dsu-discord-bot
    exit 1
else
    echo "DSU Bot is healthy"
    exit 0
fi
EOF

chmod +x healthcheck.sh

# Add to cron for regular health checks
echo "*/5 * * * * /var/www/dsu-discord-bot/healthcheck.sh" | crontab -
```

## 📱 Integration Options

### Systemd Integration (Alternative to PM2 startup)

```bash
# Create systemd service
sudo tee /etc/systemd/system/dsu-bot.service > /dev/null <<EOF
[Unit]
Description=DSU Discord Bot
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=/var/www/dsu-discord-bot
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 stop all
ExecReload=/usr/bin/pm2 reload all
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable dsu-bot
sudo systemctl start dsu-bot
```

### Reverse Proxy (Optional - for webhooks/API)

```nginx
# /etc/nginx/sites-available/dsu-bot
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## ✅ Deployment Checklist

### Pre-Deployment

- [ ] Bot tested locally with `npm test`
- [ ] Environment variables configured
- [ ] Production server prepared with Node.js and PM2
- [ ] Discord bot permissions verified
- [ ] Channel ID confirmed in production server

### Deployment

- [ ] Application files uploaded/cloned
- [ ] Dependencies installed with `npm install --production`
- [ ] Environment file configured with production values
- [ ] PM2 configuration tested
- [ ] Application started with PM2
- [ ] PM2 configuration saved and startup configured

### Post-Deployment

- [ ] Bot connection verified in Discord
- [ ] Manual commands tested (`!dsu-morning`, `!dsu-evening`)
- [ ] Logs monitoring setup
- [ ] Health check script configured
- [ ] Automatic restarts verified
- [ ] Team notified of deployment

## 📞 Support & Maintenance

### Regular Maintenance

- **Daily**: Check logs for errors
- **Weekly**: Review memory usage and performance
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize configuration

### Monitoring Alerts

Consider setting up monitoring alerts for:
- Process crashes or restarts
- High memory usage
- Failed DSU message deliveries
- Discord API connection issues

---

## 🎉 Deployment Complete!

Your Discord DSU Bot is now running in production with:
- ✅ Automatic process management via PM2
- ✅ Comprehensive logging and monitoring
- ✅ Automatic restarts and error recovery
- ✅ Daily maintenance restarts
- ✅ Production-grade security

The bot will now automatically send DSU reminders at 9:00 AM and 5:00 PM WIB on weekdays!