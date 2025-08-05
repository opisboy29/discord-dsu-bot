/**
 * Advanced Logger with File Rotation
 * 
 * @author opisboy29
 * @repository git@github.com:opisboy29/discord-dsu-bot.git
 * @description Production-grade logging system with color coding and auto-rotation
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logsDir = path.join(process.cwd(), 'logs');
        this.ensureLogsDirectory();
    }

    ensureLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    getTimestamp() {
        return new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    formatMessage(level, message, extra = null) {
        const timestamp = this.getTimestamp();
        const pid = process.pid;
        let formattedMessage = `[${timestamp}] [PID:${pid}] [${level}] ${message}`;
        
        if (extra) {
            if (extra instanceof Error) {
                formattedMessage += `\n${extra.stack}`;
            } else if (typeof extra === 'object') {
                formattedMessage += `\n${JSON.stringify(extra, null, 2)}`;
            } else {
                formattedMessage += ` ${extra}`;
            }
        }
        
        return formattedMessage;
    }

    writeToFile(filename, message) {
        const filePath = path.join(this.logsDir, filename);
        const logMessage = message + '\n';
        
        fs.appendFile(filePath, logMessage, (err) => {
            if (err) {
                console.error('Failed to write to log file:', err);
            }
        });
    }

    info(message, extra = null) {
        const formatted = this.formatMessage('INFO', message, extra);
        console.log(`\x1b[36m${formatted}\x1b[0m`); // Cyan
        this.writeToFile('app.log', formatted);
        this.writeToFile('combined.log', formatted);
    }

    success(message, extra = null) {
        const formatted = this.formatMessage('SUCCESS', message, extra);
        console.log(`\x1b[32m${formatted}\x1b[0m`); // Green
        this.writeToFile('app.log', formatted);
        this.writeToFile('combined.log', formatted);
    }

    warn(message, extra = null) {
        const formatted = this.formatMessage('WARN', message, extra);
        console.warn(`\x1b[33m${formatted}\x1b[0m`); // Yellow
        this.writeToFile('app.log', formatted);
        this.writeToFile('combined.log', formatted);
    }

    error(message, extra = null) {
        const formatted = this.formatMessage('ERROR', message, extra);
        console.error(`\x1b[31m${formatted}\x1b[0m`); // Red
        this.writeToFile('error.log', formatted);
        this.writeToFile('combined.log', formatted);
    }

    debug(message, extra = null) {
        if (process.env.NODE_ENV === 'development') {
            const formatted = this.formatMessage('DEBUG', message, extra);
            console.log(`\x1b[35m${formatted}\x1b[0m`); // Magenta
            this.writeToFile('debug.log', formatted);
            this.writeToFile('combined.log', formatted);
        }
    }

    dsu(message, extra = null) {
        const formatted = this.formatMessage('DSU', message, extra);
        console.log(`\x1b[44m\x1b[37m${formatted}\x1b[0m`); // Blue background, white text
        this.writeToFile('dsu.log', formatted);
        this.writeToFile('combined.log', formatted);
    }

    // Log rotation for large files
    rotateLogIfNeeded(filename, maxSize = 50 * 1024 * 1024) { // 50MB default
        const filePath = path.join(this.logsDir, filename);
        
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size > maxSize) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupPath = path.join(this.logsDir, `${filename}.${timestamp}.backup`);
                
                fs.renameSync(filePath, backupPath);
                this.info(`Log file rotated: ${filename} -> ${path.basename(backupPath)}`);
                
                // Keep only last 5 backup files
                this.cleanupOldLogs(filename);
            }
        }
    }

    cleanupOldLogs(filename) {
        const files = fs.readdirSync(this.logsDir)
            .filter(file => file.startsWith(filename) && file.includes('.backup'))
            .map(file => ({
                name: file,
                path: path.join(this.logsDir, file),
                mtime: fs.statSync(path.join(this.logsDir, file)).mtime
            }))
            .sort((a, b) => b.mtime - a.mtime);

        // Keep only the 5 most recent backup files
        files.slice(5).forEach(file => {
            fs.unlinkSync(file.path);
            this.info(`Cleaned up old log backup: ${file.name}`);
        });
    }

    // Application lifecycle logging
    startup(botName, version) {
        this.info('='.repeat(50));
        this.info(`🚀 ${botName} v${version} Starting Up`);
        this.info(`📅 Startup Time: ${this.getTimestamp()}`);
        this.info(`🖥️  Node.js: ${process.version}`);
        this.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
        this.info(`🏠 Working Directory: ${process.cwd()}`);
        this.info(`🆔 Process ID: ${process.pid}`);
        this.info('='.repeat(50));
    }

    shutdown(botName) {
        this.info('='.repeat(50));
        this.info(`🛑 ${botName} Shutting Down`);
        this.info(`📅 Shutdown Time: ${this.getTimestamp()}`);
        this.info('='.repeat(50));
    }
}

// Export singleton instance
module.exports = new Logger();