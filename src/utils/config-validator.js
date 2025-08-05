/**
 * Configuration Validation Utility
 * 
 * @author opisboy29
 * @repository git@github.com:opisboy29/discord-dsu-bot.git
 * @description Comprehensive environment configuration validation and setup verification
 */

const cron = require('node-cron');
const logger = require('./logger');

class ConfigValidator {
    constructor() {
        this.validationResults = {
            passed: false,
            errors: [],
            warnings: [],
            config: {},
            recommendations: []
        };
    }

    /**
     * Comprehensive configuration validation
     * @returns {Promise<Object>} Validation results
     */
    async validateConfiguration() {
        logger.info('🔍 Starting comprehensive configuration validation...');

        try {
            // Step 1: Validate required environment variables
            this.validateRequiredVars();

            // Step 2: Validate Discord configuration
            this.validateDiscordConfig();

            // Step 3: Validate scheduling configuration
            this.validateSchedulingConfig();

            // Step 4: Validate application configuration
            this.validateAppConfig();

            // Step 5: Validate template configuration
            this.validateTemplateConfig();

            // Step 6: Validate logging configuration
            this.validateLoggingConfig();

            // Step 7: Validate production settings
            this.validateProductionConfig();

            // Step 8: Security validation
            this.validateSecurityConfig();

            // Final assessment
            this.assessValidation();

            return this.validationResults;

        } catch (error) {
            this.addError('VALIDATION_SYSTEM_ERROR', `Configuration validation system error: ${error.message}`);
            this.validationResults.passed = false;
            return this.validationResults;
        }
    }

    validateRequiredVars() {
        logger.debug('🔍 Step 1: Validating required environment variables');

        const required = [
            {
                key: 'DISCORD_BOT_TOKEN',
                description: 'Discord bot token from Developer Portal',
                validator: (value) => {
                    if (!value) return 'Missing Discord bot token';
                    if (typeof value !== 'string') return 'Token must be a string';
                    if (value.length < 50) return 'Token appears too short (should be 50+ characters)';
                    if (!/^[A-Za-z0-9._-]+$/.test(value)) return 'Token contains invalid characters';
                    return null;
                }
            },
            {
                key: 'DSU_CHANNEL_ID',
                description: 'Discord channel ID for DSU messages',
                validator: (value) => {
                    if (!value) return 'Missing Discord channel ID';
                    if (!/^\d{17,19}$/.test(value)) return 'Channel ID must be 17-19 digits';
                    return null;
                }
            }
        ];

        let missingRequired = 0;
        for (const config of required) {
            const value = process.env[config.key];
            const error = config.validator(value);
            
            if (error) {
                this.addError(`INVALID_${config.key}`, `${config.description}: ${error}`);
                missingRequired++;
            } else {
                this.validationResults.config[config.key] = value;
                logger.debug(`✅ ${config.key} validated`);
            }
        }

        if (missingRequired === 0) {
            logger.success('✅ Required environment variables validated');
        }
    }

    validateDiscordConfig() {
        logger.debug('🔍 Step 2: Validating Discord configuration');

        // Validate mention configuration
        const mentionEveryone = process.env.MENTION_EVERYONE === 'true';
        const mentionHere = process.env.MENTION_HERE === 'true';
        
        if (mentionEveryone) {
            this.addWarning('MENTION_EVERYONE_ENABLED', '@everyone mentions enabled - use carefully to avoid spam');
        }

        // Validate role mentions
        const mentionRoles = process.env.MENTION_ROLES;
        if (mentionRoles) {
            const roles = mentionRoles.split(',');
            for (const role of roles) {
                if (!/^\d{17,19}$/.test(role.trim())) {
                    this.addError('INVALID_ROLE_ID', `Invalid role ID format: ${role.trim()}`);
                }
            }
        }

        // Validate user mentions
        const mentionUsers = process.env.MENTION_USERS;
        if (mentionUsers) {
            const users = mentionUsers.split(',');
            for (const user of users) {
                if (!/^\d{17,19}$/.test(user.trim())) {
                    this.addError('INVALID_USER_ID', `Invalid user ID format: ${user.trim()}`);
                }
            }
        }

        logger.success('✅ Discord configuration validated');
    }

