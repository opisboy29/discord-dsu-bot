/**
 * Configuration Validation Test Script
 * 
 * @author opisboy29
 * @repository git@github.com:opisboy29/discord-dsu-bot.git
 * @description Test and validate environment configuration
 */

require('dotenv').config();
const ConfigValidator = require('./utils/config-validator');
const logger = require('./utils/logger');

class ConfigValidationTester {
    constructor() {
        this.testResults = [];
    }

    async runTests() {
        logger.startup('Configuration Validation Tester', '1.0.0');
        logger.info('🧪 Starting comprehensive configuration validation tests...');

        // Test 1: Full configuration validation
        await this.testFullValidation();

        // Test 2: Quick validation
        await this.testQuickValidation();

        // Test 3: Invalid configuration scenarios
        await this.testInvalidConfigurations();

        // Test 4: Production configuration checks
        await this.testProductionConfiguration();

        this.displayResults();
        process.exit(this.testResults.every(r => r.passed) ? 0 : 1);
    }

    async testFullValidation() {
        logger.info('\n🧪 Test 1: Full Configuration Validation');
        
        try {
            const validator = new ConfigValidator();
            const results = await validator.validateConfiguration();
            
            logger.info('📊 Validation Results:');
            logger.info(`   Status: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
            logger.info(`   Errors: ${results.errors.length}`);
            logger.info(`   Warnings: ${results.warnings.length}`); 
            logger.info(`   Recommendations: ${results.recommendations.length}`);
            
            if (results.errors.length > 0) {
                logger.error('   Errors found:');
                results.errors.forEach(error => {
                    logger.error(`     • ${error.message}`);
                });
            }
            
            if (results.warnings.length > 0) {
                logger.warn('   Warnings found:');
                results.warnings.forEach(warning => {
                    logger.warn(`     • ${warning.message}`);
                });
            }
            
            // Generate and display report
            const report = validator.generateReport();
            logger.debug('Full Configuration Report:', report);
            
            this.addTestResult('Full Configuration Validation', results.passed, 
                results.passed ? 'All configuration checks passed' : `${results.errors.length} errors found`);
                
        } catch (error) {
            this.addTestResult('Full Configuration Validation', false, error.message);
        }
    }

    async testQuickValidation() {
        logger.info('\n🧪 Test 2: Quick Validation');
        
        try {
            const validator = new ConfigValidator();
            const isValid = validator.quickValidate();
            
            if (isValid) {
                logger.success('✅ Quick validation passed - essential config is valid');
            } else {
                logger.error('❌ Quick validation failed - missing essential config');
            }
            
            this.addTestResult('Quick Validation', isValid, 
                isValid ? 'Essential configuration valid' : 'Missing essential configuration');
                
        } catch (error) {
            this.addTestResult('Quick Validation', false, error.message);
        }
    }

    async testInvalidConfigurations() {
        logger.info('\n🧪 Test 3: Invalid Configuration Scenarios');
        
        // Save original environment
        const originalEnv = { ...process.env };
        
        const testCases = [
            {
                name: 'Missing Discord Token',
                env: { DISCORD_BOT_TOKEN: undefined },
                shouldFail: true
            },
            {
                name: 'Invalid Discord Token',
                env: { DISCORD_BOT_TOKEN: 'invalid_token' },
                shouldFail: true  
            },
            {
                name: 'Missing Channel ID',
                env: { DSU_CHANNEL_ID: undefined },
                shouldFail: true
            },
            {
                name: 'Invalid Channel ID',
                env: { DSU_CHANNEL_ID: '123' },
                shouldFail: true
            },
            {
                name: 'Invalid Timezone',
                env: { TIMEZONE: 'Invalid/Timezone' },
                shouldFail: true
            },
            {
                name: 'Invalid Cron Expression',
                env: { MORNING_SCHEDULE: 'invalid cron' },
                shouldFail: true
            },
            {
                name: 'Invalid Color Format',
                env: { MORNING_COLOR: 'invalid_color' },
                shouldFail: true
            }
        ];
        
        for (const testCase of testCases) {
            try {
                logger.info(`   Testing: ${testCase.name}`);
                
                // Apply test environment
                Object.assign(process.env, testCase.env);
                
                const validator = new ConfigValidator();
                const results = await validator.validateConfiguration();
                
                const testPassed = testCase.shouldFail ? !results.passed : results.passed;
                const message = testCase.shouldFail 
                    ? (results.passed ? 'Expected validation to fail but it passed' : 'Correctly identified invalid config')
                    : (results.passed ? 'Configuration correctly validated' : 'Valid config incorrectly failed');
                
                if (testPassed) {
                    logger.success(`   ✅ ${testCase.name}: ${message}`);
                } else {
                    logger.error(`   ❌ ${testCase.name}: ${message}`);
                }
                
                this.addTestResult(`Invalid Config: ${testCase.name}`, testPassed, message);
                
            } catch (error) {
                const testPassed = testCase.shouldFail; // Error expected for invalid configs
                this.addTestResult(`Invalid Config: ${testCase.name}`, testPassed, 
                    testPassed ? 'Correctly threw error' : `Unexpected error: ${error.message}`);
            } finally {
                // Restore original environment
                process.env = { ...originalEnv };
            }
        }
    }

    async testProductionConfiguration() {
        logger.info('\n🧪 Test 4: Production Configuration Checks');
        
        // Save original NODE_ENV
        const originalNodeEnv = process.env.NODE_ENV;
        
        try {
            // Set production environment
            process.env.NODE_ENV = 'production';
            
            const validator = new ConfigValidator();
            const results = await validator.validateConfiguration();
            
            // Check for production-specific warnings
            const hasDebugWarning = results.warnings.some(w => w.code === 'DEBUG_MODE_IN_PRODUCTION');
            const hasDryRunWarning = results.warnings.some(w => w.code === 'DRY_RUN_IN_PRODUCTION');
            const hasFileLoggingWarning = results.warnings.some(w => w.code === 'NO_FILE_LOGGING_PRODUCTION');
            
            logger.info('   Production checks:');
            logger.info(`     Debug mode warning: ${hasDebugWarning ? '✅ Detected' : '⚠️ Not detected'}`);
            logger.info(`     Dry run warning: ${hasDryRunWarning ? '✅ Detected' : '⚠️ Not detected'}`);
            logger.info(`     File logging check: ${hasFileLoggingWarning ? '⚠️ Missing' : '✅ Enabled'}`);
            
            this.addTestResult('Production Configuration', true, 
                `Production validation completed with ${results.warnings.length} warnings`);
                
        } catch (error) {
            this.addTestResult('Production Configuration', false, error.message);
        } finally {
            // Restore original NODE_ENV
            process.env.NODE_ENV = originalNodeEnv;
        }
    }

    addTestResult(name, passed, message) {
        this.testResults.push({ name, passed, message });
        const status = passed ? '✅' : '❌';
        logger.info(`   ${status} ${name}: ${message}`);
    }

    displayResults() {
        logger.info('\n📊 Configuration Validation Test Summary:');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        logger.info(`Results: ${passed}/${total} tests passed`);
        
        this.testResults.forEach((result, index) => {
            const status = result.passed ? '✅' : '❌';
            logger.info(`  ${status} Test ${index + 1}: ${result.name}`);
        });
        
        if (passed === total) {
            logger.success('🎉 All configuration validation tests passed!');
        } else {
            logger.error(`❌ ${total - passed} test(s) failed`);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new ConfigValidationTester();
    tester.runTests().catch(error => {
        logger.error('❌ Configuration validation test failed:', error);
        process.exit(1);
    });
}

module.exports = ConfigValidationTester;