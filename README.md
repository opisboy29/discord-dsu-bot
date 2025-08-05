# 🤖 DSU Discord Bot

Discord bot for automating daily standup reminders. Sends structured DSU prompts at 9 AM and 5 PM WIB on weekdays.

**Author**: opisboy29  
**Note**: Built with AI assistance for documentation and best practices

## Features

- ⏰ Automated DSU reminders (9 AM & 5 PM WIB, weekdays only)
- 🎨 Rich Discord embeds with structured format
- 🧪 Manual testing commands
- 📊 Comprehensive logging
- 🚀 Production-ready with PM2

## Quick Start

1. **Create Discord Bot**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create new application → Bot → Copy token

2. **Setup**:
```bash
git clone git@github.com:opisboy29/discord-dsu-bot.git
cd discord-dsu-bot
npm install
cp .env.example .env
# Edit .env with your bot token and channel ID
npm test  # Test connection
npm start # Run bot
```

3. **Commands**:
   - `!dsu-morning` - Manual morning DSU
   - `!dsu-evening` - Manual evening DSU
   - `!dsu-help` - Show help

## Project Structure

```
src/
├── index.js              # Main bot
├── schedulers/
│   └── dsu-scheduler.js   # Cron scheduling
├── utils/
│   └── logger.js         # Logging
config/
└── dsu-templates.js      # Message templates
```

## Configuration

Required environment variables:
- `DISCORD_BOT_TOKEN` - Your bot token
- `DSU_CHANNEL_ID` - Target channel ID

## Production Deployment

```bash
npm install -g pm2
npm run pm2:start
```

See `DEPLOYMENT.md` for detailed production setup.

## License

MIT - Feel free to use for your own team!

---
*Built because humans forget standup times, but bots don't! 🤖*