    validateSchedulingConfig() {
        logger.debug('🔍 Step 3: Validating scheduling configuration');

        // Validate timezone
        const timezone = process.env.TIMEZONE || 'Asia/Jakarta';
        try {
            new Date().toLocaleString('en-US', { timeZone: timezone });
            this.validationResults.config.TIMEZONE = timezone;
        } catch (error) {
            this.addError('INVALID_TIMEZONE', `Invalid timezone: ${timezone}`);
        }

        // Validate cron expressions
        const morningSchedule = process.env.MORNING_SCHEDULE || '0 9 * * 1-5';
        const eveningSchedule = process.env.EVENING_SCHEDULE || '0 17 * * 1-5';

        if (!cron.validate(morningSchedule)) {
            this.addError('INVALID_MORNING_SCHEDULE', `Invalid morning cron expression: ${morningSchedule}`);
        } else {
            this.validationResults.config.MORNING_SCHEDULE = morningSchedule;
        }

        if (!cron.validate(eveningSchedule)) {
            this.addError('INVALID_EVENING_SCHEDULE', `Invalid evening cron expression: ${eveningSchedule}`);
        } else {
            this.validationResults.config.EVENING_SCHEDULE = eveningSchedule;
        }

        // Validate scheduling enabled
        const enableScheduling = process.env.ENABLE_SCHEDULING !== 'false';
        if (!enableScheduling) {
            this.addWarning('SCHEDULING_DISABLED', 'Automatic scheduling is disabled');
        }

        logger.success('✅ Scheduling configuration validated');
    }

    validateAppConfig() {
        logger.debug('🔍 Step 4: Validating application configuration');

        // Validate NODE_ENV
        const nodeEnv = process.env.NODE_ENV || 'development';
        const validEnvs = ['development', 'production', 'test'];
        if (!validEnvs.includes(nodeEnv)) {
            this.addWarning('INVALID_NODE_ENV', `NODE_ENV should be one of: ${validEnvs.join(', ')}`);
        }

        // Validate PORT
        const port = parseInt(process.env.PORT) || 3000;
        if (port < 1 || port > 65535) {
            this.addError('INVALID_PORT', `PORT must be between 1 and 65535, got: ${port}`);
        } else if (port < 1024 && nodeEnv === 'production') {
            this.addWarning('LOW_PORT_NUMBER', 'Using port < 1024 may require root privileges');
        }

        // Validate bot name
        const botName = process.env.BOT_NAME || 'DSU Discord Bot';
        if (botName.length > 100) {
            this.addWarning('LONG_BOT_NAME', 'Bot name is quite long, consider shortening');
        }

        this.validationResults.config.NODE_ENV = nodeEnv;
        this.validationResults.config.PORT = port;
        this.validationResults.config.BOT_NAME = botName;

        logger.success('✅ Application configuration validated');
    }

    validateTemplateConfig() {
        logger.debug('🔍 Step 5: Validating template configuration');

        // Validate colors
        const colors = ['MORNING_COLOR', 'EVENING_COLOR', 'SUCCESS_COLOR', 'WARNING_COLOR'];
        for (const colorKey of colors) {
            const color = process.env[colorKey];
            if (color && !/^[0-9A-Fa-f]{6}$/.test(color)) {
                this.addError(`INVALID_${colorKey}`, `${colorKey} must be 6-digit hex color without #, got: ${color}`);
            }
        }

        // Validate template format
        const templateFormat = process.env.TEMPLATE_FORMAT || 'full';
        const validFormats = ['full', 'compact', 'text'];
        if (!validFormats.includes(templateFormat)) {
            this.addError('INVALID_TEMPLATE_FORMAT', `TEMPLATE_FORMAT must be one of: ${validFormats.join(', ')}`);
        }

        // Validate message lengths
        const greetings = ['MORNING_GREETING', 'EVENING_GREETING', 'MORNING_FOOTER', 'EVENING_FOOTER'];
        for (const greetingKey of greetings) {
            const greeting = process.env[greetingKey];
            if (greeting && greeting.length > 500) {
                this.addWarning(`LONG_${greetingKey}`, `${greetingKey} is quite long (${greeting.length} chars)`);
            }
        }

        logger.success('✅ Template configuration validated');
    }

