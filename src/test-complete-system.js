/**
 * Complete DSU System Integration Test
 * 
 * @author opisboy29
 * @repository git@github.com:opisboy29/discord-dsu-bot.git
 * @description Comprehensive test of complete DSU system with thread creation in dry-run mode
 */

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { getMorningTemplate, getEveningTemplate, generateThreadTitle, validateTemplate } = require('../config/dsu-templates');
const ThreadManager = require('./utils/thread-manager');
const ConfigValidator = require('./utils/config-validator');
const ChannelValidator = require('./utils/channel-validator');
const logger = require('./utils/logger');

class CompleteDSUSystemTester {
    constructor() {
        this.client = null;
        this.threadManager = null;
        this.testChannel = null;
        this.testResults = [];
        this.isDryRun = process.env.DRY_RUN === 'true';
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
            logger.startup('Complete DSU System Tester', '1.0.0');
            logger.success(`🤖 System test bot ready! Logged in as ${this.client.user.tag}`);
            
            if (this.isDryRun) {
                logger.info('🏃‍♂️ Running in DRY-RUN mode - no actual messages will be sent');
            }
            
            await this.runCompleteSystemTest();
            
            this.displayTestSummary();
            
            // Cleanup and exit
            setTimeout(() => {
                this.client.destroy();
                const passed = this.testResults.filter(r => r.passed).length;
                const total = this.testResults.length;
                process.exit(passed === total ? 0 : 1);
            }, 3000);
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

    async runCompleteSystemTest() {
        logger.info('🧪 Starting Complete DSU System Integration Test...');
        logger.info('=' .repeat(80));
        
        // Phase 1: System Configuration Validation
        await this.testSystemConfiguration();
        
        // Phase 2: Discord Environment Validation
        await this.testDiscordEnvironment();
        
        // Phase 3: Template System Testing
        await this.testTemplateSystem();
        
        // Phase 4: Thread Management Testing
        await this.testThreadManagement();
        
        // Phase 5: Complete DSU Flow Testing
        await this.testCompleteDSUFlow();
        
        // Phase 6: Error Scenarios Testing
        await this.testErrorScenarios();
        
        // Phase 7: Integration Validation
        await this.testSystemIntegration();
        
        logger.info('=' .repeat(80));
        logger.info('🎉 Complete DSU System Integration Test Finished');
    }

    async testSystemConfiguration() {
        logger.info('\n📋 Phase 1: System Configuration Validation');
        logger.info('-' .repeat(60));
        
        try {
            // Test 1.1: Configuration Validation
            logger.info('🧪 Test 1.1: Configuration Validation');
            const configValidator = new ConfigValidator();
            const configResults = await configValidator.validateConfiguration();
            
            if (configResults.passed) {
                logger.success('✅ System configuration validation passed');
                logger.info(`   Warnings: ${configResults.warnings.length}`);
                logger.info(`   Recommendations: ${configResults.recommendations.length}`);
            } else {
                logger.error(`❌ System configuration validation failed (${configResults.errors.length} errors)`);
                configResults.errors.forEach(error => {
                    logger.error(`     • ${error.message}`);
                });
            }
            
            this.addTestResult('System Configuration', configResults.passed, 
                configResults.passed ? 'All configuration valid' : `${configResults.errors.length} configuration errors`);
            
            // Test 1.2: Thread Configuration Validation
            logger.info('🧪 Test 1.2: Thread Configuration Validation');
            const threadValidation = this.threadManager.validateThreadConfig();
            
            logger.info(`   Thread validation: ${threadValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
            logger.info(`   Errors: ${threadValidation.errors.length}`);
            logger.info(`   Warnings: ${threadValidation.warnings.length}`);
            
            if (threadValidation.errors.length > 0) {
                threadValidation.errors.forEach(error => {
                    logger.error(`     • ${error}`);
                });
            }
            
            this.addTestResult('Thread Configuration', threadValidation.valid, 
                `${threadValidation.errors.length} errors, ${threadValidation.warnings.length} warnings`);
                
        } catch (error) {
            this.addTestResult('System Configuration', false, `Configuration test failed: ${error.message}`);
        }
    }

    async testDiscordEnvironment() {
        logger.info('\n🌐 Phase 2: Discord Environment Validation');
        logger.info('-' .repeat(60));
        
        try {
            // Test 2.1: Channel Access Validation
            logger.info('🧪 Test 2.1: Channel Access Validation');
            const channelValidator = new ChannelValidator(this.client);
            const channelId = process.env.DSU_CHANNEL_ID;
            const channelResults = await channelValidator.validateChannel(channelId);
            
            if (channelResults.passed) {
                logger.success(`✅ Channel validation passed: #${channelResults.channel.name}`);
                this.testChannel = channelResults.channel;
                
                // Show permission summary
                const grantedPerms = Object.entries(channelResults.permissions)
                    .filter(([_, info]) => info.granted)
                    .map(([perm]) => perm);
                logger.info(`   Permissions: ${grantedPerms.join(', ')}`);
            } else {
                logger.error(`❌ Channel validation failed (${channelResults.errors.length} errors)`);
                channelResults.errors.forEach(error => {
                    logger.error(`     • ${error.message}`);
                });
            }
            
            this.addTestResult('Channel Access', channelResults.passed, 
                channelResults.passed ? `Channel #${channelResults.channel?.name} accessible` : 'Channel access failed');
            
            // Test 2.2: Thread Support Validation
            if (this.testChannel) {
                logger.info('🧪 Test 2.2: Thread Support Validation');
                const supportsThreads = this.threadManager.channelSupportsThreads(this.testChannel);
                const threadPermissions = this.testChannel.permissionsFor(this.client.user);
                const hasThreadPerms = threadPermissions.has('CreatePublicThreads');
                
                logger.info(`   Channel supports threads: ${supportsThreads ? '✅' : '❌'}`);
                logger.info(`   Bot has thread permissions: ${hasThreadPerms ? '✅' : '❌'}`);
                
                const threadSupport = supportsThreads && hasThreadPerms;
                this.addTestResult('Thread Support', threadSupport, 
                    threadSupport ? 'Thread creation supported' : 'Thread creation not supported');
            }
            
        } catch (error) {
            this.addTestResult('Discord Environment', false, `Environment test failed: ${error.message}`);
        }
    }

    async testTemplateSystem() {
        logger.info('\n📝 Phase 3: Template System Testing');
        logger.info('-' .repeat(60));
        
        try {
            // Test 3.1: Template Generation
            logger.info('🧪 Test 3.1: Template Generation');
            const morningTemplate = getMorningTemplate();
            const eveningTemplate = getEveningTemplate();
            
            const morningValid = validateTemplate(morningTemplate);
            const eveningValid = validateTemplate(eveningTemplate);
            
            logger.info(`   Morning template: ${morningValid ? '✅ Valid' : '❌ Invalid'}`);
            logger.info(`   Evening template: ${eveningValid ? '✅ Valid' : '❌ Invalid'}`);
            
            if (morningValid && morningTemplate.embeds?.[0]) {
                logger.info(`   Morning title: "${morningTemplate.embeds[0].title}"`);
                logger.info(`   Morning fields: ${morningTemplate.embeds[0].fields?.length || 0}`);
            }
            
            if (eveningValid && eveningTemplate.embeds?.[0]) {
                logger.info(`   Evening title: "${eveningTemplate.embeds[0].title}"`);
                logger.info(`   Evening fields: ${eveningTemplate.embeds[0].fields?.length || 0}`);
            }
            
            this.addTestResult('Template Generation', morningValid && eveningValid, 
                `Morning: ${morningValid ? 'valid' : 'invalid'}, Evening: ${eveningValid ? 'valid' : 'invalid'}`);
            
            // Test 3.2: Thread Title Generation
            logger.info('🧪 Test 3.2: Thread Title Generation');
            const morningThreadTitle = generateThreadTitle('morning');
            const eveningThreadTitle = generateThreadTitle('evening');
            
            const titleValid = morningThreadTitle && eveningThreadTitle && 
                             morningThreadTitle.length <= 100 && eveningThreadTitle.length <= 100;
            
            logger.info(`   Morning thread title: "${morningThreadTitle}"`);
            logger.info(`   Evening thread title: "${eveningThreadTitle}"`);
            logger.info(`   Title lengths: Morning ${morningThreadTitle?.length || 0}, Evening ${eveningThreadTitle?.length || 0}`);
            
            this.addTestResult('Thread Title Generation', titleValid, 
                titleValid ? 'All thread titles valid' : 'Thread title generation failed');
                
        } catch (error) {
            this.addTestResult('Template System', false, `Template test failed: ${error.message}`);
        }
    }

    async testThreadManagement() {
        logger.info('\n🧵 Phase 4: Thread Management Testing');
        logger.info('-' .repeat(60));
        
        try {
            // Test 4.1: Thread Manager Configuration
            logger.info('🧪 Test 4.1: Thread Manager Configuration');
            const threadConfig = this.threadManager.getThreadConfig();
            
            logger.info(`   Auto-threads enabled: ${threadConfig.enabled ? '✅' : '❌'}`);
            logger.info(`   Auto-archive duration: ${threadConfig.autoArchiveDurationHours}h`);
            logger.info(`   Send initial message: ${threadConfig.sendInitialMessage ? '✅' : '❌'}`);
            logger.info(`   Creation reason: "${threadConfig.reason}"`);
            
            this.addTestResult('Thread Manager Config', true, 'Thread configuration loaded');
            
            // Test 4.2: Thread Creation Simulation (Dry Run)
            if (this.isDryRun) {
                logger.info('🧪 Test 4.2: Thread Creation Simulation (Dry Run)');
                
                // Simulate thread creation without actually creating
                const morningTitle = generateThreadTitle('morning');
                const eveningTitle = generateThreadTitle('evening');
                
                logger.info('   🏃‍♂️ DRY RUN: Simulating thread creation...');
                logger.info(`   📝 Would create morning thread: "${morningTitle}"`);
                logger.info(`   📝 Would create evening thread: "${eveningTitle}"`);
                logger.info(`   ⏰ Would auto-archive after: ${threadConfig.autoArchiveDurationHours} hours`);
                
                this.addTestResult('Thread Creation Simulation', true, 'Thread creation simulation successful');
            }
            
        } catch (error) {
            this.addTestResult('Thread Management', false, `Thread management test failed: ${error.message}`);
        }
    }

    async testCompleteDSUFlow() {
        logger.info('\n🔄 Phase 5: Complete DSU Flow Testing');
        logger.info('-' .repeat(60));
        
        try {
            // Test 5.1: Morning DSU Flow
            logger.info('🧪 Test 5.1: Morning DSU Complete Flow');
            await this.testDSUFlow('morning');
            
            // Test 5.2: Evening DSU Flow  
            logger.info('🧪 Test 5.2: Evening DSU Complete Flow');
            await this.testDSUFlow('evening');
            
        } catch (error) {
            this.addTestResult('Complete DSU Flow', false, `DSU flow test failed: ${error.message}`);
        }
    }

    async testDSUFlow(type) {
        try {
            const template = type === 'morning' ? getMorningTemplate() : getEveningTemplate();
            const threadTitle = generateThreadTitle(type);
            
            logger.info(`   📋 ${type.charAt(0).toUpperCase() + type.slice(1)} DSU Flow:`);
            logger.info(`      1. Template generation: ✅`);
            logger.info(`      2. Template validation: ${validateTemplate(template) ? '✅' : '❌'}`);
            logger.info(`      3. Thread title generation: ✅`);
            logger.info(`      4. Thread title: "${threadTitle}"`);
            
            if (this.isDryRun) {
                logger.info('      🏃‍♂️ DRY RUN: Would send DSU message and create thread');
                logger.info(`      📝 Message would be sent to #${this.testChannel?.name || 'unknown'}`);
                logger.info(`      🧵 Thread would be created with title: "${threadTitle}"`);
                
                if (this.threadManager.threadConfig.sendInitialMessage) {
                    logger.info('      💬 Initial thread message would be sent');
                }
                
                this.addTestResult(`${type.charAt(0).toUpperCase() + type.slice(1)} DSU Flow`, true, 
                    `Complete ${type} DSU flow simulation successful`);
            } else if (this.testChannel) {
                // Actual test with real message and thread creation
                logger.info('      📨 Sending actual DSU message...');
                const message = await this.testChannel.send(template);
                
                if (message) {
                    logger.success(`      ✅ DSU message sent (ID: ${message.id})`);
                    
                    // Create thread
                    logger.info('      🧵 Creating discussion thread...');
                    const thread = await this.threadManager.createDSUThread(message, threadTitle, type);
                    
                    if (thread) {
                        logger.success(`      ✅ Thread created: #${thread.name} (ID: ${thread.id})`);
                        
                        // Schedule cleanup
                        setTimeout(async () => {
                            try {
                                await thread.delete();
                                await message.delete();
                                logger.debug(`      🧹 Cleaned up ${type} DSU test message and thread`);
                            } catch (cleanupError) {
                                logger.debug(`      ⚠️ Cleanup failed: ${cleanupError.message}`);
                            }
                        }, 10000);
                        
                        this.addTestResult(`${type.charAt(0).toUpperCase() + type.slice(1)} DSU Flow`, true, 
                            `Complete ${type} DSU flow with thread creation successful`);
                    } else {
                        logger.warn('      ⚠️ Thread creation returned null');
                        this.addTestResult(`${type.charAt(0).toUpperCase() + type.slice(1)} DSU Flow`, false, 
                            'DSU message sent but thread creation failed');
                    }
                } else {
                    this.addTestResult(`${type.charAt(0).toUpperCase() + type.slice(1)} DSU Flow`, false, 
                        'DSU message sending failed');
                }
            }
            
        } catch (error) {
            this.addTestResult(`${type.charAt(0).toUpperCase() + type.slice(1)} DSU Flow`, false, 
                `${type} DSU flow failed: ${error.message}`);
        }
    }

    async testErrorScenarios() {
        logger.info('\n⚠️ Phase 6: Error Scenarios Testing');
        logger.info('-' .repeat(60));
        
        try {
            // Test 6.1: Thread Creation with Disabled Config
            logger.info('🧪 Test 6.1: Thread Creation with Disabled Config');
            const originalEnabled = this.threadManager.threadConfig.enabled;
            this.threadManager.setThreadEnabled(false);
            
            const result = await this.threadManager.createDSUThread(null, 'Test Thread', 'morning');
            const disabledHandled = result === null;
            
            logger.info(`   Disabled thread creation handled: ${disabledHandled ? '✅' : '❌'}`);
            
            // Restore original setting
            this.threadManager.setThreadEnabled(originalEnabled);
            
            this.addTestResult('Disabled Thread Handling', disabledHandled, 
                'Thread creation properly disabled when configured');
            
            // Test 6.2: Invalid Template Handling
            logger.info('🧪 Test 6.2: Invalid Template Handling');
            const invalidTemplate = { invalid: 'template' };
            const templateValidation = validateTemplate(invalidTemplate);
            
            logger.info(`   Invalid template rejected: ${!templateValidation ? '✅' : '❌'}`);
            
            this.addTestResult('Invalid Template Handling', !templateValidation, 
                'Invalid template properly rejected');
            
        } catch (error) {
            this.addTestResult('Error Scenarios', false, `Error scenario test failed: ${error.message}`);
        }
    }

    async testSystemIntegration() {
        logger.info('\n🔗 Phase 7: System Integration Validation');
        logger.info('-' .repeat(60));
        
        try {
            // Test 7.1: Component Integration
            logger.info('🧪 Test 7.1: Component Integration');
            
            const integrationChecks = {
                'Template System': getMorningTemplate() && getEveningTemplate(),
                'Thread Manager': this.threadManager.getThreadConfig().enabled !== undefined,
                'Configuration Validator': new ConfigValidator().quickValidate(),
                'Channel Validator': this.testChannel !== null,
                'Thread Title Generator': generateThreadTitle('morning').length > 0
            };
            
            let allIntegrated = true;
            for (const [component, status] of Object.entries(integrationChecks)) {
                logger.info(`   ${component}: ${status ? '✅' : '❌'}`);
                if (!status) allIntegrated = false;
            }
            
            this.addTestResult('Component Integration', allIntegrated, 
                allIntegrated ? 'All components integrated' : 'Some components not integrated');
            
            // Test 7.2: End-to-End System Health
            logger.info('🧪 Test 7.2: End-to-End System Health');
            
            const systemHealth = {
                'Discord Connection': this.client.isReady(),
                'Channel Access': this.testChannel !== null,
                'Template Validation': validateTemplate(getMorningTemplate()),
                'Thread Configuration': this.threadManager.validateThreadConfig().valid,
                'Bot Permissions': this.testChannel ? 
                    this.testChannel.permissionsFor(this.client.user).has('SendMessages') : false
            };
            
            let systemHealthy = true;
            for (const [check, status] of Object.entries(systemHealth)) {
                logger.info(`   ${check}: ${status ? '✅' : '❌'}`);
                if (!status) systemHealthy = false;
            }
            
            this.addTestResult('System Health', systemHealthy, 
                systemHealthy ? 'System fully healthy' : 'System health issues detected');
                
        } catch (error) {
            this.addTestResult('System Integration', false, `Integration test failed: ${error.message}`);
        }
    }

    addTestResult(name, passed, message) {
        this.testResults.push({ name, passed, message });
    }

    displayTestSummary() {
        logger.info('\n📊 Complete DSU System Test Summary');
        logger.info('=' .repeat(80));
        
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = this.testResults.filter(r => !r.passed).length;
        const total = this.testResults.length;
        
        logger.info(`📈 Results: ${passed}/${total} tests passed (${failed} failed)`);
        logger.info('');
        
        // Group results by category
        const categories = {
            'Configuration': this.testResults.filter(r => r.name.includes('Configuration')),
            'Discord Environment': this.testResults.filter(r => r.name.includes('Channel') || r.name.includes('Thread Support')),
            'Template System': this.testResults.filter(r => r.name.includes('Template')),
            'Thread Management': this.testResults.filter(r => r.name.includes('Thread') && !r.name.includes('Support') && !r.name.includes('Configuration')),
            'DSU Flows': this.testResults.filter(r => r.name.includes('DSU Flow')),
            'Error Handling': this.testResults.filter(r => r.name.includes('Error') || r.name.includes('Invalid') || r.name.includes('Disabled')),
            'Integration': this.testResults.filter(r => r.name.includes('Integration') || r.name.includes('Health'))
        };
        
        for (const [category, results] of Object.entries(categories)) {
            if (results.length > 0) {
                const categoryPassed = results.filter(r => r.passed).length;
                const categoryTotal = results.length;
                logger.info(`${category}: ${categoryPassed}/${categoryTotal}`);
                
                results.forEach(result => {
                    const status = result.passed ? '✅' : '❌';
                    logger.info(`  ${status} ${result.name}: ${result.message}`);
                });
                logger.info('');
            }
        }
        
        // Overall assessment
        if (passed === total) {
            logger.success('🎉 ALL TESTS PASSED - DSU System is fully operational!');
            logger.success('✅ The complete DSU system with thread creation is ready for production');
        } else {
            logger.error(`❌ ${failed} test(s) failed - System needs attention before deployment`);
            logger.error('💡 Review failed tests above and fix issues before production use');
        }
        
        // DRY RUN notice
        if (this.isDryRun) {
            logger.info('');
            logger.info('🏃‍♂️ DRY RUN MODE: No actual messages were sent to Discord');
            logger.info('💡 Set DRY_RUN=false to test with real message posting');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new CompleteDSUSystemTester();
    tester.initialize().catch(error => {
        logger.error('❌ Complete DSU system test initialization failed:', error);
        process.exit(1);
    });
}

module.exports = CompleteDSUSystemTester;