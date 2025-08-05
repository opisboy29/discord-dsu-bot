/**
 * DSU Scheduler - Automated Daily Standup Updates
 * 
 * @author opisboy29
 * @repository git@github.com:opisboy29/discord-dsu-bot.git
 * @description Cron-based scheduler for Discord DSU reminders at 9AM & 5PM WIB
 */

const cron = require('node-cron');
const { getMorningTemplate, getEveningTemplate, generateThreadTitle } = require('../../config/dsu-templates');
const logger = require('../utils/logger');
const ThreadManager = require('../utils/thread-manager');

class DSUScheduler {
    constructor() {
        this.morningJob = null;
        this.eveningJob = null;
        this.client = null;
        this.timezone = process.env.TIMEZONE || 'Asia/Jakarta';
        this.morningCron = process.env.MORNING_SCHEDULE || '0 9 * * 1-5';
        this.eveningCron = process.env.EVENING_SCHEDULE || '0 17 * * 1-5';
        this.threadManager = new ThreadManager();
    }

    start(discordClient) {
        this.client = discordClient;
        
        // Validate cron expressions
        if (!this.validateCronExpressions()) {
            logger.error('Invalid cron expressions provided, using defaults');
            this.morningCron = '0 9 * * 1-5';
            this.eveningCron = '0 17 * * 1-5';
        }
        
        // Log current timezone and schedule
        this.logTimezoneInfo();
        
        // Schedule morning DSU with configurable cron and timezone
        logger.info(`🌅 Setting up morning DSU with cron: ${this.morningCron}`);
        this.morningJob = cron.schedule(this.morningCron, async () => {
            if (this.isWeekday()) {
                await this.sendMorningDSU();
            } else {
                logger.info('🚫 Skipping morning DSU - Weekend detected');
            }
        }, {
            scheduled: true,
            timezone: this.timezone
        });

        // Schedule evening DSU with configurable cron and timezone
        logger.info(`🌆 Setting up evening DSU with cron: ${this.eveningCron}`);
        this.eveningJob = cron.schedule(this.eveningCron, async () => {
            if (this.isWeekday()) {
                await this.sendEveningDSU();
            } else {
                logger.info('🚫 Skipping evening DSU - Weekend detected');
            }
        }, {
            scheduled: true,
            timezone: this.timezone
        });

        // Log next scheduled times
        this.logNextScheduledTimes();
        
        logger.success('✅ DSU Scheduler initialized successfully');
        logger.info(`   🌅 Morning DSU: ${this.getReadableSchedule(this.morningCron)} ${this.timezone}`);
        logger.info(`   🌆 Evening DSU: ${this.getReadableSchedule(this.eveningCron)} ${this.timezone}`);
    }