    validateLoggingConfig() {
        logger.debug('🔍 Step 6: Validating logging configuration');

        // Validate log level
        const logLevel = process.env.LOG_LEVEL || 'info';
        const validLevels = ['error', 'warn', 'info', 'debug'];
        if (!validLevels.includes(logLevel)) {
            this.addError('INVALID_LOG_LEVEL', `LOG_LEVEL must be one of: ${validLevels.join(', ')}`);
        }

        // Validate log rotation settings
        const rotationSize = parseInt(process.env.LOG_ROTATION_SIZE) || 10;
        if (rotationSize < 1 || rotationSize > 100) {
            this.addWarning('UNUSUAL_LOG_ROTATION_SIZE', `LOG_ROTATION_SIZE should be 1-100 MB, got: ${rotationSize}`);
        }

        const maxFiles = parseInt(process.env.LOG_MAX_FILES) || 5;
        if (maxFiles < 1 || maxFiles > 50) {
            this.addWarning('UNUSUAL_LOG_MAX_FILES', `LOG_MAX_FILES should be 1-50, got: ${maxFiles}`);
        }

        logger.success('✅ Logging configuration validated');
    }

    validateProductionConfig() {
        logger.debug('🔍 Step 7: Validating production configuration');

        const nodeEnv = process.env.NODE_ENV;
        if (nodeEnv === 'production') {
            // Production-specific validations
            if (process.env.DEBUG_MODE === 'true') {
                this.addWarning('DEBUG_MODE_IN_PRODUCTION', 'DEBUG_MODE enabled in production environment');
            }

            if (process.env.DRY_RUN === 'true') {
                this.addWarning('DRY_RUN_IN_PRODUCTION', 'DRY_RUN enabled in production environment');
            }

            if (!process.env.ENABLE_FILE_LOGGING || process.env.ENABLE_FILE_LOGGING !== 'true') {
                this.addWarning('NO_FILE_LOGGING_PRODUCTION', 'File logging disabled in production');
            }

            // Memory thresholds
            const memWarning = parseInt(process.env.MEMORY_WARNING_THRESHOLD) || 80;
            const memCritical = parseInt(process.env.MEMORY_CRITICAL_THRESHOLD) || 90;
            
            if (memCritical <= memWarning) {
                this.addError('INVALID_MEMORY_THRESHOLDS', 'MEMORY_CRITICAL_THRESHOLD must be higher than MEMORY_WARNING_THRESHOLD');
            }

            this.addRecommendation('PRODUCTION_READY', 'Consider using PM2 for production deployment: npm run pm2:start');
        }

        logger.success('✅ Production configuration validated');
    }

    validateSecurityConfig() {
        logger.debug('🔍 Step 8: Validating security configuration');

        // Validate rate limiting
        const rateWindow = parseInt(process.env.RATE_LIMIT_WINDOW) || 60000;
        const rateMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

        if (rateWindow < 1000) {
            this.addWarning('LOW_RATE_LIMIT_WINDOW', 'Rate limit window is very short, may cause issues');
        }

        if (rateMax < 10) {
            this.addWarning('LOW_RATE_LIMIT_MAX', 'Rate limit max requests is very low');
        }

        // Validate request timeout
        const timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;
        if (timeout < 5000) {
            this.addWarning('LOW_REQUEST_TIMEOUT', 'Request timeout is quite low, may cause timeouts');
        }

        // Security recommendations
        if (process.env.NODE_ENV === 'production') {
            this.addRecommendation('SECURITY_HEADERS', 'Consider adding security headers to HTTP endpoints');
            this.addRecommendation('HTTPS_ONLY', 'Use HTTPS in production for health check endpoints');
        }

        logger.success('✅ Security configuration validated');
    }

