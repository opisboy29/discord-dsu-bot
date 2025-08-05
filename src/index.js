require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const dsuScheduler = require('./schedulers/dsu-scheduler');
const logger = require('./utils/logger');
const ConfigValidator = require('./utils/config-validator');
const { generateThreadTitle } = require('../config/dsu-templates');
const ThreadManager = require('./utils/thread-manager');

// Get package info for startup logs
const packageInfo = require('../package.json');

// Enhanced channel access validation using comprehensive validator
const ChannelValidator = require('./utils/channel-validator');

async function validateChannelAccess(client) {
    try {
        const channelId = process.env.DSU_CHANNEL_ID;
        logger.info('🔍 Starting comprehensive channel validation...');
        
        const validator = new ChannelValidator(client);
        const results = await validator.validateChannel(channelId);
        
        if (results.passed) {
            logger.success('✅ Comprehensive channel validation passed');
            logger.info(`   📍 Channel: #${results.channel.name}`);
            logger.info(`   🏰 Guild: ${results.guild.name}`);
            
            // Show permission summary
            const grantedPerms = Object.entries(results.permissions)
                .filter(([_, info]) => info.granted && info.required)
                .map(([perm]) => perm);
            logger.info(`   🔑 Permissions: ${grantedPerms.join(', ')}`);
            
            // Show warnings if any
            if (results.warnings.length > 0) {
                logger.warn(`   ⚠️ ${results.warnings.length} warning(s) found - check logs for details`);
            }
            
            return true;
        } else {
            logger.error('❌ Channel validation failed');
            logger.error(`   🚫 ${results.errors.length} error(s) found:`);
            
            results.errors.forEach((error, index) => {
                logger.error(`      ${index + 1}. ${error.message}`);
            });
            
            // Provide specific guidance based on error types
            const errorCodes = results.errors.map(e => e.code);
            
            if (errorCodes.includes('MISSING_CHANNEL_ID')) {
                logger.error('💡 Add DSU_CHANNEL_ID="your_channel_id" to your .env file');
            }
            if (errorCodes.includes('INVALID_CHANNEL_ID_FORMAT')) {
                logger.error('💡 Ensure channel ID is 17-19 digits (right-click channel → Copy ID)');
            }
            if (errorCodes.includes('CHANNEL_NOT_FOUND') || errorCodes.includes('UNKNOWN_CHANNEL')) {
                logger.error('💡 Make sure the bot is added to the server and channel exists');
            }
            if (errorCodes.includes('MISSING_REQUIRED_PERMISSIONS')) {
                logger.error('💡 Grant the bot ViewChannel, SendMessages, and EmbedLinks permissions');
            }
            if (errorCodes.includes('INVALID_CHANNEL_TYPE')) {
                logger.error('💡 DSU messages require a Text or Announcement channel');
            }
            
            return false;
        }
    } catch (error) {
        logger.error('❌ Channel validation system error:', error);
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

// Create thread manager instance
const threadManager = new ThreadManager();

client.once('ready', async () => {
    logger.startup('DSU Discord Bot', packageInfo.version);
    logger.success(`Bot is ready! Logged in as ${client.user.tag}`);
    logger.info(`Connected to ${client.guilds.cache.size} server(s)`);
    
    // Check if we can actually access the channel before starting scheduler
    const isChannelValid = await validateChannelAccess(client);
    if (!isChannelValid) {
        logger.error('❌ Channel validation failed. Scheduler will not start.');
        logger.error('💡 Please check DSU_CHANNEL_ID in your .env file');
        logger.error('💡 Make sure the bot has proper permissions in the target channel');
        
        // Don't exit - allow manual commands to still work
        logger.warn('⚠️ Bot will continue running for manual commands only');
        return;
    }
    
    logger.info(`Bot will send DSU reminders at 9:00 AM and 5:00 PM WIB (weekdays only)`);
    
    // Start the scheduler with enhanced error handling
    try {
        dsuScheduler.start(client);
        logger.success('✅ DSU Scheduler initialized successfully');
        
        // Validate scheduler status
        const status = dsuScheduler.getStatus();
        if (!status.morningJobRunning || !status.eveningJobRunning) {
            logger.warn('⚠️ Some scheduler jobs may not be running properly');
            logger.warn('💡 Check your cron expressions in .env file');
        }
    } catch (error) {
        logger.error('❌ Failed to start DSU scheduler:', error);
        
        if (error.message.includes('cron')) {
            logger.error('💡 Invalid cron expression - check MORNING_SCHEDULE and EVENING_SCHEDULE in .env');
        } else if (error.message.includes('timezone')) {
            logger.error('💡 Invalid timezone - check TIMEZONE in .env (e.g., Asia/Jakarta)');
        }
        
        logger.error('💀 Scheduler is critical for bot functionality, exiting...');
        process.exit(1);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // ignore other bots
    
    const command = message.content.toLowerCase();
    const validCommands = ['!dsu-morning', '!dsu-evening', '!dsu-help', '!dsu-status'];
    
    if (!validCommands.includes(command)) return;
    
    try {
        // Enhanced permission checking for manual commands
        const permissions = message.channel.permissionsFor(client.user);
        if (!permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
            logger.warn(`❌ Missing permissions for command ${command} in #${message.channel.name}`);
            try {
                await message.reply('❌ I need SendMessages and EmbedLinks permissions to work properly.');
            } catch (permError) {
                logger.error('Cannot even send permission error message:', permError);
            }
            return;
        }
        
        // Manual morning DSU trigger
        if (command === '!dsu-morning') {
            logger.info(`🌅 Manual morning DSU triggered by ${message.author.tag} in #${message.channel.name}`);
            const { getMorningTemplate, validateTemplate } = require('../config/dsu-templates');
            
            const template = getMorningTemplate();
            if (!validateTemplate(template)) {
                logger.error('❌ Morning template validation failed');
                await message.reply('❌ Error: Invalid morning template format');
                return;
            }
            
            const sentMessage = await message.channel.send(template);
            logger.dsu(`✅ Morning DSU sent manually to #${message.channel.name} (ID: ${sentMessage.id})`);
            
            // Create thread for manual morning DSU
            try {
                const threadTitle = generateThreadTitle('morning');
                const thread = await threadManager.createDSUThread(sentMessage, threadTitle, 'morning');
                if (thread) {
                    logger.success(`🧵 Manual morning DSU thread created: #${thread.name}`);
                }
            } catch (threadError) {
                logger.warn('⚠️ Failed to create thread for manual morning DSU:', threadError.message);
            }
        }
        
        // Manual evening DSU trigger  
        else if (command === '!dsu-evening') {
            logger.info(`🌆 Manual evening DSU triggered by ${message.author.tag} in #${message.channel.name}`);
            const { getEveningTemplate, validateTemplate } = require('../config/dsu-templates');
            
            const template = getEveningTemplate();
            if (!validateTemplate(template)) {
                logger.error('❌ Evening template validation failed');
                await message.reply('❌ Error: Invalid evening template format');
                return;
            }
            
            const sentMessage = await message.channel.send(template);
            logger.dsu(`✅ Evening DSU sent manually to #${message.channel.name} (ID: ${sentMessage.id})`);
            
            // Create thread for manual evening DSU
            try {
                const threadTitle = generateThreadTitle('evening');
                const thread = await threadManager.createDSUThread(sentMessage, threadTitle, 'evening');
                if (thread) {
                    logger.success(`🧵 Manual evening DSU thread created: #${thread.name}`);
                }
            } catch (threadError) {
                logger.warn('⚠️ Failed to create thread for manual evening DSU:', threadError.message);
            }
        }
        
        // Status command - new enhanced command
        else if (command === '!dsu-status') {
            logger.info(`📊 Status command requested by ${message.author.tag} in #${message.channel.name}`);
            const status = dsuScheduler.getStatus();
            
            const statusEmbed = {
                title: '🤖 DSU Bot Status',
                color: 0x00ff00, // Green
                fields: [
                    {
                        name: '🔄 Scheduler Status',
                        value: `Morning: ${status.morningJobRunning ? '✅ Running' : '❌ Stopped'}\nEvening: ${status.eveningJobRunning ? '✅ Running' : '❌ Stopped'}`,
                        inline: true
                    },
                    {
                        name: '🌏 Timezone & Time',
                        value: `${status.timezone}\n${status.currentTime}`,
                        inline: true
                    },
                    {
                        name: '📅 Schedule',
                        value: `Morning: ${status.schedule.morning}\nEvening: ${status.schedule.evening}`,
                        inline: false
                    },
                    {
                        name: '📊 Current Status',
                        value: `Weekday: ${status.isWeekday ? '✅ Yes' : '❌ No (Weekend)'}\nBot Ready: ✅ Yes`,
                        inline: false
                    },
                    {
                        name: '🧵 Thread Configuration',
                        value: `Auto-threads: ${status.threadConfig.enabled ? '✅ Enabled' : '❌ Disabled'}\nAuto-archive: ${status.threadConfig.autoArchiveDurationHours}h\nInitial message: ${status.threadConfig.sendInitialMessage ? '✅' : '❌'}`,
                        inline: false
                    }
                ],
                footer: {
                    text: 'DSU Bot • Built by opisboy29',
                    icon_url: null
                },
                timestamp: new Date().toISOString()
            };
            
            await message.channel.send({ embeds: [statusEmbed] });
        }
        
        // Help command
        else if (command === '!dsu-help') {
            logger.info(`❓ Help command requested by ${message.author.tag} in #${message.channel.name}`);
            const helpEmbed = {
                title: '🤖 DSU Bot Commands & Information',
                description: 'Automated Daily Standup Updates for your team',
                color: 0x3498db, // Blue
                fields: [
                    {
                        name: '📋 Manual Commands',
                        value: '`!dsu-morning` - Trigger morning DSU\n`!dsu-evening` - Trigger evening DSU\n`!dsu-status` - Show bot status\n`!dsu-help` - Show this help',
                        inline: false
                    },
                    {
                        name: '📅 Automatic Schedule',
                        value: '🌅 Morning DSU: 9:00 AM WIB (Mon-Fri)\n🌆 Evening DSU: 5:00 PM WIB (Mon-Fri)',
                        inline: false
                    },
                    {
                        name: '🔧 Features',
                        value: '• Rich Discord embeds\n• Timezone-aware scheduling\n• Weekday-only automation\n• Manual trigger commands\n• Auto-thread creation for discussions\n• Comprehensive error handling',
                        inline: false
                    }
                ],
                footer: {
                    text: '👤 Built by opisboy29 • 🔗 github.com/opisboy29/discord-dsu-bot',
                    icon_url: null
                },
                timestamp: new Date().toISOString()
            };
            
            await message.channel.send({ embeds: [helpEmbed] });
        }
    } catch (error) {
        logger.error(`❌ Error handling command '${command}':`, error);
        
        // Enhanced error reporting to user
        try {
            let errorMessage = '❌ Something went wrong executing that command.';
            
            if (error.code === 50013) {
                errorMessage = '❌ I don\'t have permission to send messages or embeds here.';
            } else if (error.code === 10008) {
                errorMessage = '❌ This message was deleted before I could respond.';
            } else if (error.code === 50035) {
                errorMessage = '❌ Invalid message format. Please try again.';
            }
            
            await message.reply(errorMessage);
        } catch (replyError) {
            logger.error('Failed to send error message to user:', replyError);
        }
    }
});

// Enhanced Discord client error handling
client.on('error', (error) => {
    logger.error('❌ Discord client error:', error);
    
    // Specific error handling
    if (error.code === 'ENOTFOUND') {
        logger.error('💡 Network connectivity issue - check internet connection');
    } else if (error.code === 'ECONNRESET') {
        logger.error('💡 Connection reset - Discord may be experiencing issues');
    }
});

client.on('disconnect', () => {
    logger.warn('⚠️ Discord client disconnected');
    logger.info('💡 Bot will attempt to reconnect automatically');
});

client.on('reconnecting', () => {
    logger.info('🔄 Discord client reconnecting...');
});

client.on('resume', () => {
    logger.success('✅ Discord connection resumed');
});

client.on('warn', (warning) => {
    logger.warn('⚠️ Discord client warning:', warning);
});

client.on('debug', (info) => {
    // Only log important debug info to avoid spam
    if (info.includes('heartbeat') || info.includes('ready')) {
        logger.debug(`🔍 Discord: ${info}`);
    }
});

client.on('rateLimit', (rateLimitData) => {
    logger.warn(`⏱️ Rate limited: ${rateLimitData.method} ${rateLimitData.path} - ${rateLimitData.timeout}ms timeout`);
});

// Enhanced process error handling with recovery attempts
process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Promise Rejection:', reason);
    logger.error('   At Promise:', promise);
    
    // Attempt graceful recovery for common issues
    if (reason && reason.code) {
        switch (reason.code) {
            case 10003: // Unknown Channel
                logger.error('💡 Channel not found - check DSU_CHANNEL_ID in .env');
                break;
            case 50001: // Missing Access
                logger.error('💡 Bot missing server access - re-invite with proper permissions');
                break;
            case 50013: // Missing Permissions
                logger.error('💡 Bot missing channel permissions - grant SendMessages and EmbedLinks');
                break;
            default:
                logger.error(`💡 Discord API error code: ${reason.code}`);
        }
    }
});

process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    logger.error('💀 This is a critical error that requires bot restart');
    
    // Attempt cleanup before exit
    try {
        if (dsuScheduler) {
            dsuScheduler.stop();
        }
        if (client) {
            client.destroy();
        }
    } catch (cleanupError) {
        logger.error('Error during cleanup:', cleanupError);
    }
    
    logger.shutdown('DSU Discord Bot');
    process.exit(1);
});

