# 🚀 Discord DSU Bot Setup Guide

**Author**: opisboy29  
**Repository**: [discord-dsu-bot](https://github.com/opisboy29/discord-dsu-bot)

Complete setup instructions for configuring your Discord Daily Standup Update automation bot.

## 📋 Prerequisites

- Node.js 16+ installed
- Discord account with server admin privileges
- Text editor (VS Code, Sublime, etc.)

## 🤖 Step 1: Create Discord Bot

### 1.1 Discord Developer Portal Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Enter application name: `DSU Bot` (or your preferred name)
4. Click **"Create"**

### 1.2 Create Bot User

1. In your application, go to **"Bot"** section in left sidebar
2. Click **"Add Bot"**
3. Click **"Yes, do it!"** to confirm
4. **Copy the Bot Token** (keep this secure!)

### 1.3 Configure Bot Permissions

Required permissions for the bot:
- ✅ **Send Messages** - To post DSU reminders
- ✅ **View Channels** - To access the designated channel
- ✅ **Use Slash Commands** (optional) - For future enhancements
- ✅ **Embed Links** - For rich DSU message formatting

### 1.4 Bot Settings

1. **Public Bot**: Disable (uncheck) if you want only your server
2. **Require OAuth2 Code Grant**: Leave disabled
3. **Message Content Intent**: Enable if you want manual commands to work

## 🔗 Step 2: Invite Bot to Server

### 2.1 Generate Invite Link

1. Go to **"OAuth2"** → **"URL Generator"** section
2. Select **Scopes**: `bot`
3. Select **Bot Permissions**:
   - Send Messages
   - View Channels
   - Use Slash Commands
   - Embed Links
4. Copy the generated URL
5. Open URL in browser and select your Discord server
6. Click **"Authorize"**

### 2.2 Verify Bot Presence

1. Check your Discord server
2. Bot should appear in member list (offline until you run it)
3. Create or identify the channel for DSU messages

## ⚙️ Step 3: Environment Configuration

### 3.1 Get Channel ID

1. Enable **Developer Mode** in Discord:
   - Discord Settings → Advanced → Developer Mode (ON)
2. Right-click on your DSU channel
3. Select **"Copy ID"**
4. Save this Channel ID for configuration

### 3.2 Create Environment File

```bash
# In your project directory
cp .env.example .env
```

### 3.3 Configure .env File

Open `.env` file and configure:

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_actual_bot_token_here

# Discord Channel ID where DSU messages will be sent  
DSU_CHANNEL_ID=your_actual_channel_id_here

# Optional: Environment
NODE_ENV=production

# Optional: Custom timezone (default: Asia/Jakarta)
# TIMEZONE=Asia/Jakarta

# Optional: Custom schedule (default: 9AM and 5PM WIB)
# MORNING_SCHEDULE=0 9 * * 1-5
# EVENING_SCHEDULE=0 17 * * 1-5
```

**⚠️ Security Note**: Never commit `.env` file to version control!

## 🔧 Step 4: Installation & Testing

### 4.1 Install Dependencies

```bash
npm install
```

### 4.2 Test Configuration

```bash
# Start in development mode
npm run dev
```

Expected output:
```
✅ DSU Bot is ready! Logged in as YourBot#1234
🕒 Bot will send DSU reminders at 9:00 AM and 5:00 PM WIB (weekdays only)
📅 DSU Scheduler initialized:
   🌅 Morning DSU: 9:00 AM WIB (Mon-Fri)
   🌆 Evening DSU: 5:00 PM WIB (Mon-Fri)
```

### 4.3 Test Manual Commands

In your Discord channel, try:
- `!dsu-morning` - Should show morning DSU template
- `!dsu-evening` - Should show evening DSU template  
- `!dsu-help` - Should show help message

## 📅 Step 5: Verify Scheduling

### 5.1 Schedule Verification

The bot will automatically post:
- **Morning DSU**: 9:00 AM WIB (Monday-Friday)
- **Evening DSU**: 5:00 PM WIB (Monday-Friday)

### 5.2 Timezone Check

Verify bot is using correct timezone:
```javascript
// Check current time in WIB
console.log(new Date().toLocaleString('en-US', {timeZone: 'Asia/Jakarta'}));
```

## 🚀 Step 6: Production Deployment

### 6.1 Production Mode

```bash
npm start
```

### 6.2 Process Management (Recommended)

Using PM2 for production:
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start src/index.js --name "dsu-bot"

# Save PM2 configuration
pm2 save
pm2 startup
```

### 6.3 Server Deployment Options

- **VPS/Cloud Server**: DigitalOcean, Linode, AWS EC2
- **Container**: Docker deployment
- **Serverless**: Railway, Render, Heroku
- **Local**: Run on dedicated machine

## 🔍 Troubleshooting

### Common Issues

#### Bot Not Responding
- ✅ Check bot token is correct
- ✅ Verify bot has permissions in channel
- ✅ Check console logs for errors
- ✅ Ensure bot is online in Discord

#### Scheduled Messages Not Sending
- ✅ Confirm channel ID is correct
- ✅ Check bot has "Send Messages" permission
- ✅ Verify timezone settings
- ✅ Check if it's a weekday during business hours

#### Permission Errors
- ✅ Re-invite bot with proper permissions
- ✅ Check channel-specific permissions
- ✅ Verify bot role hierarchy

### Getting Help

#### Debug Commands
```bash
# Check bot status
npm run dev

# View logs
tail -f logs/bot.log  # if logging to file
```

#### Channel ID Issues
1. Enable Developer Mode in Discord
2. Right-click channel → Copy ID
3. Paste exact ID in .env file (no quotes needed)

#### Token Issues
1. Go to Discord Developer Portal
2. Bot section → Reset Token
3. Copy new token to .env file
4. Restart bot

## 📊 Configuration Reference

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | ✅ | Bot token from Discord Developer Portal | `OTk4N...` |
| `DSU_CHANNEL_ID` | ✅ | Channel ID where messages will be sent | `123456789` |
| `NODE_ENV` | ❌ | Environment mode | `production` |
| `TIMEZONE` | ❌ | Custom timezone | `Asia/Jakarta` |
| `MORNING_SCHEDULE` | ❌ | Custom morning cron | `0 9 * * 1-5` |
| `EVENING_SCHEDULE` | ❌ | Custom evening cron | `0 17 * * 1-5` |

### Cron Schedule Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of Week (0-7, Sun-Sat)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of Month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

Examples:
- `0 9 * * 1-5` = 9:00 AM, Monday-Friday
- `0 17 * * 1-5` = 5:00 PM, Monday-Friday
- `30 8 * * *` = 8:30 AM, Daily

---

## ✅ Setup Complete!

Your Discord DSU Bot is now configured and ready to automate your team's daily standup updates! 

**Next Steps:**
1. Monitor first automated messages
2. Gather team feedback on templates
3. Customize message formats if needed
4. Consider additional features (slash commands, database logging, etc.)

For support or feature requests, check the project documentation or create an issue in the repository.