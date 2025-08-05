/**
 * Discord Channel Validation Utility
 * 
 * @author opisboy29
 * @repository git@github.com:opisboy29/discord-dsu-bot.git
 * @description Comprehensive Discord channel access validation and diagnostics
 */

const logger = require('./logger');

class ChannelValidator {
    constructor(client) {
        this.client = client;
        this.validationResults = {
            channelId: null,
            channel: null,
            guild: null,
            permissions: {},
            errors: [],
            warnings: [],
            passed: false
        };
    }

    /**
     * Comprehensive channel validation with detailed diagnostics
     * @param {string} channelId - Discord channel ID to validate
     * @returns {Promise<Object>} Validation results object
     */
    async validateChannel(channelId) {
        try {
            this.validationResults.channelId = channelId;
            logger.info(`🔍 Starting comprehensive channel validation for ID: ${channelId}`);

            // Step 1: Basic channel ID validation
            await this.validateChannelId(channelId);

            // Step 2: Fetch and validate channel existence
            await this.fetchAndValidateChannel(channelId);

            // Step 3: Validate channel type
            await this.validateChannelType();

            // Step 4: Validate guild access
            await this.validateGuildAccess();

            // Step 5: Validate bot permissions
            await this.validateBotPermissions();

            // Step 6: Test message sending capability
            await this.testMessageSending();

            // Step 7: Validate embed support
            await this.validateEmbedSupport();

            // Final assessment
            this.assessValidationResults();

            return this.validationResults;

        } catch (error) {
            this.addError('VALIDATION_FAILED', `Channel validation failed: ${error.message}`);
            this.validationResults.passed = false;
            return this.validationResults;
        }
    }

    async validateChannelId(channelId) {
        logger.debug('🔍 Step 1: Validating channel ID format');

        if (!channelId) {
            this.addError('MISSING_CHANNEL_ID', 'DSU_CHANNEL_ID is not configured in environment variables');
            throw new Error('Missing channel ID');
        }

        // Validate Discord snowflake format
        if (!/^\d{17,19}$/.test(channelId)) {
            this.addError('INVALID_CHANNEL_ID_FORMAT', `Invalid channel ID format: ${channelId}. Discord IDs should be 17-19 digits.`);
            throw new Error('Invalid channel ID format');
        }

        // Check if it's a valid snowflake timestamp
        try {
            const timestamp = (BigInt(channelId) >> 22n) + 1420070400000n;
            const date = new Date(Number(timestamp));
            
            if (date.getTime() < 1420070400000 || date.getTime() > Date.now()) {
                this.addWarning('SUSPICIOUS_CHANNEL_ID', 'Channel ID timestamp seems unusual');
            }
        } catch (error) {
            this.addWarning('CHANNEL_ID_PARSE_ERROR', 'Could not parse channel ID timestamp');
        }

        logger.success('✅ Channel ID format validation passed');
    }

    async fetchAndValidateChannel(channelId) {
        logger.debug('🔍 Step 2: Fetching channel from Discord API');

        try {
            this.validationResults.channel = await this.client.channels.fetch(channelId);
            
            if (!this.validationResults.channel) {
                this.addError('CHANNEL_NOT_FOUND', `Channel with ID ${channelId} was not found`);
                throw new Error('Channel not found');
            }

            logger.success(`✅ Channel found: #${this.validationResults.channel.name}`);

        } catch (error) {
            if (error.code === 10003) {
                this.addError('UNKNOWN_CHANNEL', 'Channel does not exist or bot cannot access it');
            } else if (error.code === 50001) {
                this.addError('MISSING_ACCESS', 'Bot does not have access to this channel');
            } else {
                this.addError('FETCH_ERROR', `Failed to fetch channel: ${error.message}`);
            }
            throw error;
        }
    }

    async validateChannelType() {
        logger.debug('🔍 Step 3: Validating channel type');

        const channel = this.validationResults.channel;
        const validTypes = [0, 5]; // GUILD_TEXT = 0, GUILD_ANNOUNCEMENT = 5

        if (!validTypes.includes(channel.type)) {
            const typeNames = {
                0: 'Text Channel',
                1: 'DM Channel',
                2: 'Voice Channel',
                3: 'Group DM',
                4: 'Category',
                5: 'Announcement Channel',
                10: 'News Thread',
                11: 'Public Thread',
                12: 'Private Thread',
                13: 'Stage Voice',
                15: 'Forum Channel'
            };

            const typeName = typeNames[channel.type] || `Unknown (${channel.type})`;
            this.addError('INVALID_CHANNEL_TYPE', `Channel is ${typeName}. DSU messages require a Text or Announcement channel.`);
            throw new Error('Invalid channel type');
        }

        logger.success(`✅ Channel type validation passed: ${channel.type === 0 ? 'Text Channel' : 'Announcement Channel'}`);
    }

