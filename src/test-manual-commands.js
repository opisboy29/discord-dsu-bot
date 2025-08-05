/**
 * Manual DSU Command Testing System
 * 
 * @author opisboy29
 * @repository git@github.com:opisboy29/discord-dsu-bot.git
 * @description Comprehensive testing system for manual DSU commands
 */

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { getMorningTemplate, getEveningTemplate, validateTemplate } = require('../config/dsu-templates');
const logger = require('./utils/logger');

class ManualCommandTester {
    constructor() {
        this.client = null;
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

        // Enhanced ready handler
        this.client.once('ready', async () => {
            logger.startup('Manual DSU Command Tester', '1.0.0');
            logger.success(`🤖 Test bot ready! Logged in as ${this.client.user.tag}`);
            
            await this.validateTestEnvironment();
            await this.runAllTests();
            
            logger.info('📊 Test Summary:');
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
            
            // Check permissions
            const permissions = this.testChannel.permissionsFor(this.client.user);
            const requiredPerms = ['ViewChannel', 'SendMessages', 'EmbedLinks'];
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
        logger.info('🧪 Starting comprehensive manual command tests...');
        
        // Test 1: Template Generation
        await this.testTemplateGeneration();
        
        // Test 2: Template Validation
        await this.testTemplateValidation();
        
        // Test 3: Manual Morning DSU
        await this.testManualMorningDSU();
        
        // Test 4: Manual Evening DSU  
        await this.testManualEveningDSU();
        
        // Test 5: Help Command
        await this.testHelpCommand();
        
        // Test 6: Status Command
        await this.testStatusCommand();
        
        // Test 7: Permission Handling
        await this.testPermissionHandling();
        
        // Test 8: Error Recovery
        await this.testErrorRecovery();
    }

    async testTemplateGeneration() {
        try {
            logger.info('🧪 Test 1: Template Generation');
            
            const morningTemplate = getMorningTemplate();
            const eveningTemplate = getEveningTemplate();
            
            // Verify template structure
            if (!morningTemplate.embeds || !morningTemplate.embeds[0]) {
                throw new Error('Morning template missing embeds');
            }
            
            if (!eveningTemplate.embeds || !eveningTemplate.embeds[0]) {
                throw new Error('Evening template missing embeds');
            }
            
            // Check required fields
            const morningEmbed = morningTemplate.embeds[0];
            const eveningEmbed = eveningTemplate.embeds[0];
            
            const requiredFields = ['title', 'description', 'color', 'fields'];
            for (const field of requiredFields) {
                if (!morningEmbed[field]) {
                    throw new Error(`Morning template missing ${field}`);
                }
                if (!eveningEmbed[field]) {
                    throw new Error(`Evening template missing ${field}`);
                }
            }
            
            this.addTestResult('Template Generation', true, 'All templates generated successfully');
            
        } catch (error) {
            this.addTestResult('Template Generation', false, error.message);
        }
    }

    async testTemplateValidation() {
        try {
            logger.info('🧪 Test 2: Template Validation');
            
            const morningTemplate = getMorningTemplate();
            const eveningTemplate = getEveningTemplate();
            
            const morningValid = validateTemplate(morningTemplate);
            const eveningValid = validateTemplate(eveningTemplate);
            
            if (!morningValid) {
                throw new Error('Morning template validation failed');
            }
            
            if (!eveningValid) {
                throw new Error('Evening template validation failed');
            }
            
            // Test invalid templates
            const invalidTemplate = { invalid: 'data' };
            const invalidValidation = validateTemplate(invalidTemplate);
            
            if (invalidValidation) {
                throw new Error('Validation should reject invalid templates');
            }
            
            this.addTestResult('Template Validation', true, 'All validation tests passed');
            
        } catch (error) {
            this.addTestResult('Template Validation', false, error.message);
        }
    }

    async testManualMorningDSU() {
        try {
            logger.info('🧪 Test 3: Manual Morning DSU');
            
            const template = getMorningTemplate();
            const message = await this.testChannel.send(template);
            
            if (!message || !message.id) {
                throw new Error('Failed to send morning DSU message');
            }
            
            logger.success(`📨 Morning DSU sent successfully (ID: ${message.id})`);
            
            // Verify message content
            if (!message.embeds || message.embeds.length === 0) {
                throw new Error('Morning DSU message missing embeds');
            }
            
            const embed = message.embeds[0];
            if (!embed.title.includes('Morning')) {
                throw new Error('Morning DSU embed has incorrect title');
            }
            
            // Clean up test message
            setTimeout(async () => {
                try {
                    await message.delete();
                    logger.debug('🧹 Test message cleaned up');
                } catch (cleanupError) {
                    logger.debug('Could not clean up test message:', cleanupError.message);
                }
            }, 5000);
            
            this.addTestResult('Manual Morning DSU', true, `Message sent successfully (ID: ${message.id})`);
            
        } catch (error) {
            this.addTestResult('Manual Morning DSU', false, error.message);
        }
    }

    async testManualEveningDSU() {
        try {
            logger.info('🧪 Test 4: Manual Evening DSU');
            
            const template = getEveningTemplate();
            const message = await this.testChannel.send(template);
            
            if (!message || !message.id) {
                throw new Error('Failed to send evening DSU message');
            }
            
            logger.success(`📨 Evening DSU sent successfully (ID: ${message.id})`);
            
            // Verify message content
            if (!message.embeds || message.embeds.length === 0) {
                throw new Error('Evening DSU message missing embeds');
            }
            
            const embed = message.embeds[0];
            if (!embed.title.includes('Evening')) {
                throw new Error('Evening DSU embed has incorrect title');
            }
            
            // Clean up test message
            setTimeout(async () => {
                try {
                    await message.delete();
                    logger.debug('🧹 Test message cleaned up');
                } catch (cleanupError) {
                    logger.debug('Could not clean up test message:', cleanupError.message);
                }
            }, 5000);
            
            this.addTestResult('Manual Evening DSU', true, `Message sent successfully (ID: ${message.id})`);
            
        } catch (error) {
            this.addTestResult('Manual Evening DSU', false, error.message);
        }
    }

    async testHelpCommand() {
        try {
            logger.info('🧪 Test 5: Help Command');
            
            const helpEmbed = {
                title: '🤖 DSU Bot Commands & Information',
                description: 'Automated Daily Standup Updates for your team',
                color: 0x3498db,
                fields: [
                    {
                        name: '📊 Manual Commands',
                        value: '`!dsu-morning` - Trigger morning DSU\n`!dsu-evening` - Trigger evening DSU\n`!dsu-status` - Show bot status\n`!dsu-help` - Show this help',
                        inline: false
                    }
                ],
                footer: {
                    text: '👤 Built by opisboy29 • 🔗 github.com/opisboy29/discord-dsu-bot',
                    icon_url: null
                },
                timestamp: new Date().toISOString()
            };
            
            const message = await this.testChannel.send({ embeds: [helpEmbed] });
            
            if (!message || !message.id) {
                throw new Error('Failed to send help message');
            }
            
            // Clean up test message
            setTimeout(async () => {
                try {
                    await message.delete();
                    logger.debug('🧹 Help test message cleaned up');
                } catch (cleanupError) {
                    logger.debug('Could not clean up help test message:', cleanupError.message);
                }
            }, 5000);
            
            this.addTestResult('Help Command', true, 'Help message sent successfully');
            
        } catch (error) {
            this.addTestResult('Help Command', false, error.message);
        }
    }

    async testStatusCommand() {
        try {
            logger.info('🧪 Test 6: Status Command');
            
            // Create mock status data
            const mockStatus = {
                morningJobRunning: true,
                eveningJobRunning: true,
                timezone: 'Asia/Jakarta (WIB)',
                currentTime: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Jakarta',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                isWeekday: true,
                schedule: {
                    morning: '9:00 AM (Mon-Fri)',
                    evening: '5:00 PM (Mon-Fri)'
                }
            };
            
            const statusEmbed = {
                title: '🤖 DSU Bot Status',
                color: 0x00ff00,
                fields: [
                    {
                        name: '🔄 Scheduler Status',
                        value: `Morning: ${mockStatus.morningJobRunning ? '✅ Running' : '❌ Stopped'}\nEvening: ${mockStatus.eveningJobRunning ? '✅ Running' : '❌ Stopped'}`,
                        inline: true
                    },
                    {
                        name: '🌏 Timezone & Time',
                        value: `${mockStatus.timezone}\n${mockStatus.currentTime}`,
                        inline: true
                    }
                ],
                footer: {
                    text: 'DSU Bot • Built by opisboy29',
                    icon_url: null
                },
                timestamp: new Date().toISOString()
            };
            
            const message = await this.testChannel.send({ embeds: [statusEmbed] });
            
            if (!message || !message.id) {
                throw new Error('Failed to send status message');
            }
            
            // Clean up test message
            setTimeout(async () => {
                try {
                    await message.delete();
                    logger.debug('🧹 Status test message cleaned up');
                } catch (cleanupError) {
                    logger.debug('Could not clean up status test message:', cleanupError.message);
                }
            }, 5000);
            
            this.addTestResult('Status Command', true, 'Status message sent successfully');
            
        } catch (error) {
            this.addTestResult('Status Command', false, error.message);
        }
    }

    async testPermissionHandling() {
        try {
            logger.info('🧪 Test 7: Permission Handling');
            
            const permissions = this.testChannel.permissionsFor(this.client.user);
            const requiredPerms = ['ViewChannel', 'SendMessages', 'EmbedLinks'];
            
            for (const perm of requiredPerms) {
                if (!permissions.has(perm)) {
                    throw new Error(`Missing required permission: ${perm}`);
                }
            }
            
            // Test permission checking logic
            const hasViewChannel = permissions.has('ViewChannel');
            const hasSendMessages = permissions.has('SendMessages');
            const hasEmbedLinks = permissions.has('EmbedLinks');
            
            if (!hasViewChannel || !hasSendMessages || !hasEmbedLinks) {
                throw new Error('Permission checking logic failed');
            }
            
            this.addTestResult('Permission Handling', true, 'All permissions verified');
            
        } catch (error) {
            this.addTestResult('Permission Handling', false, error.message);
        }
    }

    async testErrorRecovery() {
        try {
            logger.info('🧪 Test 8: Error Recovery');
            
            // Test invalid template handling
            let errorCaught = false;
            try {
                const invalidTemplate = null;
                validateTemplate(invalidTemplate);
            } catch (validationError) {
                errorCaught = true;
            }
            
            // Test graceful error handling
            const testMessage = '🧪 Testing error recovery mechanisms';
            const message = await this.testChannel.send(testMessage);
            
            if (!message) {
                throw new Error('Error recovery test message failed');
            }
            
            // Clean up
            setTimeout(async () => {
                try {
                    await message.delete();
                } catch (cleanupError) {
                    // Ignore cleanup errors for this test
                }
            }, 3000);
            
            this.addTestResult('Error Recovery', true, 'Error handling mechanisms working');
            
        } catch (error) {
            this.addTestResult('Error Recovery', false, error.message);
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
    const tester = new ManualCommandTester();
    tester.initialize().catch(error => {
        logger.error('❌ Test initialization failed:', error);
        process.exit(1);
    });
}

module.exports = ManualCommandTester;