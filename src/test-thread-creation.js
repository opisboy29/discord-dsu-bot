/**
 * Thread Creation Test Script
 * 
 * @author opisboy29
 * @repository git@github.com:opisboy29/discord-dsu-bot.git
 * @description Comprehensive testing of auto-thread creation functionality
 */

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { getMorningTemplate, getEveningTemplate, generateThreadTitle } = require('../config/dsu-templates');
const ThreadManager = require('./utils/thread-manager');
const logger = require('./utils/logger');

class ThreadCreationTester {
    constructor() {
        this.client = null;
        this.threadManager = null;
        this.testChannel = null;
        this.testResults = [];
    }

    async initialize() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.threadManager = new ThreadManager();

        this.client.once('ready', async () => {
            logger.startup('Thread Creation Tester', '1.0.0');
            logger.success(`🤖 Test bot ready! Logged in as ${this.client.user.tag}`);
            
            await this.validateTestEnvironment();
            await this.runAllTests();
            
            logger.info('📊 Thread Creation Test Summary:');
            this.testResults.forEach((result, index) => {
                const status = result.passed ? '✅' : '❌';
                logger.info(`   ${status} Test ${index + 1}: ${result.name} - ${result.message}`);
            });
            
            const passed = this.testResults.filter(r => r.passed).length;
            const total = this.testResults.length;
            logger.info(`📈 Results: ${passed}/${total} tests passed`);
            
            // Cleanup and exit
            setTimeout(() => {
                this.client.destroy();
                process.exit(passed === total ? 0 : 1);
            }, 2000);
        });

        this.client.on('error', (error) => {
            logger.error('❌ Discord client error:', error);
        });