    async validateGuildAccess() {
        logger.debug('🔍 Step 4: Validating guild access');

        const channel = this.validationResults.channel;
        
        if (!channel.guild) {
            this.addError('NO_GUILD', 'Channel is not in a guild (server)');
            throw new Error('Channel not in guild');
        }

        this.validationResults.guild = channel.guild;

        // Check if bot is member of the guild
        try {
            const botMember = await channel.guild.members.fetch(this.client.user.id);
            if (!botMember) {
                this.addError('BOT_NOT_MEMBER', 'Bot is not a member of this guild');
                throw new Error('Bot not guild member');
            }
        } catch (error) {
            this.addError('GUILD_ACCESS_ERROR', `Cannot verify guild membership: ${error.message}`);
            throw error;
        }

        logger.success(`✅ Guild access validated: ${channel.guild.name} (${channel.guild.memberCount} members)`);
    }

    async validateBotPermissions() {
        logger.debug('🔍 Step 5: Validating bot permissions');

        const channel = this.validationResults.channel;
        const permissions = channel.permissionsFor(this.client.user);
        
        if (!permissions) {
            this.addError('PERMISSIONS_CHECK_FAILED', 'Could not check bot permissions');
            throw new Error('Permission check failed');
        }

        const requiredPermissions = {
            'ViewChannel': 'View the channel',
            'SendMessages': 'Send messages',
            'EmbedLinks': 'Send rich embeds',
            'ReadMessageHistory': 'Read message history'
        };

        const optionalPermissions = {
            'ManageMessages': 'Delete messages (for cleanup)',
            'AddReactions': 'Add reactions to messages',
            'UseExternalEmojis': 'Use custom emojis'
        };

        // Check required permissions
        const missingRequired = [];
        for (const [perm, description] of Object.entries(requiredPermissions)) {
            const hasPermission = permissions.has(perm);
            this.validationResults.permissions[perm] = {
                granted: hasPermission,
                required: true,
                description
            };

            if (!hasPermission) {
                missingRequired.push(perm);
            }
        }

        // Check optional permissions
        for (const [perm, description] of Object.entries(optionalPermissions)) {
            const hasPermission = permissions.has(perm);
            this.validationResults.permissions[perm] = {
                granted: hasPermission,
                required: false,
                description
            };

            if (!hasPermission) {
                this.addWarning('MISSING_OPTIONAL_PERMISSION', `Optional permission missing: ${perm} (${description})`);
            }
        }

        if (missingRequired.length > 0) {
            this.addError('MISSING_REQUIRED_PERMISSIONS', `Missing required permissions: ${missingRequired.join(', ')}`);
            throw new Error('Missing required permissions');
        }

        logger.success('✅ Bot permissions validation passed');
    }

    async testMessageSending() {
        logger.debug('🔍 Step 6: Testing message sending capability');

        const channel = this.validationResults.channel;
        
        try {
            // Send a simple test message
            const testMessage = await channel.send('🧪 DSU Bot validation test - this message will be deleted shortly');
            
            if (!testMessage || !testMessage.id) {
                this.addError('MESSAGE_SEND_FAILED', 'Failed to send test message');
                throw new Error('Message sending failed');
            }

            // Try to delete the test message to clean up
            setTimeout(async () => {
                try {
                    await testMessage.delete();
                    logger.debug('🧹 Test message cleaned up');
                } catch (cleanupError) {
                    logger.debug('Could not clean up test message:', cleanupError.message);
                }
            }, 3000);

            logger.success('✅ Message sending test passed');

        } catch (error) {
            if (error.code === 50013) {
                this.addError('INSUFFICIENT_PERMISSIONS', 'Bot lacks permission to send messages');
            } else if (error.code === 50035) {
                this.addError('INVALID_MESSAGE', 'Message format is invalid');
            } else {
                this.addError('MESSAGE_SEND_ERROR', `Message sending failed: ${error.message}`);
            }
            throw error;
        }
    }

