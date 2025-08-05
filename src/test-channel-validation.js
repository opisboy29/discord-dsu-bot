/**
 * Channel Validation Test Script
 * 
 * @author opisboy29
 * @repository git@github.com:opisboy29/discord-dsu-bot.git
 * @description Comprehensive testing of Discord channel validation system
 */

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const ChannelValidator = require('./utils/channel-validator');
const logger = require('./utils/logger');

class ChannelValidationTester {
    constructor() {
        this.client = null;
        this.validator = null;
    }

    async initialize() {
        logger.startup('Channel Validation Tester', '1.0.0');

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.validator = new ChannelValidator(this.client);

        this.client.once('ready', async () => {
            logger.success(`🤖 Test client ready! Logged in as ${this.client.user.tag}`);
            await this.runValidationTests();
            
            // Exit after tests
            setTimeout(() => {
                this.client.destroy();
                process.exit(0);
            }, 2000);
        });

        this.client.on('error', (error) => {
            logger.error('❌ Discord client error:', error);
        });

        // Connect to Discord
        const token = process.env.DISCORD_BOT_TOKEN;
        if (!token) {
            logger.error('❌ DISCORD_BOT_TOKEN not found in environment');
            process.exit(1);
        }

        await this.client.login(token);
    }

    async runValidationTests() {
        logger.info('🧪 Starting comprehensive channel validation tests...');

        // Test 1: Primary channel validation
        await this.testPrimaryChannel();

        // Test 2: Invalid channel ID tests
        await this.testInvalidChannelIds();

        // Test 3: Permission boundary tests
        await this.testPermissionBoundaries();

        // Test 4: Error handling validation
        await this.testErrorHandling();

        logger.info('🎉 All channel validation tests completed');
    }

    async testPrimaryChannel() {
        logger.info('\n🧪 Test 1: Primary Channel Validation');
        
        const channelId = process.env.DSU_CHANNEL_ID;
        if (!channelId) {
            logger.error('❌ DSU_CHANNEL_ID not configured - skipping primary channel test');
            return;
        }

        try {
            const results = await this.validator.validateChannel(channelId);
            
            // Display detailed results
            logger.info('📊 Validation Results:');
            logger.info(`   Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
            logger.info(`   Errors: ${results.errors.length}`);
            logger.info(`   Warnings: ${results.warnings.length}`);

            if (results.channel) {
                logger.info(`   Channel: #${results.channel.name}`);
                logger.info(`   Guild: ${results.guild ? results.guild.name : 'Unknown'}`);
            }

            // Show permissions summary
            if (Object.keys(results.permissions).length > 0) {
                logger.info('   Permissions:');
                for (const [perm, info] of Object.entries(results.permissions)) {
                    const status = info.granted ? '✅' : '❌';
                    const required = info.required ? '[REQ]' : '[OPT]';
                    logger.info(`     ${status} ${required} ${perm}`);
                }
            }

            // Show errors and warnings
            if (results.errors.length > 0) {
                logger.error('   Errors:');
                results.errors.forEach(error => {
                    logger.error(`     • ${error.message}`);
                });
            }

            if (results.warnings.length > 0) {
                logger.warn('   Warnings:');
                results.warnings.forEach(warning => {
                    logger.warn(`     • ${warning.message}`);
                });
            }

            // Generate and display full report
            const report = this.validator.generateReport();
            logger.debug('Full Validation Report:', report);

        } catch (error) {
            logger.error('❌ Primary channel validation test failed:', error);
        }
    }

    async testInvalidChannelIds() {
        logger.info('\n🧪 Test 2: Invalid Channel ID Handling');

        const invalidIds = [
            { id: '', name: 'Empty string' },
            { id: 'invalid', name: 'Non-numeric string' },
            { id: '123', name: 'Too short ID' },
            { id: '12345678901234567890123456789', name: 'Too long ID' },
            { id: '000000000000000000', name: 'All zeros' },
            { id: '999999999999999999', name: 'Non-existent ID' }
        ];

        for (const testCase of invalidIds) {
            try {
                logger.info(`   Testing ${testCase.name}: "${testCase.id}"`);
                const validator = new ChannelValidator(this.client);
                const results = await validator.validateChannel(testCase.id);
                
                if (results.passed) {
                    logger.warn(`   ⚠️ Expected validation to fail for ${testCase.name}, but it passed`);
                } else {
                    logger.success(`   ✅ Correctly rejected ${testCase.name}`);
                    logger.debug(`      Error: ${results.errors[0]?.message || 'Unknown error'}`);
                }
            } catch (error) {
                logger.success(`   ✅ Correctly caught error for ${testCase.name}: ${error.message}`);
            }
        }
    }

    async testPermissionBoundaries() {
        logger.info('\n🧪 Test 3: Permission Boundary Testing');

        // This test validates that our permission checking logic works correctly
        // We can't actually remove permissions, but we can verify the checking logic

        const channelId = process.env.DSU_CHANNEL_ID;
        if (!channelId) {
            logger.warn('   ⚠️ DSU_CHANNEL_ID not configured - skipping permission tests');
            return;
        }

        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                logger.error('   ❌ Could not fetch channel for permission testing');
                return;
            }

            const permissions = channel.permissionsFor(this.client.user);
            const requiredPerms = ['ViewChannel', 'SendMessages', 'EmbedLinks', 'ReadMessageHistory'];

            logger.info('   Current bot permissions:');
            for (const perm of requiredPerms) {
                const hasPermission = permissions.has(perm);
                const status = hasPermission ? '✅' : '❌';
                logger.info(`     ${status} ${perm}`);
            }

            // Test permission checking logic
            const allRequired = requiredPerms.every(perm => permissions.has(perm));
            if (allRequired) {
                logger.success('   ✅ All required permissions are present');
            } else {
                logger.error('   ❌ Some required permissions are missing');
            }

        } catch (error) {
            logger.error('   ❌ Permission boundary test failed:', error);
        }
    }

    async testErrorHandling() {
        logger.info('\n🧪 Test 4: Error Handling Validation');

        // Test various error scenarios to ensure proper error handling

        const errorTests = [
            {
                name: 'Null channel ID',
                channelId: null,
                expectedError: 'MISSING_CHANNEL_ID'
            },
            {
                name: 'Undefined channel ID', 
                channelId: undefined,
                expectedError: 'MISSING_CHANNEL_ID'
            },
            {
                name: 'Invalid format',
                channelId: 'not-a-valid-id',
                expectedError: 'INVALID_CHANNEL_ID_FORMAT'
            }
        ];

        for (const test of errorTests) {
            try {
                logger.info(`   Testing ${test.name}...`);
                const validator = new ChannelValidator(this.client);
                const results = await validator.validateChannel(test.channelId);
                
                // Check if the expected error was caught
                const hasExpectedError = results.errors.some(error => 
                    error.code === test.expectedError
                );

                if (hasExpectedError) {
                    logger.success(`   ✅ Correctly handled ${test.name}`);
                } else {
                    logger.warn(`   ⚠️ Did not find expected error ${test.expectedError} for ${test.name}`);
                }

            } catch (error) {
                logger.success(`   ✅ Error correctly thrown for ${test.name}: ${error.message}`);
            }
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new ChannelValidationTester();
    tester.initialize().catch(error => {
        logger.error('❌ Channel validation test initialization failed:', error);
        process.exit(1);
    });
}

module.exports = ChannelValidationTester;