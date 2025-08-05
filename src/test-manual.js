#!/usr/bin/env node

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const logger = require('./utils/logger');

console.log('🧪 Testing Manual DSU Commands (No Scheduling)...\n');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    logger.success(`✅ Bot connected! Logged in as ${client.user.tag}`);
    logger.info(`🔌 Connected to ${client.guilds.cache.size} server(s)`);
    logger.info('📝 Manual testing mode - NO automatic scheduling');
    logger.info('🎯 Try these commands in Discord:');
    logger.info('   !dsu-morning  - Test morning DSU template');
    logger.info('   !dsu-evening  - Test evening DSU template');  
    logger.info('   !dsu-help     - Show help message');
    logger.info('   !dsu-test     - Send test message');
    logger.info('\n⏹️  Press Ctrl+C to stop the bot\n');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    try {
        // Test morning DSU
        if (message.content.toLowerCase() === '!dsu-morning') {
            logger.info(`🌅 Morning DSU test by ${message.author.tag} in #${message.channel.name}`);
            const { getMorningTemplate } = require('../config/dsu-templates');
            await message.channel.send(getMorningTemplate());
            logger.success('✅ Morning DSU template sent successfully');
        }
        
        // Test evening DSU
        if (message.content.toLowerCase() === '!dsu-evening') {
            logger.info(`🌆 Evening DSU test by ${message.author.tag} in #${message.channel.name}`);
            const { getEveningTemplate } = require('../config/dsu-templates');
            await message.channel.send(getEveningTemplate());
            logger.success('✅ Evening DSU template sent successfully');
        }
        
        // Help command
        if (message.content.toLowerCase() === '!dsu-help') {
            logger.info(`❓ Help requested by ${message.author.tag}`);
            const helpMessage = `
🧪 **DSU Bot - Manual Testing Mode**

**Available Commands:**
\`!dsu-morning\` - Test morning DSU template
\`!dsu-evening\` - Test evening DSU template  
\`!dsu-help\` - Show this help message
\`!dsu-test\` - Send simple test message

**Note:** This is manual testing mode. No automatic scheduling is active.

**Production Schedule (when enabled):**
- Morning DSU: 9:00 AM WIB (Monday-Friday)
- Evening DSU: 5:00 PM WIB (Monday-Friday)
            `;
            await message.channel.send(helpMessage);
        }
        
        // Simple test command
        if (message.content.toLowerCase() === '!dsu-test') {
            logger.info(`🧪 Test command by ${message.author.tag}`);
            await message.channel.send({
                embeds: [{
                    title: '🧪 DSU Bot Connection Test',
                    description: 'Bot is working correctly! All systems operational.',
                    color: 0x00ff00,
                    fields: [
                        {
                            name: '✅ Status',
                            value: 'Connected and responsive',
                            inline: true
                        },
                        {
                            name: '🕒 Test Time',
                            value: new Date().toLocaleString('en-US', {
                                timeZone: 'Asia/Jakarta',
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            inline: true
                        }
                    ],
                    footer: {
                        text: 'DSU Bot - Manual Testing Mode'
                    },
                    timestamp: new Date().toISOString()
                }]
            });
            logger.success('✅ Test message sent successfully');
        }
    } catch (error) {
        logger.error(`❌ Error handling command: ${message.content}`, error);
    }
});

// Error handling
client.on('error', (error) => {
    logger.error('Discord client error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('🛑 Received SIGINT, shutting down...');
    client.destroy();
    logger.info('✅ Bot disconnected successfully');
    process.exit(0);
});

// Login
logger.info('🔌 Connecting to Discord...');
client.login(process.env.DISCORD_BOT_TOKEN)
    .then(() => {
        logger.success('🔐 Successfully authenticated with Discord');
    })
    .catch(error => {
        logger.error('❌ Failed to login to Discord:', error);
        process.exit(1);
    });