// Handle memory warnings
process.on('warning', (warning) => {
    if (warning.name === 'MaxListenersExceededWarning') {
        logger.warn('⚠️ Memory warning: Too many event listeners');
    } else if (warning.name === 'DeprecationWarning') {
        logger.warn(`⚠️ Deprecation warning: ${warning.message}`);
    } else {
        logger.warn('⚠️ Process warning:', warning);
    }
});

// ✅ CREATE HTTP SERVER WITH PROPER ERROR HANDLING
const app = express();
const PORT = process.env.PORT || 3000;
let httpServer; // ← Track server reference for shutdown

// ✅ UPDATED: Graceful shutdown with HTTP server cleanup
function gracefulShutdown(signal) {
    logger.info(`📋 Received ${signal}, shutting down gracefully...`);
    
    // Set a timeout to force exit if graceful shutdown takes too long
    const forceExitTimeout = setTimeout(() => {
        logger.error('💀 Force exit: Graceful shutdown took too long');
        process.exit(1);
    }, 10000); // 10 seconds timeout
    
    Promise.resolve()
        .then(() => {
            // Stop scheduler first
            if (dsuScheduler) {
                logger.info('🛑 Stopping DSU scheduler...');
                dsuScheduler.stop();
            }
        })
        .then(() => {
            // Close HTTP server
            return new Promise((resolve) => {
                if (httpServer) {
                    logger.info('🌐 Closing HTTP server...');
                    httpServer.close(() => {
                        logger.info('✅ HTTP server closed');
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        })
        .then(() => {
            // Destroy Discord client
            if (client) {
                logger.info('🤖 Disconnecting Discord client...');
                client.destroy();
            }
        })
        .then(() => {
            clearTimeout(forceExitTimeout);
            logger.shutdown('DSU Discord Bot');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('❌ Error during graceful shutdown:', error);
            clearTimeout(forceExitTimeout);
            process.exit(1);
        });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ✅ Enhanced HTTP health check endpoint
app.get('/health', (req, res) => {
    const schedulerStatus = dsuScheduler ? dsuScheduler.getStatus() : null;
    
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        discord: {
            ready: client.readyAt ? true : false,
            readyAt: client.readyAt,
            guilds: client.guilds.cache.size,
            user: client.user ? client.user.tag : null
        },
        scheduler: schedulerStatus ? {
            morning_running: schedulerStatus.morningJobRunning,
            evening_running: schedulerStatus.eveningJobRunning,
            timezone: schedulerStatus.timezone,
            is_weekday: schedulerStatus.isWeekday
        } : null,
        environment: {
            node_version: process.version,
            platform: process.platform,
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
            }
        },
        timestamp: new Date().toISOString()
    });
});

// Add endpoint for scheduler status
app.get('/status', (req, res) => {
    if (!dsuScheduler) {
        return res.status(503).json({ error: 'Scheduler not initialized' });
    }
    
    res.json(dsuScheduler.getStatus());
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

// Enhanced startup with comprehensive configuration validation
async function initializeBot() {
    logger.info('🚀 Initializing DSU Discord Bot...');
    
    // Step 1: Comprehensive configuration validation
    logger.info('📋 Step 1: Configuration Validation');
    const configValidator = new ConfigValidator();
    const configResults = await configValidator.validateConfiguration();
    
    if (!configResults.passed) {
        logger.error('❌ Configuration validation failed. Bot cannot start.');
        logger.error('📄 Configuration Report:');
        console.log(configValidator.generateReport());
        
        logger.error('💡 Please fix the configuration errors and try again');
        logger.error('💡 Check your .env file against .env.example');
        process.exit(1);
    }
    
    logger.success('✅ Configuration validation passed');
    if (configResults.warnings.length > 0) {
        logger.warn(`⚠️ ${configResults.warnings.length} configuration warnings found (see above)`);
    }
    
    // Step 2: Connect to Discord
    logger.info('📋 Step 2: Discord Connection');
    await connectToDiscord();
}

// Enhanced Discord login with comprehensive error handling
function connectToDiscord() {
    const token = process.env.DISCORD_BOT_TOKEN;
    
    logger.info('🔗 Attempting to connect to Discord...');
    
    return client.login(token)
        .then(() => {
            logger.success('✅ Successfully authenticated with Discord');
        })
        .catch(error => {
            logger.error('❌ Failed to login to Discord:', error);
            
            // Specific login error handling
            if (error.code === 'TOKEN_INVALID') {
                logger.error('💡 Invalid bot token - check your DISCORD_BOT_TOKEN in .env');
                logger.error('💡 Make sure you copied the full token from Discord Developer Portal');
            } else if (error.code === 'DISALLOWED_INTENTS') {
                logger.error('💡 Bot missing required intents - enable Message Content Intent in Discord Developer Portal');
            } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
                logger.error('💡 Network connectivity issue - check internet connection');
            }
            
            logger.shutdown('DSU Discord Bot');
            process.exit(1);
        });
}

// Start initialization
initializeBot().catch(error => {
    logger.error('❌ Bot initialization failed:', error);
    process.exit(1);
});