    async validateEmbedSupport() {
        logger.debug('🔍 Step 7: Validating embed support');

        const channel = this.validationResults.channel;

        try {
            // Test embed sending
            const testEmbed = {
                title: '🧪 DSU Bot Embed Test',
                description: 'Testing embed functionality - will be deleted shortly',
                color: 0x00ff00,
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'DSU Bot Validation Test'
                }
            };

            const embedMessage = await channel.send({ embeds: [testEmbed] });

            if (!embedMessage || !embedMessage.embeds || embedMessage.embeds.length === 0) {
                this.addError('EMBED_SEND_FAILED', 'Embed message did not send properly');
                throw new Error('Embed validation failed');
            }

            // Clean up test embed
            setTimeout(async () => {
                try {
                    await embedMessage.delete();
                    logger.debug('🧹 Test embed cleaned up');
                } catch (cleanupError) {
                    logger.debug('Could not clean up test embed:', cleanupError.message);
                }
            }, 3000);

            logger.success('✅ Embed support validation passed');

        } catch (error) {
            if (error.code === 50013) {
                this.addError('EMBED_PERMISSION_DENIED', 'Bot lacks permission to send embeds');
            } else {
                this.addError('EMBED_TEST_FAILED', `Embed test failed: ${error.message}`);
            }
            throw error;
        }
    }

    assessValidationResults() {
        const hasErrors = this.validationResults.errors.length > 0;
        this.validationResults.passed = !hasErrors;

        if (this.validationResults.passed) {
            logger.success('🎉 Channel validation completed successfully!');
            logger.info(`   📍 Channel: #${this.validationResults.channel.name}`);
            logger.info(`   🏰 Guild: ${this.validationResults.guild.name}`);
            logger.info(`   ⚠️  Warnings: ${this.validationResults.warnings.length}`);
        } else {
            logger.error('❌ Channel validation failed');
            logger.error(`   🚫 Errors: ${this.validationResults.errors.length}`);
            logger.error(`   ⚠️  Warnings: ${this.validationResults.warnings.length}`);
        }
    }

    addError(code, message) {
        this.validationResults.errors.push({ code, message });
        logger.error(`❌ ${code}: ${message}`);
    }

    addWarning(code, message) {
        this.validationResults.warnings.push({ code, message });
        logger.warn(`⚠️ ${code}: ${message}`);
    }

    /**
     * Generate a detailed validation report
     * @returns {string} Formatted validation report
     */
    generateReport() {
        const results = this.validationResults;
        let report = '\n=== DISCORD CHANNEL VALIDATION REPORT ===\n\n';

        // Basic Information
        report += `Channel ID: ${results.channelId}\n`;
        if (results.channel) {
            report += `Channel Name: #${results.channel.name}\n`;
            report += `Channel Type: ${results.channel.type === 0 ? 'Text Channel' : 'Other'}\n`;
        }
        if (results.guild) {
            report += `Guild: ${results.guild.name} (${results.guild.memberCount} members)\n`;
        }

        // Validation Status
        report += `\nValidation Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}\n`;

        // Permissions
        if (Object.keys(results.permissions).length > 0) {
            report += '\nPermissions:\n';
            for (const [perm, info] of Object.entries(results.permissions)) {
                const status = info.granted ? '✅' : '❌';
                const required = info.required ? '(Required)' : '(Optional)';
                report += `  ${status} ${perm} ${required}: ${info.description}\n`;
            }
        }

        // Errors
        if (results.errors.length > 0) {
            report += '\nErrors:\n';
            results.errors.forEach((error, index) => {
                report += `  ${index + 1}. [${error.code}] ${error.message}\n`;
            });
        }

        // Warnings
        if (results.warnings.length > 0) {
            report += '\nWarnings:\n';
            results.warnings.forEach((warning, index) => {
                report += `  ${index + 1}. [${warning.code}] ${warning.message}\n`;
            });
        }

        // Recommendations
        report += '\nRecommendations:\n';
        if (results.errors.length > 0) {
            report += '  • Fix all errors before deploying the bot\n';
            report += '  • Ensure the bot has proper permissions in the target channel\n';
            report += '  • Verify the channel ID in your .env file is correct\n';
        } else {
            report += '  • Channel validation passed - bot is ready for deployment\n';
            if (results.warnings.length > 0) {
                report += '  • Consider addressing warnings for optimal functionality\n';
            }
        }

        report += '\n=== END REPORT ===\n';

        return report;
    }
}

module.exports = ChannelValidator;