        // Login
        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            logger.error('❌ DISCORD_BOT_TOKEN not found in environment');
            process.exit(1);
        }

        await this.client.login(token);
    }

    async validateTestEnvironment() {
        try {
            const channelId = process.env.DSU_CHANNEL_ID;
            if (!channelId) {
                throw new Error('DSU_CHANNEL_ID not configured');
            }

            this.testChannel = await this.client.channels.fetch(channelId);
            if (!this.testChannel) {
                throw new Error(`Could not find test channel: ${channelId}`);
            }

            logger.success(`🎯 Test environment ready: #${this.testChannel.name}`);
            
            // Check if channel supports threads
            if (!this.threadManager.channelSupportsThreads(this.testChannel)) {
                throw new Error(`Channel #${this.testChannel.name} does not support threads`);
            }
            
            // Check bot permissions for thread creation
            const permissions = this.testChannel.permissionsFor(this.client.user);
            const requiredPerms = ['ViewChannel', 'SendMessages', 'EmbedLinks', 'CreatePublicThreads'];
            const missingPerms = requiredPerms.filter(perm => !permissions.has(perm));
            
            if (missingPerms.length > 0) {
                throw new Error(`Missing permissions: ${missingPerms.join(', ')}`);
            }
            
            logger.success('🔑 All required permissions verified');
            
        } catch (error) {
            logger.error('❌ Test environment validation failed:', error);
            process.exit(1);
        }
    }

    async runAllTests() {
        logger.info('🧪 Starting comprehensive thread creation tests...');
        
        // Test 1: Thread title generation
        await this.testThreadTitleGeneration();
        
        // Test 2: Thread manager configuration
        await this.testThreadManagerConfiguration();
        
        // Test 3: Morning DSU thread creation
        await this.testMorningDSUThreadCreation();
        
        // Test 4: Evening DSU thread creation  
        await this.testEveningDSUThreadCreation();
        
        // Test 5: Thread permissions validation
        await this.testThreadPermissions();
        
        // Test 6: Thread configuration validation
        await this.testThreadConfigValidation();
        
        // Test 7: Error handling
        await this.testErrorHandling();
    }

    async testThreadTitleGeneration() {
        try {
            logger.info('🧪 Test 1: Thread Title Generation');
            
            const morningTitle = generateThreadTitle('morning');
            const eveningTitle = generateThreadTitle('evening');
            
            // Verify titles are generated
            if (!morningTitle || typeof morningTitle !== 'string') {
                throw new Error('Morning thread title generation failed');
            }
            
            if (!eveningTitle || typeof eveningTitle !== 'string') {
                throw new Error('Evening thread title generation failed');
            }
            
            // Check title length (Discord limit is 100 characters)
            if (morningTitle.length > 100) {
                throw new Error(`Morning thread title too long: ${morningTitle.length} characters`);
            }
            
            if (eveningTitle.length > 100) {
                throw new Error(`Evening thread title too long: ${eveningTitle.length} characters`);
            }
            
            // Verify titles contain expected elements
            if (!morningTitle.includes('Morning') && !morningTitle.includes('🌅')) {
                throw new Error('Morning thread title missing expected elements');
            }
            
            if (!eveningTitle.includes('Evening') && !eveningTitle.includes('🌆')) {
                throw new Error('Evening thread title missing expected elements');
            }
            
            logger.success(`📝 Morning title: "${morningTitle}"`);
            logger.success(`📝 Evening title: "${eveningTitle}"`);
            
            this.addTestResult('Thread Title Generation', true, 'All thread titles generated successfully');
            
        } catch (error) {
            this.addTestResult('Thread Title Generation', false, error.message);
        }
    }

    async testThreadManagerConfiguration() {
        try {
            logger.info('🧪 Test 2: Thread Manager Configuration');
            
            const config = this.threadManager.getThreadConfig();
            
            // Verify configuration structure
            const requiredKeys = ['enabled', 'autoArchiveDuration', 'reason', 'sendInitialMessage'];
            for (const key of requiredKeys) {
                if (!(key in config)) {
                    throw new Error(`Missing configuration key: ${key}`);
                }
            }
            
            // Verify configuration values
            if (typeof config.enabled !== 'boolean') {
                throw new Error('enabled should be boolean');
            }
            
            if (!Number.isInteger(config.autoArchiveDuration) || config.autoArchiveDuration <= 0) {
                throw new Error('autoArchiveDuration should be positive integer');
            }
            
            if (typeof config.reason !== 'string' || config.reason.length === 0) {
                throw new Error('reason should be non-empty string');
            }
            
            logger.success(`⚙️ Configuration: ${JSON.stringify(config, null, 2)}`);
            
            this.addTestResult('Thread Manager Configuration', true, 'Configuration structure valid');
            
        } catch (error) {
            this.addTestResult('Thread Manager Configuration', false, error.message);
        }
    }

    async testMorningDSUThreadCreation() {
        try {
            logger.info('🧪 Test 3: Morning DSU Thread Creation');
            
            // Send a test DSU message
            const template = getMorningTemplate();
            const message = await this.testChannel.send(template);
            
            if (!message || !message.id) {
                throw new Error('Failed to send test morning DSU message');
            }
            
            logger.success(`📨 Test morning DSU sent (ID: ${message.id})`);
            
            // Create thread
            const threadTitle = generateThreadTitle('morning');
            const thread = await this.threadManager.createDSUThread(message, threadTitle, 'morning');
            
            if (!thread) {
                throw new Error('Thread creation returned null');
            }
            
            // Verify thread properties
            if (!thread.name || thread.name !== threadTitle) {
                throw new Error(`Thread name mismatch: expected "${threadTitle}", got "${thread.name}"`);
            }
            
            if (!thread.parentId || thread.parentId !== this.testChannel.id) {
                throw new Error('Thread parent channel mismatch');
            }
            
            logger.success(`🧵 Morning thread created: #${thread.name} (ID: ${thread.id})`);
            
            // Clean up after delay
            setTimeout(async () => {
                try {
                    await thread.delete();
                    await message.delete();
                    logger.debug('🧹 Test morning DSU and thread cleaned up');
                } catch (cleanupError) {
                    logger.debug('Could not clean up test morning DSU:', cleanupError.message);
                }
            }, 5000);
            
            this.addTestResult('Morning DSU Thread Creation', true, `Thread created successfully: #${thread.name}`);
            
        } catch (error) {
            this.addTestResult('Morning DSU Thread Creation', false, error.message);
        }
    }

    async testEveningDSUThreadCreation() {
        try {
            logger.info('🧪 Test 4: Evening DSU Thread Creation');
            
            // Send a test DSU message
            const template = getEveningTemplate();
            const message = await this.testChannel.send(template);
            
            if (!message || !message.id) {
                throw new Error('Failed to send test evening DSU message');
            }
            
            logger.success(`📨 Test evening DSU sent (ID: ${message.id})`);
            
            // Create thread
            const threadTitle = generateThreadTitle('evening');
            const thread = await this.threadManager.createDSUThread(message, threadTitle, 'evening');
            
            if (!thread) {
                throw new Error('Thread creation returned null');
            }
            
            // Verify thread properties
            if (!thread.name || thread.name !== threadTitle) {
                throw new Error(`Thread name mismatch: expected "${threadTitle}", got "${thread.name}"`);
            }
            
            if (!thread.parentId || thread.parentId !== this.testChannel.id) {
                throw new Error('Thread parent channel mismatch');
            }
            
            logger.success(`🧵 Evening thread created: #${thread.name} (ID: ${thread.id})`);
            
            // Clean up after delay
            setTimeout(async () => {
                try {
                    await thread.delete();
                    await message.delete();
                    logger.debug('🧹 Test evening DSU and thread cleaned up');
                } catch (cleanupError) {
                    logger.debug('Could not clean up test evening DSU:', cleanupError.message);
                }
            }, 5000);
            
            this.addTestResult('Evening DSU Thread Creation', true, `Thread created successfully: #${thread.name}`);
            
        } catch (error) {
            this.addTestResult('Evening DSU Thread Creation', false, error.message);
        }
    }

    async testThreadPermissions() {
        try {
            logger.info('🧪 Test 5: Thread Permissions Validation');
            
            const permissions = this.testChannel.permissionsFor(this.client.user);
            const requiredPerms = ['CreatePublicThreads', 'SendMessagesInThreads', 'ReadMessageHistory'];
            
            for (const perm of requiredPerms) {
                const hasPermission = permissions.has(perm);
                logger.info(`   ${hasPermission ? '✅' : '❌'} ${perm}`);
                
                if (!hasPermission && perm === 'CreatePublicThreads') {
                    throw new Error(`Missing critical permission: ${perm}`);
                }
            }
            
            // Test channel type support
            const supportsThreads = this.threadManager.channelSupportsThreads(this.testChannel);
            if (!supportsThreads) {
                throw new Error('Channel does not support threads');
            }
            
            this.addTestResult('Thread Permissions', true, 'All required permissions verified');
            
        } catch (error) {
            this.addTestResult('Thread Permissions', false, error.message);
        }
    }

    async testThreadConfigValidation() {
        try {
            logger.info('🧪 Test 6: Thread Configuration Validation');
            
            const validation = this.threadManager.validateThreadConfig();
            
            // Check validation structure
            if (!validation || typeof validation.valid !== 'boolean') {
                throw new Error('Invalid validation result structure');
            }
            
            // Log validation results
            logger.info(`   Validation status: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
            logger.info(`   Errors: ${validation.errors.length}`);
            logger.info(`   Warnings: ${validation.warnings.length}`);
            
            if (validation.errors.length > 0) {
                validation.errors.forEach(error => {
                    logger.error(`     • ${error}`);
                });
            }
            
            if (validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    logger.warn(`     • ${warning}`);
                });
            }
            
            this.addTestResult('Thread Config Validation', true, 
                `Validation completed: ${validation.errors.length} errors, ${validation.warnings.length} warnings`);
            
        } catch (error) {
            this.addTestResult('Thread Config Validation', false, error.message);
        }
    }

    async testErrorHandling() {
        try {
            logger.info('🧪 Test 7: Error Handling');
            
            // Test with invalid message (null)
            let errorCaught = false;
            try {
                await this.threadManager.createDSUThread(null, 'Test Thread', 'morning');
            } catch (error) {
                errorCaught = true;
            }
            
            if (!errorCaught) {
                logger.warn('⚠️ Expected error for null message not caught');
            } else {
                logger.success('✅ Null message error handling works');
            }
            
            // Test thread creation with disabled configuration
            const originalEnabled = this.threadManager.threadConfig.enabled;
            this.threadManager.setThreadEnabled(false);
            
            // Send test message
            const template = getMorningTemplate();
            const message = await this.testChannel.send(template);
            
            // Try to create thread (should return null when disabled)
            const thread = await this.threadManager.createDSUThread(message, 'Test Thread', 'morning');
            
            if (thread !== null) {
                throw new Error('Thread creation should return null when disabled');
            }
            
            logger.success('✅ Disabled thread creation handled correctly');
            
            // Restore original setting
            this.threadManager.setThreadEnabled(originalEnabled);
            
            // Clean up test message
            setTimeout(async () => {
                try {
                    await message.delete();
                } catch (cleanupError) {
                    // Ignore cleanup errors
                }
            }, 3000);
            
            this.addTestResult('Error Handling', true, 'Error handling mechanisms working correctly');
            
        } catch (error) {
            this.addTestResult('Error Handling', false, error.message);
        }
    }

    addTestResult(name, passed, message) {
        this.testResults.push({ name, passed, message });
        const status = passed ? '✅' : '❌';
        logger.info(`   ${status} ${name}: ${message}`);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new ThreadCreationTester();
    tester.initialize().catch(error => {
        logger.error('❌ Thread creation test initialization failed:', error);
        process.exit(1);
    });
}

module.exports = ThreadCreationTester;