# CLAUDE.md

This file provides guidance to Claude AI when working with this Discord DSU Bot repository.

## Project Status

**Author**: opisboy29  
**Repository**: [discord-dsu-bot](https://github.com/opisboy29/discord-dsu-bot)

This is a complete, production-ready Discord bot for automating Daily Standup Updates (DSU).

## Project Overview

- **Purpose**: Automated DSU reminders at 9AM & 5PM WIB
- **Technology**: Node.js, Discord.js, cron scheduling
- **Status**: Production-ready with comprehensive documentation
- **Built with**: AI assistance for documentation and best practices

## Key Commands

```bash
npm install      # Install dependencies
npm test        # Test bot connection
npm start       # Run in production
npm run dev     # Development mode
npm run pm2:start # Deploy with PM2
```

## Architecture

- `src/index.js` - Main bot application
- `src/schedulers/` - Cron scheduling system
- `config/` - Message templates
- `docs/` - Comprehensive setup guides