    assessValidation() {
        const hasErrors = this.validationResults.errors.length > 0;
        this.validationResults.passed = !hasErrors;

        if (this.validationResults.passed) {
            logger.success('🎉 Configuration validation completed successfully!');
            logger.info(`   ⚠️  Warnings: ${this.validationResults.warnings.length}`);
            logger.info(`   💡 Recommendations: ${this.validationResults.recommendations.length}`);
        } else {
            logger.error('❌ Configuration validation failed');
            logger.error(`   🚫 Errors: ${this.validationResults.errors.length}`);
            logger.error(`   ⚠️  Warnings: ${this.validationResults.warnings.length}`);
        }

        // Log all issues
        this.validationResults.errors.forEach(error => {
            logger.error(`❌ ${error.code}: ${error.message}`);
        });

        this.validationResults.warnings.forEach(warning => {
            logger.warn(`⚠️ ${warning.code}: ${warning.message}`);
        });

        this.validationResults.recommendations.forEach(rec => {
            logger.info(`💡 ${rec.code}: ${rec.message}`);
        });
    }

    addError(code, message) {
        this.validationResults.errors.push({ code, message });
    }

    addWarning(code, message) {
        this.validationResults.warnings.push({ code, message });
    }

    addRecommendation(code, message) {
        this.validationResults.recommendations.push({ code, message });
    }

    /**
     * Generate a detailed configuration report
     * @returns {string} Formatted configuration report
     */
    generateReport() {
        const results = this.validationResults;
        let report = '\n=== CONFIGURATION VALIDATION REPORT ===\n\n';

        // Validation Status
        report += `Validation Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;

        // Configuration Summary
        report += 'Configuration Summary:\n';
        for (const [key, value] of Object.entries(results.config)) {
            report += `  ${key}: ${this.maskSensitive(key, value)}\n`;
        }

        // Issues Summary
        report += `\nIssues Summary:\n`;
        report += `  Errors: ${results.errors.length}\n`;
        report += `  Warnings: ${results.warnings.length}\n`;
        report += `  Recommendations: ${results.recommendations.length}\n`;

        // Errors
        if (results.errors.length > 0) {
            report += '\nErrors (must fix before deployment):\n';
            results.errors.forEach((error, index) => {
                report += `  ${index + 1}. [${error.code}] ${error.message}\n`;
            });
        }

        // Warnings
        if (results.warnings.length > 0) {
            report += '\nWarnings (recommended to address):\n';
            results.warnings.forEach((warning, index) => {
                report += `  ${index + 1}. [${warning.code}] ${warning.message}\n`;
            });
        }

        // Recommendations
        if (results.recommendations.length > 0) {
            report += '\nRecommendations (for optimization):\n';
            results.recommendations.forEach((rec, index) => {
                report += `  ${index + 1}. [${rec.code}] ${rec.message}\n`;
            });
        }

        report += '\n=== END REPORT ===\n';
        return report;
    }

    maskSensitive(key, value) {
        const sensitiveKeys = ['TOKEN', 'KEY', 'PASSWORD', 'SECRET'];
        if (sensitiveKeys.some(sensitive => key.includes(sensitive))) {
            return value ? `${value.substring(0, 8)}...` : 'not set';
        }
        return value || 'default';
    }

    /**
     * Quick validation for essential configuration only
     * @returns {boolean} True if essential config is valid
     */
    quickValidate() {
        const token = process.env.DISCORD_BOT_TOKEN;
        const channelId = process.env.DSU_CHANNEL_ID;

        if (!token || token.length < 50) {
            logger.error('❌ Missing or invalid DISCORD_BOT_TOKEN');
            return false;
        }

        if (!channelId || !/^\d{17,19}$/.test(channelId)) {
            logger.error('❌ Missing or invalid DSU_CHANNEL_ID');
            return false;
        }

        return true;
    }
}

module.exports = ConfigValidator;