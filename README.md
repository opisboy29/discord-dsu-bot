# 🤖 DSU Discord Bot

**Automated Daily Standup Updates for Discord Teams**

Discord bot that automates daily standup reminders with rich formatted messages at 9:00 AM and 5:00 PM WIB (weekdays only). Built with enterprise-grade reliability, comprehensive error handling, and extensive testing.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.x-blue.svg)](https://discord.js.org/)
[![PM2](https://img.shields.io/badge/PM2-Production%20Ready-red.svg)](https://pm2.keymetrics.io/)

**Author**: [opisboy29](https://github.com/opisboy29)  
**Repository**: [discord-dsu-bot](https://github.com/opisboy29/discord-dsu-bot)  
**License**: MIT  

> 🤖 Built with AI assistance for documentation and best practices

---

## 📋 Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Detailed Setup Guide](#-detailed-setup-guide)
- [Configuration](#-configuration)
- [Available Commands](#-available-commands)
- [Development](#-development)
- [Testing](#-testing)
- [Production Deployment](#-production-deployment)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

### 🎯 Core Functionality
- **⏰ Automated Scheduling**: DSU reminders at 9:00 AM & 5:00 PM WIB (weekdays only)
- **🎨 Rich Discord Embeds**: Structured templates with examples and guidance
- **🌍 Timezone Aware**: Configurable timezone support (default: Asia/Jakarta)
- **📱 Manual Commands**: Trigger DSU messages manually for testing

### 🛡️ Enterprise Features
- **🔍 Comprehensive Validation**: Configuration, channel access, and permission validation
- **📊 Advanced Logging**: Structured logging with file rotation and monitoring
- **⚡ Error Recovery**: Robust error handling with specific Discord API error mapping
- **🏥 Health Monitoring**: Built-in health check and status endpoints
- **🧪 Extensive Testing**: 7 comprehensive test suites covering all components

### 🚀 Production Ready
- **📦 PM2 Integration**: Production process management with auto-restart
- **🔧 Environment Configuration**: Comprehensive .env configuration management
- **📈 Performance Monitoring**: Memory usage monitoring and rate limiting
- **🛡️ Security**: Input validation, permission checking, and secure configuration

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ ([Download](https://nodejs.org/))
- **Discord Bot Token** ([Get from Discord Developer Portal](https://discord.com/developers/applications))
- **Discord Server** with admin permissions

### 1️⃣ Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** → Enter name → **"Create"**
3. Go to **"Bot"** section → **"Reset Token"** → Copy token
4. **Enable "Message Content Intent"** in Bot settings
5. Go to **"OAuth2" → "URL Generator"**:
   - Scopes: `bot`
   - Permissions: `Send Messages`, `Embed Links`, `Read Message History`
6. Copy generated URL and invite bot to your server

### 2️⃣ Setup Project

```bash
# Clone repository
git clone https://github.com/opisboy29/discord-dsu-bot.git
cd discord-dsu-bot

# Install dependencies
npm install

# Setup configuration
npm run setup  # Copies .env.example to .env

# Edit configuration file
nano .env  # or your preferred editor
```

### 3️⃣ Configure Environment

Update `.env` file with your settings:

```bash
# Required Configuration
DISCORD_BOT_TOKEN=your_bot_token_here
DSU_CHANNEL_ID=your_channel_id_here

# Optional (defaults shown)
TIMEZONE=Asia/Jakarta
MORNING_SCHEDULE=0 9 * * 1-5
EVENING_SCHEDULE=0 17 * * 1-5
```

### 4️⃣ Test & Run

```bash
# Validate configuration
npm run validate

# Test bot connection
npm run test:connection

# Start bot
npm start
```

**🎉 Your DSU bot is now running!**

---

## 📚 Detailed Setup Guide

### Getting Discord Channel ID

1. **Enable Developer Mode**:
   - Discord Settings → Advanced → Developer Mode ON

2. **Get Channel ID**:
   - Right-click your target channel → **"Copy ID"**
   - Paste the 17-19 digit number in `.env` as `DSU_CHANNEL_ID`

### Bot Permissions Setup

Your bot needs these permissions in the target channel:
- ✅ **View Channel** - To see the channel
- ✅ **Send Messages** - To post DSU reminders  
- ✅ **Embed Links** - To send rich formatted messages
- ✅ **Read Message History** - For proper functionality

### Timezone Configuration

The bot supports any valid timezone. Common examples:

```bash
# Indonesia (WIB)
TIMEZONE=Asia/Jakarta

# Singapore (SGT)  
TIMEZONE=Asia/Singapore

# US Eastern Time
TIMEZONE=America/New_York

# US Pacific Time
TIMEZONE=America/Los_Angeles

# UK Time
TIMEZONE=Europe/London
```

[Full timezone list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_BOT_TOKEN` | ✅ | - | Discord bot token from Developer Portal |
| `DSU_CHANNEL_ID` | ✅ | - | Channel ID where DSU messages are sent |
| `TIMEZONE` | ❌ | `Asia/Jakarta` | Timezone for scheduling |
| `MORNING_SCHEDULE` | ❌ | `0 9 * * 1-5` | Morning DSU cron schedule |
| `EVENING_SCHEDULE` | ❌ | `0 17 * * 1-5` | Evening DSU cron schedule |
| `NODE_ENV` | ❌ | `development` | Environment mode |
| `PORT` | ❌ | `3000` | HTTP server port |
| `LOG_LEVEL` | ❌ | `info` | Log level (error, warn, info, debug) |

### Advanced Configuration

```bash
# Template Customization
MENTION_HERE=true
MORNING_COLOR=3498db
EVENING_COLOR=e74c3c
TEMPLATE_FORMAT=full

# Development Options
DEBUG_MODE=false
DRY_RUN=false
ENABLE_SCHEDULING=true

# Production Settings
ENABLE_FILE_LOGGING=true
MEMORY_WARNING_THRESHOLD=80
RATE_LIMIT_MAX_REQUESTS=100
```

See `.env.example` for complete configuration options with detailed comments.

---

## 💬 Available Commands

### Manual Commands (in Discord)

| Command | Description |
|---------|-------------|
| `!dsu-morning` | Manually trigger morning DSU reminder |
| `!dsu-evening` | Manually trigger evening DSU reminder |
| `!dsu-help` | Show bot help and information |
| `!dsu-status` | Display bot status and configuration |

### NPM Scripts

#### Development
```bash
npm run dev              # Development mode with auto-restart
npm run dev:debug        # Debug mode with verbose logging
npm run dev:dry          # Dry run mode (no actual messages sent)
```

#### Testing
```bash
npm test                 # Run basic tests (config + connection)
npm run test:all         # Run all comprehensive tests
npm run test:config      # Test configuration validation
npm run test:connection  # Test Discord connection
npm run test:commands    # Test manual commands
npm run test:validation  # Test channel validation
npm run test:scheduler   # Test cron scheduling
npm run test:templates   # Test message templates
```

#### Production
```bash
npm run prod             # Production mode
npm run deploy           # Validate and deploy with PM2
npm run deploy:check     # Check deployment health
```

#### Utilities
```bash
npm run setup            # Initial project setup
npm run setup:check      # Validate setup configuration
npm run validate         # Validate current configuration
npm run health           # Check bot health status
npm run logs             # View live logs
npm run clean            # Clean log files and cache
```

---

## 🛠️ Development

### Development Setup

```bash
# Install dependencies
npm install

# Setup development environment
cp .env.example .env
# Edit .env with your development settings

# Start development server
npm run dev
```

### Development Mode Features

- **Auto-restart** on file changes
- **Debug logging** for troubleshooting
- **Dry run mode** for testing without sending messages
- **Hot reload** for faster development

### Code Structure

```
src/
├── index.js                     # Main bot application
├── schedulers/
│   └── dsu-scheduler.js         # Cron scheduling system
├── utils/
│   ├── logger.js               # Logging utility
│   ├── channel-validator.js    # Channel validation
│   └── config-validator.js     # Configuration validation
├── test-*.js                   # Test suites
config/
└── dsu-templates.js            # Message templates
```

---

## 🧪 Testing

The bot includes comprehensive testing suites:

### Test Suites Available

1. **Configuration Validation** (`npm run test:config`)
   - Environment variable validation
   - Configuration format checking
   - Production readiness assessment

2. **Connection Testing** (`npm run test:connection`)
   - Discord API connectivity
   - Bot authentication verification
   - Basic functionality testing

3. **Channel Validation** (`npm run test:validation`)
   - Channel access verification
   - Permission validation
   - Message sending capability

4. **Command Testing** (`npm run test:commands`)
   - Manual command functionality
   - Permission boundary testing
   - Error handling validation

5. **Scheduler Testing** (`npm run test:scheduler`)
   - Cron expression validation
   - Timezone handling verification
   - Weekday detection testing

6. **Template Testing** (`npm run test:templates`)
   - Message template generation
   - Discord embed validation
   - Format compatibility testing

### Running Tests

```bash
# Run specific test suite
npm run test:config

# Run all tests
npm run test:all

# Run tests with verbose output
DEBUG_MODE=true npm run test:all
```

---

## 🚀 Production Deployment

### Quick Production Setup

```bash
# Install PM2 globally
npm install -g pm2

# Deploy with validation
npm run deploy

# Check deployment status
npm run deploy:check
```

### Manual Production Setup

```bash
# Set production environment
export NODE_ENV=production

# Install dependencies
npm install --only=production

# Validate configuration
npm run validate

# Start with PM2
npm run pm2:start

# Monitor
npm run pm2:monit
```

### PM2 Management Commands

```bash
npm run pm2:start      # Start bot with PM2
npm run pm2:stop       # Stop bot
npm run pm2:restart    # Restart bot
npm run pm2:reload     # Reload without downtime
npm run pm2:logs       # View logs
npm run pm2:monit      # Open monitoring dashboard
npm run pm2:status     # Check status
```

### Health Monitoring

The bot provides health check endpoints:

```bash
# Check bot health
curl http://localhost:3000/health

# Check detailed status
curl http://localhost:3000/status

# Using npm scripts
npm run health
npm run status
```

### Production Checklist

- [ ] ✅ Environment variables configured
- [ ] ✅ Discord bot permissions granted
- [ ] ✅ Channel access validated
- [ ] ✅ Configuration tests passing
- [ ] ✅ PM2 ecosystem configured
- [ ] ✅ Log rotation enabled
- [ ] ✅ Health monitoring setup
- [ ] ✅ Backup procedures established

---

## 📁 Project Structure

```
discord-dsu-bot/
├── 📁 src/                          # Source code
│   ├── 📄 index.js                  # Main bot application
│   ├── 📁 schedulers/
│   │   └── 📄 dsu-scheduler.js      # Cron scheduling system
│   ├── 📁 utils/
│   │   ├── 📄 logger.js            # Logging utility
│   │   ├── 📄 channel-validator.js # Channel validation
│   │   └── 📄 config-validator.js  # Configuration validation
│   └── 📄 test-*.js                # Comprehensive test suites
├── 📁 config/
│   └── 📄 dsu-templates.js         # Message templates
├── 📁 logs/                        # Log files (created automatically)
├── 📄 package.json                 # Dependencies and scripts
├── 📄 ecosystem.config.js          # PM2 configuration
├── 📄 .env.example                 # Configuration template
├── 📄 README.md                    # This file
├── 📄 SETUP.md                     # Detailed setup guide
├── 📄 DEPLOYMENT.md                # Production deployment guide
├── 📄 SCHEDULING.md                # Scheduling documentation
└── 📄 TEMPLATES.md                 # Template customization guide
```

### Key Files Description

- **`src/index.js`**: Main application with Discord client, command handlers, and error management
- **`src/schedulers/dsu-scheduler.js`**: Advanced cron-based scheduling with timezone support
- **`config/dsu-templates.js`**: Rich Discord embed templates with customization options
- **`ecosystem.config.js`**: Production PM2 configuration with monitoring and logging
- **`.env.example`**: Comprehensive configuration template with 200+ options

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### ❌ "Invalid token" error
```
SOLUTION:
1. Regenerate token in Discord Developer Portal
2. Ensure token is copied completely without extra spaces
3. Check that bot has "Message Content Intent" enabled
```

#### ❌ "Missing permissions" error
```
SOLUTION:
1. Bot needs "Send Messages" and "Embed Links" permissions
2. Check channel-specific permission overrides
3. Ensure bot role is above mentioned roles in hierarchy
```

#### ❌ "Channel not found" error
```
SOLUTION:
1. Verify channel ID is correct (17-19 digits)
2. Ensure bot is added to the server
3. Check that channel exists and bot can access it
```

#### ❌ Messages not sending
```
SOLUTION:
1. Check ENABLE_SCHEDULING is set to true
2. Verify cron schedule format (use crontab.guru for validation)
3. Check timezone configuration matches your location
4. Review logs for specific error messages
```

#### ❌ Bot appears offline
```
SOLUTION:
1. Check internet connection
2. Verify bot token is valid
3. Ensure bot is invited to server with proper permissions
4. Check if bot is rate limited
```

### Debug Mode

Enable debug mode for detailed troubleshooting:

```bash
# Development debug mode
npm run dev:debug

# Production debug mode
DEBUG_MODE=true LOG_LEVEL=debug npm start
```

### Log Analysis

```bash
# View live logs
npm run logs

# View error logs only
npm run logs:error

# Check log files
ls -la logs/

# View specific log file
tail -f logs/combined.log
```

### Configuration Validation

```bash
# Validate current configuration
npm run validate

# Run comprehensive configuration tests
npm run test:config

# Test specific components
npm run test:connection    # Test Discord connection
npm run test:validation    # Test channel access
npm run test:scheduler     # Test scheduling system
```

### Getting Help

1. **Check logs** for specific error messages
2. **Run validation** to identify configuration issues
3. **Review documentation** for setup requirements
4. **Test individual components** to isolate problems
5. **Check Discord bot status** in Developer Portal

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/discord-dsu-bot.git
cd discord-dsu-bot

# Install dependencies
npm install

# Setup development environment
cp .env.example .env
# Edit .env with your development settings

# Run tests
npm run test:all

# Start development server
npm run dev
```

### Contribution Guidelines

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Test** your changes (`npm run test:all`)
4. **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Code Standards

- Follow existing code style and structure
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## 📄 License

MIT License - feel free to use this bot for your own team!

```
Copyright (c) 2025 opisboy29

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🚀 What's Next?

- 📱 **Slash Commands**: Modern Discord slash command support
- 📊 **Analytics**: DSU participation tracking and analytics
- 🔗 **Integrations**: Jira, Trello, and other project management tools
- 🤖 **AI Features**: Smart DSU suggestions and team insights
- 📱 **Mobile App**: Companion mobile app for DSU management

---

## 💝 Acknowledgments

- **Discord.js**: Excellent Discord API library
- **node-cron**: Reliable cron scheduling
- **PM2**: Production process management
- **AI Assistant**: Documentation and best practices guidance

---

*🤖 Built because humans forget standup times, but bots don't!*

**[⬆ Back to Top](#-dsu-discord-bot)**