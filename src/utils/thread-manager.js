/**
 * Thread Management Utility
 * 
 * @author opisboy29
 * @repository git@github.com:opisboy29/discord-dsu-bot.git
 * @description Manages automatic thread creation for DSU messages
 */

const logger = require('./logger');

class ThreadManager {
    constructor() {
        this.threadConfig = {
            enabled: process.env.ENABLE_AUTO_THREADS !== 'false',
            autoArchiveDuration: parseInt(process.env.THREAD_AUTO_ARCHIVE_DURATION) || 1440, // 24 hours in minutes
            reason: process.env.THREAD_CREATION_REASON || 'Automated DSU discussion thread'
        };
    }

    /**
     * Create a thread from a DSU message
     * @param {Message} message - The Discord message to create thread from
     * @param {string} threadTitle - The title for the thread
     * @param {string} type - 'morning' or 'evening'
     * @returns {Promise<Thread|null>} Created thread or null if failed
     */
    async createDSUThread(message, threadTitle, type) {
        if (!this.threadConfig.enabled) {
            logger.info('🧵 Auto-thread creation is disabled');
            return null;
        }

        try {
            logger.info(`🧵 Creating ${type} DSU thread: "${threadTitle}"`);

            // Validate message and channel
            if (!message || !message.channel) {
                throw new Error('Invalid message or channel for thread creation');
            }

            // Check if channel supports threads
            if (!this.channelSupportsThreads(message.channel)) {
                logger.warn(`🚫 Channel #${message.channel.name} does not support threads`);
                return null;
            }

            // Check bot permissions for thread creation
            const permissions = message.channel.permissionsFor(message.client.user);
            if (!permissions.has('CreatePublicThreads')) {
                logger.error('❌ Bot missing CREATE_PUBLIC_THREADS permission');
                return null;
            }

            // Create the thread
            const thread = await message.startThread({
                name: threadTitle,
                autoArchiveDuration: this.threadConfig.autoArchiveDuration,
                reason: this.threadConfig.reason
            });

            if (thread) {
                logger.success(`✅ ${type} DSU thread created successfully`);
                logger.info(`   📍 Thread: #${thread.name}`);
                logger.info(`   🆔 Thread ID: ${thread.id}`);
                logger.info(`   ⏰ Auto-archive: ${this.threadConfig.autoArchiveDuration} minutes`);

                // Send an initial message to the thread if configured
                await this.sendInitialThreadMessage(thread, type);

                return thread;
            } else {
                throw new Error('Thread creation returned null');
            }

        } catch (error) {
            logger.error(`❌ Failed to create ${type} DSU thread:`, error);
            
            // Handle specific Discord API errors
            if (error.code === 50013) {
                logger.error('💡 Missing permissions - ensure bot has CREATE_PUBLIC_THREADS permission');
            } else if (error.code === 50035) {
                logger.error('💡 Invalid thread name - check thread title format');
            } else if (error.code === 160002) {
                logger.error('💡 Channel does not support threads');
            }

            return null;
        }
    }

    /**
     * Check if channel supports thread creation
     * @param {Channel} channel - Discord channel to check
     * @returns {boolean} True if channel supports threads
     */
    channelSupportsThreads(channel) {
        // Text channels (0) and announcement channels (5) support threads
        const supportedTypes = [0, 5];
        return supportedTypes.includes(channel.type);
    }

    /**
     * Send initial message to thread
     * @param {Thread} thread - The created thread
     * @param {string} type - 'morning' or 'evening'
     */
    async sendInitialThreadMessage(thread, type) {
        const sendInitialMessage = process.env.SEND_INITIAL_THREAD_MESSAGE !== 'false';
        
        if (!sendInitialMessage) {
            return;
        }

        try {
            const messages = {
                morning: process.env.MORNING_THREAD_MESSAGE || 
                    '🧵 **Welcome to the Morning DSU Discussion!**\n\n' +
                    'Use this thread to:\n' +
                    '• Share your yesterday\'s accomplishments\n' +
                    '• Discuss today\'s goals and priorities\n' +
                    '• Ask for help with blockers\n' +
                    '• Collaborate and support each other\n\n' +
                    '*This thread will auto-archive in 24 hours.*',
                
                evening: process.env.EVENING_THREAD_MESSAGE || 
                    '🧵 **Welcome to the Evening DSU Discussion!**\n\n' +
                    'Use this thread to:\n' +
                    '• Celebrate today\'s achievements\n' +
                    '• Share progress updates\n' +
                    '• Discuss tomorrow\'s plans\n' +
                    '• Reflect on learnings and insights\n\n' +
                    '*This thread will auto-archive in 24 hours.*'
            };

            const message = messages[type] || messages.morning;
            await thread.send(message);
            
            logger.debug(`📝 Initial ${type} thread message sent`);

        } catch (error) {
            logger.warn(`⚠️ Failed to send initial ${type} thread message:`, error.message);
        }
    }

    /**
     * Get thread configuration status
     * @returns {Object} Thread configuration information
     */
    getThreadConfig() {
        return {
            enabled: this.threadConfig.enabled,
            autoArchiveDuration: this.threadConfig.autoArchiveDuration,
            autoArchiveDurationHours: Math.round(this.threadConfig.autoArchiveDuration / 60),
            reason: this.threadConfig.reason,
            sendInitialMessage: process.env.SEND_INITIAL_THREAD_MESSAGE !== 'false',
            customTitles: {
                morning: process.env.MORNING_THREAD_TITLE || 'Default',
                evening: process.env.EVENING_THREAD_TITLE || 'Default'
            }
        };
    }

    /**
     * Validate thread configuration
     * @returns {Object} Validation results
     */
    validateThreadConfig() {
        const results = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Validate auto-archive duration
        const validDurations = [60, 1440, 4320, 10080]; // 1 hour, 1 day, 3 days, 1 week
        if (!validDurations.includes(this.threadConfig.autoArchiveDuration)) {
            results.warnings.push(
                `AUTO_ARCHIVE_DURATION ${this.threadConfig.autoArchiveDuration} is not a standard value. ` +
                `Recommended: ${validDurations.join(', ')} minutes`
            );
        }

        // Validate thread reason length
        if (this.threadConfig.reason.length > 512) {
            results.errors.push('THREAD_CREATION_REASON exceeds 512 character limit');
            results.valid = false;
        }

        // Check thread title lengths
        const morningTitle = process.env.MORNING_THREAD_TITLE;
        const eveningTitle = process.env.EVENING_THREAD_TITLE;
        
        if (morningTitle && morningTitle.length > 100) {
            results.errors.push('MORNING_THREAD_TITLE exceeds 100 character limit');
            results.valid = false;
        }
        
        if (eveningTitle && eveningTitle.length > 100) {
            results.errors.push('EVENING_THREAD_TITLE exceeds 100 character limit');
            results.valid = false;
        }

        return results;
    }

    /**
     * Enable or disable auto-thread creation
     * @param {boolean} enabled - Whether to enable auto-threads
     */
    setThreadEnabled(enabled) {
        this.threadConfig.enabled = enabled;
        logger.info(`🧵 Auto-thread creation ${enabled ? 'enabled' : 'disabled'}`);
    }
}

module.exports = ThreadManager;