    async sendMorningDSU() {
        try {
            const currentTime = new Date().toLocaleString('en-US', {
                timeZone: this.timezone,
                weekday: 'long',
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            logger.info(`🌅 Attempting to send morning DSU at ${currentTime}`);
            
            const channelId = process.env.DSU_CHANNEL_ID;
            if (!channelId) {
                logger.error('DSU_CHANNEL_ID not configured in environment variables');
                return;
            }

            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                logger.error(`Could not find channel with ID: ${channelId}`);
                return;
            }

            const template = getMorningTemplate();
            const message = await channel.send(template);
            
            logger.dsu(`Morning DSU reminder sent successfully to #${channel.name} at ${currentTime}`);
            logger.debug(`Message ID: ${message.id}`);
            
            // Create thread for morning DSU discussion
            await this.createDSUThread(message, 'morning');
            
            // Log rotation check
            logger.rotateLogIfNeeded('dsu.log');
        } catch (error) {
            logger.error('Error sending morning DSU:', error);
        }
    }

    async sendEveningDSU() {
        try {
            const currentTime = new Date().toLocaleString('en-US', {
                timeZone: this.timezone,
                weekday: 'long',
                year: 'numeric',
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            logger.info(`🌆 Attempting to send evening DSU at ${currentTime}`);
            
            const channelId = process.env.DSU_CHANNEL_ID;
            if (!channelId) {
                logger.error('DSU_CHANNEL_ID not configured in environment variables');
                return;
            }

            const channel = await this.client.channels.fetch(channelId);
            if (!channel) {
                logger.error(`Could not find channel with ID: ${channelId}`);
                return;
            }

            const template = getEveningTemplate();
            const message = await channel.send(template);
            
            logger.dsu(`Evening DSU reminder sent successfully to #${channel.name} at ${currentTime}`);
            logger.debug(`Message ID: ${message.id}`);
            
            // Create thread for evening DSU discussion
            await this.createDSUThread(message, 'evening');
            
            // Log rotation check
            logger.rotateLogIfNeeded('dsu.log');
        } catch (error) {
            logger.error('Error sending evening DSU:', error);
        }
    }

    /**
     * Create a discussion thread for DSU message
     * @param {Message} message - The DSU message to create thread from
     * @param {string} type - 'morning' or 'evening'
     */
    async createDSUThread(message, type) {
        try {
            // Generate thread title using template function
            const threadTitle = generateThreadTitle(type);
            
            // Create thread using thread manager
            const thread = await this.threadManager.createDSUThread(message, threadTitle, type);
            
            if (thread) {
                logger.success(`🧵 ${type} DSU thread created: #${thread.name}`);
            }
            
        } catch (error) {
            logger.error(`Failed to create ${type} DSU thread:`, error);
            // Don't throw error - thread creation failure shouldn't stop DSU posting
        }
    }

    stop() {
        if (this.morningJob) {
            this.morningJob.stop();
            logger.info('Morning DSU scheduler stopped');
        }
        
        if (this.eveningJob) {
            this.eveningJob.stop();
            logger.info('Evening DSU scheduler stopped');
        }
        
        logger.info('All DSU schedulers stopped successfully');
    }

    // Utility methods for enhanced scheduling
    
    /**
     * Check if current day is a weekday (Monday-Friday)
     * Uses the configured timezone for accurate day detection
     */
    isWeekday() {
        const now = new Date();
        const localTime = new Date(now.toLocaleString('en-US', { timeZone: this.timezone }));
        const dayOfWeek = localTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        
        logger.debug(`Current day: ${dayOfWeek} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek]}), Is weekday: ${isWeekday}`);
        return isWeekday;
    }
    
    /**
     * Validate cron expressions format
     */
    validateCronExpressions() {
        try {
            const morningValid = cron.validate(this.morningCron);
            const eveningValid = cron.validate(this.eveningCron);
            
            if (!morningValid) {
                logger.error(`Invalid morning cron expression: ${this.morningCron}`);
            }
            if (!eveningValid) {
                logger.error(`Invalid evening cron expression: ${this.eveningCron}`);
            }
            
            return morningValid && eveningValid;
        } catch (error) {
            logger.error('Error validating cron expressions:', error);
            return false;
        }
    }
    
    /**
     * Log timezone and current time information
     */
    logTimezoneInfo() {
        const now = new Date();
        const localTime = now.toLocaleString('en-US', {
            timeZone: this.timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        logger.info('🌏 Timezone Configuration:');
        logger.info(`   Timezone: ${this.timezone}`);
        logger.info(`   Current time: ${localTime}`);
        logger.info(`   Is weekday: ${this.isWeekday() ? 'Yes' : 'No'}`);
    }
    
    /**
     * Convert cron expression to human-readable format
     */
    getReadableSchedule(cronExpression) {
        try {
            const parts = cronExpression.split(' ');
            if (parts.length >= 5) {
                const minute = parts[0];
                const hour = parts[1];
                const dayOfWeek = parts[4];
                
                let timeStr = '';
                if (hour !== '*' && minute !== '*') {
                    const hourNum = parseInt(hour);
                    const minNum = parseInt(minute);
                    const ampm = hourNum >= 12 ? 'PM' : 'AM';
                    const displayHour = hourNum > 12 ? hourNum - 12 : (hourNum === 0 ? 12 : hourNum);
                    timeStr = `${displayHour}:${minNum.toString().padStart(2, '0')} ${ampm}`;
                }
                
                let dayStr = '';
                if (dayOfWeek === '1-5') {
                    dayStr = ' (Mon-Fri)';
                } else if (dayOfWeek === '*') {
                    dayStr = ' (Daily)';
                } else {
                    dayStr = ` (DOW: ${dayOfWeek})`;
                }
                
                return timeStr + dayStr;
            }
            return cronExpression;
        } catch (error) {
            return cronExpression;
        }
    }
    
    /**
     * Log next scheduled execution times
     */
    logNextScheduledTimes() {
        try {
            // This is approximate - actual next execution depends on node-cron internal logic
            const now = new Date();
            const today = new Date(now.toLocaleString('en-US', { timeZone: this.timezone }));
            
            logger.info('📅 Next scheduled executions (approximate):');
            
            // Find next weekday
            let nextWeekday = new Date(today);
            while (nextWeekday.getDay() === 0 || nextWeekday.getDay() === 6) {
                nextWeekday.setDate(nextWeekday.getDate() + 1);
            }
            
            const nextWeekdayStr = nextWeekday.toLocaleDateString('en-US', {
                timeZone: this.timezone,
                weekday: 'long',
                month: 'short',
                day: 'numeric'
            });
            
            logger.info(`   🌅 Next morning DSU: ${this.getReadableSchedule(this.morningCron)} on ${nextWeekdayStr}`);
            logger.info(`   🌆 Next evening DSU: ${this.getReadableSchedule(this.eveningCron)} on ${nextWeekdayStr}`);
        } catch (error) {
            logger.debug('Could not calculate next scheduled times:', error);
        }
    }
    
    // Get current schedule status
    getStatus() {
        return {
            morningJobRunning: this.morningJob ? this.morningJob.running : false,
            eveningJobRunning: this.eveningJob ? this.eveningJob.running : false,
            timezone: `${this.timezone} (WIB)`,
            cronExpressions: {
                morning: this.morningCron,
                evening: this.eveningCron
            },
            schedule: {
                morning: this.getReadableSchedule(this.morningCron),
                evening: this.getReadableSchedule(this.eveningCron)
            },
            currentTime: new Date().toLocaleString('en-US', {
                timeZone: this.timezone,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            isWeekday: this.isWeekday(),
            threadConfig: this.threadManager.getThreadConfig()
        };
    }
}

// Export singleton instance
module.exports = new DSUScheduler();