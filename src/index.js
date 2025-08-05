require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const dsuScheduler = require('./schedulers/dsu-scheduler');
const logger = require('./utils/logger');

// Get package info for startup logs
const packageInfo = require('../package.json');

// Validate channel access - learned this the hard way when bot had no permissions!
async function validateChannelAccess(client) {
    try {
        const channelId = process.env.DSU_CHANNEL_ID;
        if (!channelId) {
            logger.error('DSU_CHANNEL_ID not configured in environment variables');
            return false;
        }

        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            logger.error(`Could not find channel with ID: ${channelId}`);
            return false;
        }

        logger.success(`Channel validation successful: #${channel.name} in ${channel.guild.name}`);
        return true;
    } catch (error) {
        logger.error('Channel validation failed:', error);
        return false;
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // needed for commands to work
    ]
});

client.once('ready', async () => {
    logger.startup('DSU Discord Bot', packageInfo.version);
    logger.success(`Bot is ready! Logged in as ${client.user.tag}`);
    logger.info(`Connected to ${client.guilds.cache.size} server(s)`);
    
    // Check if we can actually access the channel before starting scheduler
    const isChannelValid = await validateChannelAccess(client);
    if (!isChannelValid) {
        logger.error('Channel validation failed. Scheduler will not start.');
        logger.error('Please check DSU_CHANNEL_ID in your .env file');
        return;
    }
    
    logger.info(`Bot will send DSU reminders at 9:00 AM and 5:00 PM WIB (weekdays only)`);
    
    // Start the scheduler
    try {
        dsuScheduler.start(client);
        logger.success('DSU Scheduler initialized successfully');
    } catch (error) {
        logger.error('Failed to start DSU scheduler:', error);
        process.exit(1);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // ignore other bots
    
    try {
        // Manual morning DSU trigger
        if (message.content.toLowerCase() === '!dsu-morning') {
            logger.info(`Manual morning DSU triggered by ${message.author.tag} in #${message.channel.name}`);
            const { getMorningTemplate } = require('../config/dsu-templates');
            await message.channel.send(getMorningTemplate());
            logger.dsu(`Morning DSU sent manually to #${message.channel.name}`);
        }
        
        // Manual evening DSU trigger  
        if (message.content.toLowerCase() === '!dsu-evening') {
            logger.info(`Manual evening DSU triggered by ${message.author.tag} in #${message.channel.name}`);
            const { getEveningTemplate } = require('../config/dsu-templates');
            await message.channel.send(getEveningTemplate());
            logger.dsu(`Evening DSU sent manually to #${message.channel.name}`);
        }
        
        // Help command
        if (message.content.toLowerCase() === '!dsu-help') {
            logger.info(`Help command requested by ${message.author.tag} in #${message.channel.name}`);
            const helpMessage = `
🤖 **DSU Bot Commands:**
\`!dsu-morning\` - Manually trigger morning DSU reminder
\`!dsu-evening\` - Manually trigger evening DSU reminder
\`!dsu-help\` - Show this help message

📅 **Automatic Schedule:**
- Morning DSU: 9:00 AM WIB (Monday-Friday)
- Evening DSU: 5:00 PM WIB (Monday-Friday)

👤 **Built by**: opisboy29
🔗 **Repository**: https://github.com/opisboy29/discord-dsu-bot
            `;
            await message.channel.send(helpMessage);
        }
    } catch (error) {
        logger.error(`Error handling message command: ${message.content}`, error);
    }
});

// Error handling
client.on('error', (error) => {
    logger.error('Discord client error:', error);
});

client.on('disconnect', () => {
    logger.warn('Discord client disconnected');
});

client.on('reconnecting', () => {
    logger.info('Discord client reconnecting...');
});

// Process error handling
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    logger.shutdown('DSU Discord Bot');
    process.exit(1);
});

// ✅ CREATE HTTP SERVER WITH PROPER ERROR HANDLING
const app = express();
const PORT = process.env.PORT || 3000;
let httpServer; // ← Track server reference for shutdown

// ✅ UPDATED: Graceful shutdown with HTTP server cleanup
function gracefulShutdown(signal) {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    
    // Stop scheduler
    dsuScheduler.stop();
    
    // Close HTTP server
    if (httpServer) {
        httpServer.close(() => {
            logger.info('HTTP server closed');
        });
    }
    
    // Destroy Discord client
    client.destroy();
    logger.shutdown('DSU Discord Bot');
    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ✅ HTTP SERVER WITH ERROR HANDLING
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        discord_ready: client.readyAt ? true : false,
        timestamp: new Date().toISOString()
    });
});

// ✅ START HTTP SERVER WITH ERROR HANDLING
httpServer = app.listen(PORT, () => {
    logger.info(`Health check server running on port ${PORT}`);
}).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
        logger.info('Try setting a different PORT in your .env file');
        process.exit(1);
    } else {
        logger.error('HTTP server error:', error);
        process.exit(1);
    }
});

// Login to Discord
logger.info('Attempting to connect to Discord...');
client.login(process.env.DISCORD_BOT_TOKEN)
    .then(() => {
        logger.success('Successfully authenticated with Discord');
    })
    .catch(error => {
        logger.error('Failed to login to Discord:', error);
        logger.shutdown('DSU Discord Bot');
        process.exit(1);
    });