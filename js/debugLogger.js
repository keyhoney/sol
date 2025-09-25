// Debug Logger Module
// Enhanced debugging and error logging for cross-browser testing

/**
 * Debug Logger for enhanced debugging and error tracking
 */
export class DebugLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // Keep last 1000 log entries
        this.logLevel = this.determineLogLevel();
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.errorCount = 0;
        this.warningCount = 0;

        // Initialize error tracking
        this.initializeErrorTracking();

        console.log(`Debug Logger initialized (Session: ${this.sessionId})`);
    }

    /**
     * Generate unique session ID
     * @returns {string} Unique session identifier  
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Determine appropriate log level based on environment
     * @returns {string} Log level (debug, info, warn, error)
     */
    determineLogLevel() {
        // Check if we're in development mode
        if (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.search.includes('debug=true')) {
            return 'debug';
        }

        // Production mode - less verbose logging
        return 'info';
    }

    /**
     * Initialize global error tracking
     */
    initializeErrorTracking() {
        // Track JavaScript errors
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });

        // Track console errors (override console.error)
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.logError('Console Error', { args });
            originalConsoleError.apply(console, args);
        };
    }

    /**
     * Log a message with specified level
     * @param {string} level - Log level (debug, info, warn, error)
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     */
    log(level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            data: data,
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            url: window.location.href,
            sessionTime: Date.now() - this.startTime
        };

        // Add to logs array
        this.logs.push(logEntry);

        // Maintain max logs limit
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Update counters
        if (level === 'error') this.errorCount++;
        if (level === 'warn') this.warningCount++;

        // Console output based on log level
        if (this.shouldLog(level)) {
            this.outputToConsole(logEntry);
        }

        // Store in localStorage for debugging
        this.storeLogEntry(logEntry);
    }

    /**
     * Check if message should be logged based on current log level
     * @param {string} level - Message level
     * @returns {boolean} Whether to log the message
     */
    shouldLog(level) {
        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        const currentLevel = levels[this.logLevel] || 1;
        const messageLevel = levels[level] || 1;

        return messageLevel >= currentLevel;
    }

    /**
     * Output log entry to console with appropriate formatting
     * @param {Object} logEntry - Log entry object
     */
    outputToConsole(logEntry) {
        const { level, message, data, timestamp } = logEntry;
        const timeStr = new Date(timestamp).toLocaleTimeString();

        switch (level) {
            case 'debug':
                console.debug(`🐛 [${timeStr}] ${message}`, data);
                break;
            case 'info':
                console.info(`ℹ️ [${timeStr}] ${message}`, data);
                break;
            case 'warn':
                console.warn(`⚠️ [${timeStr}] ${message}`, data);
                break;
            case 'error':
                console.error(`❌ [${timeStr}] ${message}`, data);
                break;
            default:
                console.log(`📝 [${timeStr}] ${message}`, data);
        }
    }

    /**
     * Store log entry in localStorage for debugging
     * @param {Object} logEntry - Log entry to store
     */
    storeLogEntry(logEntry) {
        try {
            const storageKey = `debugLogs_${this.sessionId}`;
            const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            existingLogs.push(logEntry);

            // Keep only last 100 entries in localStorage
            if (existingLogs.length > 100) {
                existingLogs.splice(0, existingLogs.length - 100);
            }

            localStorage.setItem(storageKey, JSON.stringify(existingLogs));
        } catch (error) {
            // Ignore localStorage errors (e.g., quota exceeded)
        }
    }

    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {Object} data - Additional data
     */
    debug(message, data = {}) {
        this.log('debug', message, data);
    }

    /**
     * Log info message
     * @param {string} message - Info message
     * @param {Object} data - Additional data
     */
    info(message, data = {}) {
        this.log('info', message, data);
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {Object} data - Additional data
     */
    warn(message, data = {}) {
        this.log('warn', message, data);
    }

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Object} data - Additional data
     */
    logError(message, data = {}) {
        this.log('error', message, data);
    }

    /**
     * Log browser compatibility information
     * @param {Object} browserInfo - Browser information
     * @param {Object} features - Feature support information
     */
    logBrowserCompatibility(browserInfo, features) {
        this.info('Browser Compatibility Check', {
            browser: browserInfo,
            features: features,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log performance metrics
     * @param {string} operation - Operation name
     * @param {number} duration - Duration in milliseconds
     * @param {Object} additionalData - Additional performance data
     */
    logPerformance(operation, duration, additionalData = {}) {
        this.info('Performance Metric', {
            operation: operation,
            duration: duration,
            ...additionalData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log user interaction
     * @param {string} action - User action
     * @param {Object} details - Action details
     */
    logUserAction(action, details = {}) {
        this.debug('User Action', {
            action: action,
            details: details,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get all logs for the current session
     * @returns {Array} Array of log entries
     */
    getLogs() {
        return [...this.logs];
    }

    /**
     * Get logs filtered by level
     * @param {string} level - Log level to filter by
     * @returns {Array} Filtered log entries
     */
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }

    /**
     * Get session statistics
     * @returns {Object} Session statistics
     */
    getSessionStats() {
        return {
            sessionId: this.sessionId,
            startTime: this.startTime,
            duration: Date.now() - this.startTime,
            totalLogs: this.logs.length,
            errorCount: this.errorCount,
            warningCount: this.warningCount,
            logLevel: this.logLevel
        };
    }

    /**
     * Export logs as JSON for debugging
     * @returns {string} JSON string of all logs
     */
    exportLogs() {
        return JSON.stringify({
            sessionInfo: this.getSessionStats(),
            logs: this.logs
        }, null, 2);
    }

    /**
     * Clear all logs
     */
    clearLogs() {
        this.logs = [];
        this.errorCount = 0;
        this.warningCount = 0;

        // Clear localStorage logs
        try {
            const storageKey = `debugLogs_${this.sessionId}`;
            localStorage.removeItem(storageKey);
        } catch (error) {
            // Ignore localStorage errors
        }

        this.info('Logs cleared');
    }

    /**
     * Set log level
     * @param {string} level - New log level (debug, info, warn, error)
     */
    setLogLevel(level) {
        const validLevels = ['debug', 'info', 'warn', 'error'];
        if (validLevels.includes(level)) {
            this.logLevel = level;
            this.info(`Log level changed to: ${level}`);
        } else {
            this.warn(`Invalid log level: ${level}. Valid levels: ${validLevels.join(', ')}`);
        }
    }

    /**
     * Test logging functionality
     */
    testLogging() {
        console.group('🧪 Testing Debug Logger');

        this.debug('Debug message test', { testData: 'debug' });
        this.info('Info message test', { testData: 'info' });
        this.warn('Warning message test', { testData: 'warning' });
        this.logError('Error message test', { testData: 'error' });

        console.log('Session Stats:', this.getSessionStats());
        console.groupEnd();
    }
}