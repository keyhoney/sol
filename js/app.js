// Main Application Entry Point
// Coordinates all modules and manages application lifecycle

// Import modules
import { DataManager, ProblemData } from './dataManager.js';
import { HeaderController, ContentController, UIState } from './uiController.js';
import { PDFViewer } from './pdfViewer.js';
import { BrowserCompatibility } from './browserCompatibility.js';
import { DebugLogger } from './debugLogger.js';

/**
 * Main Application Class
 * Coordinates all modules and manages application lifecycle
 */
class App {
    constructor() {
        // Initialize state
        this.isInitialized = false;
        this.initializationError = null;
        
        // Module instances
        this.dataManager = null;
        this.uiState = null;
        this.headerController = null;
        this.contentController = null;
        this.pdfViewer = null;
        this.browserCompatibility = null;
        this.debugLogger = null;
        
        // Performance optimization: Memory management
        this.memoryMonitorInterval = null;
        this.initializeMemoryMonitoring();
        
        console.log('Math Problem Solver App initialized');
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Starting application initialization...');
            
            // Show loading state
            this.showGlobalLoading('애플리케이션을 초기화하는 중...');
            
            // Initialize modules in order
            await this.initializeModules();
            
            // Load CSV data
            await this.loadInitialData();
            
            // Set up event handlers and workflows
            this.setupEventHandlers();
            
            // Initialize UI with loaded data
            this.initializeUI();
            
            // Hide loading state
            this.hideGlobalLoading();
            
            this.isInitialized = true;
            console.log('Application initialization completed successfully');
            
        } catch (error) {
            console.error('Application initialization failed:', error);
            this.initializationError = error;
            this.showGlobalError(`애플리케이션 초기화 실패: ${error.message}`);
        }
    }

    /**
     * Initialize all modules
     */
    async initializeModules() {
        try {
            // Initialize Debug Logger first
            this.debugLogger = new DebugLogger();
            this.debugLogger.info('Debug Logger initialized');
            
            // Initialize Browser Compatibility
            this.browserCompatibility = new BrowserCompatibility();
            this.debugLogger.logBrowserCompatibility(
                this.browserCompatibility.browserInfo,
                this.browserCompatibility.supportedFeatures
            );
            
            // Check browser support
            const supportStatus = this.browserCompatibility.checkBrowserSupport();
            if (supportStatus.unsupported) {
                throw new Error(supportStatus.message);
            } else if (supportStatus.partial) {
                this.debugLogger.warn('Partial browser support detected', supportStatus);
                this.showTemporaryMessage(supportStatus.message, 'warning', 5000);
            }
            
            // Initialize DataManager
            this.dataManager = new DataManager();
            this.debugLogger.info('DataManager initialized');
            
            // Initialize UIState
            this.uiState = new UIState();
            this.debugLogger.info('UIState initialized');
            
            // Initialize PDFViewer
            const pdfContainer = document.getElementById('pdf-section');
            if (!pdfContainer) {
                throw new Error('PDF container element not found');
            }
            this.pdfViewer = new PDFViewer(pdfContainer);
            this.debugLogger.info('PDFViewer initialized');
            
            // Initialize HeaderController
            this.headerController = new HeaderController(this.dataManager, this.uiState);
            this.debugLogger.info('HeaderController initialized');
            
            // Initialize ContentController
            this.contentController = new ContentController(this.pdfViewer, this.uiState);
            this.debugLogger.info('ContentController initialized');
            
            // Run compatibility tests in development mode
            if (this.debugLogger.logLevel === 'debug') {
                this.runDevelopmentTests();
            }
            
        } catch (error) {
            if (this.debugLogger) {
                this.debugLogger.logError('Module initialization failed', { error: error.message });
            }
            throw new Error(`모듈 초기화 실패: ${error.message}`);
        }
    }

    /**
     * Load initial CSV data with enhanced error handling and retry logic
     */
    async loadInitialData() {
        const csvPath = 'mun/mun.csv';
        
        try {
            // Use enhanced retry mechanism with timeout
            await this.retryWithBackoff(
                async () => {
                    // Wrap CSV loading with timeout
                    return await this.withTimeout(
                        this.dataManager.loadCSVData(csvPath),
                        15000, // 15 second timeout
                        'CSV 데이터 로딩'
                    );
                },
                3, // max retries
                2000, // base delay 2 seconds
                'CSV 데이터 로딩'
            );
            
            // Validate loaded data
            const stats = this.dataManager.getDataStatistics();
            console.log('CSV data loaded successfully:', stats);
            
            if (stats.totalProblems === 0) {
                throw new Error('CSV 파일에 문제 데이터가 없습니다. 파일 내용을 확인해주세요.');
            }
            
            // Show success message
            this.showTemporaryMessage(
                `데이터 로딩 완료: ${stats.totalProblems}개 문제, ${stats.totalYears}개 학년도`, 
                'success', 
                3000
            );
            
        } catch (error) {
            console.error('CSV 데이터 로딩 최종 실패:', error);
            
            // Get recovery suggestions from DataManager
            const suggestions = this.dataManager.getErrorRecoverySuggestions(error);
            let errorMessage = `데이터 로딩 실패: ${error.message}`;
            
            if (suggestions.length > 0) {
                errorMessage += `\n\n해결 방법:\n${suggestions.map(s => `• ${s}`).join('\n')}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Set up event handlers and workflows
     */
    setupEventHandlers() {
        // Listen to selection changes from header controller
        this.headerController.onSelectionChange((property, oldValue, newValue, state) => {
            this.handleSelectionChange(property, oldValue, newValue, state);
        });
        
        // Listen to UI state changes for problem loading
        this.uiState.addStateChangeListener((property, oldValue, newValue, state) => {
            this.handleUIStateChange(property, oldValue, newValue, state);
        });
        
        // Set up solution button workflow
        this.setupSolutionButtonWorkflow();
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Set up error recovery workflows
        this.setupErrorRecoveryWorkflows();
        
        // Set up global retry button
        this.setupGlobalRetryButton();
        
        // Set up network monitoring
        this.setupNetworkMonitoring();
        
        // Set up debug panel if in debug mode
        this.setupDebugPanel();
        
        console.log('Event handlers set up');
    }

    /**
     * Set up solution button workflow
     */
    setupSolutionButtonWorkflow() {
        const solutionBtn = document.getElementById('solution-btn');
        if (!solutionBtn) {
            console.warn('Solution button not found');
            return;
        }

        // Override the default solution button handler to use our workflow
        solutionBtn.addEventListener('click', (event) => {
            event.preventDefault();
            this.handleSolutionButtonClick();
        });
    }

    /**
     * Handle solution button click workflow
     */
    handleSolutionButtonClick() {
        try {
            const currentProblem = this.uiState.currentProblem;
            
            if (!currentProblem) {
                this.showTemporaryMessage('문제를 먼저 선택해주세요.', 'warning');
                return;
            }

            if (this.uiState.isSolutionVisible) {
                // Hide solution
                console.log('Hiding solution');
                this.uiState.setSolutionVisible(false);
            } else {
                // Show solution
                console.log('Showing solution');
                this.uiState.setSolutionVisible(true);
            }
            
        } catch (error) {
            this.handleError(error, 'Solution button click');
        }
    }

    /**
     * Set up keyboard shortcuts for better user experience
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Only handle shortcuts when not typing in input fields
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' || event.target.tagName === 'TEXTAREA') {
                return;
            }

            try {
                switch (event.key) {
                    case 'r':
                    case 'R':
                        // Reset selections
                        if (event.ctrlKey || event.metaKey) {
                            event.preventDefault();
                            this.resetSelections();
                        }
                        break;
                        
                    case 's':
                    case 'S':
                        // Toggle solution
                        if (this.uiState.currentProblem) {
                            event.preventDefault();
                            this.handleSolutionButtonClick();
                        }
                        break;
                        
                    case 'Escape':
                        // Hide solution or clear selections
                        if (this.uiState.isSolutionVisible) {
                            event.preventDefault();
                            this.uiState.setSolutionVisible(false);
                        }
                        break;
                }
            } catch (error) {
                this.handleError(error, 'Keyboard shortcut');
            }
        });
    }

    /**
     * Set up error recovery workflows
     */
    setupErrorRecoveryWorkflows() {
        // Set up retry button for main error message
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.retryCurrentOperation();
            });
        }

        // Set up global error recovery
        window.addEventListener('error', (event) => {
            console.error('Global error caught:', event.error);
            this.handleError(event.error, 'Global error');
        });

        // Set up unhandled promise rejection recovery
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(new Error(event.reason), 'Unhandled promise rejection');
            event.preventDefault(); // Prevent default browser error handling
        });
    }

    /**
     * Retry current operation based on application state
     */
    async retryCurrentOperation() {
        try {
            const state = this.uiState.getState();
            
            console.log('재시도 작업 시작:', state);
            
            if (state.currentProblem) {
                // Retry loading current problem image
                console.log('문제 이미지 재시도');
                await this.contentController.setCurrentProblem(state.currentProblem);
            } else if (state.selectedYear && state.selectedMonth && state.selectedQuestion) {
                // Retry loading problem data
                console.log('문제 데이터 재시도');
                await this.loadProblemData(state.selectedYear, state.selectedMonth, state.selectedQuestion);
            } else if (!this.dataManager.isDataLoaded) {
                // Retry data initialization
                console.log('데이터 초기화 재시도');
                this.showGlobalLoading('데이터를 다시 로딩하는 중...');
                await this.loadInitialData();
                this.initializeUI();
                this.hideGlobalLoading();
                this.showTemporaryMessage('데이터 로딩이 완료되었습니다.', 'success');
            } else {
                // No specific operation to retry
                console.log('재시도할 작업이 없습니다.');
                this.showTemporaryMessage('재시도할 작업이 없습니다.', 'info');
            }
            
        } catch (error) {
            console.error('재시도 작업 실패:', error);
            this.hideGlobalLoading();
            this.handleError(error, 'Retry operation');
        }
    }

    /**
     * Handle errors with enhanced error reporting and recovery options
     * @param {Error} error - The error that occurred
     * @param {string} context - Context where the error occurred
     */
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        // Log to debug logger if available
        if (this.debugLogger) {
            this.debugLogger.logError(`Error in ${context}`, {
                message: error.message,
                stack: error.stack,
                context: context
            });
        }
        
        // Determine error type and provide appropriate handling
        let errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
        let errorType = 'error';
        let showRetry = true;
        
        // Categorize errors
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            errorType = 'file-not-found';
        } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            errorType = 'network';
        } else if (errorMessage.includes('timeout')) {
            errorType = 'timeout';
        } else if (errorMessage.includes('parsing') || errorMessage.includes('format')) {
            errorType = 'format';
        }
        
        // Show appropriate error message
        if (context.includes('CSV') || context.includes('data')) {
            this.showGlobalError(errorMessage);
        } else {
            this.showTemporaryMessage(errorMessage, 'error', 8000);
        }
        
        // Log error for debugging
        this.logError(error, context, errorType);
    }

    /**
     * Log error for debugging and analytics
     * @param {Error} error - The error that occurred
     * @param {string} context - Context where the error occurred
     * @param {string} errorType - Type of error
     */
    logError(error, context, errorType) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            context: context,
            errorType: errorType,
            message: error.message,
            stack: error.stack,
            userAgent: navigator.userAgent,
            url: window.location.href,
            appState: this.getWorkflowState()
        };
        
        // Log to console for debugging
        console.group(`🚨 Error Log - ${context}`);
        console.error('Error Details:', errorLog);
        console.groupEnd();
        
        // Log to debug logger if available
        if (this.debugLogger) {
            this.debugLogger.logError('Application Error', errorLog);
        }
        
        // In a real application, you might send this to an error tracking service
        // this.sendErrorToService(errorLog);
    }

    /**
     * Run development tests for browser compatibility and functionality
     */
    async runDevelopmentTests() {
        if (!this.debugLogger || !this.browserCompatibility) {
            return;
        }

        this.debugLogger.info('Running development tests...');

        try {
            // Run compatibility tests
            const compatibilityResults = this.browserCompatibility.runCompatibilityTests();
            this.debugLogger.info('Compatibility tests completed', {
                score: compatibilityResults.overall.score,
                passed: compatibilityResults.overall.passed,
                failed: compatibilityResults.overall.failed
            });

            // Run functional tests
            const functionalResults = await this.browserCompatibility.testBrowserFunctionality();
            this.debugLogger.info('Functional tests completed', functionalResults);

            // Generate comprehensive report
            const report = await this.browserCompatibility.generateCompatibilityReport();
            
            // Log warnings and errors from the report
            report.warnings.forEach(warning => {
                this.debugLogger.warn('Compatibility Warning', { message: warning });
            });
            
            report.errors.forEach(error => {
                this.debugLogger.logError('Compatibility Error', { message: error });
            });

            // Test debug logger functionality
            this.debugLogger.testLogging();

            // Store compatibility report for debugging
            if (typeof localStorage !== 'undefined') {
                try {
                    localStorage.setItem('compatibilityReport', JSON.stringify(report));
                    this.debugLogger.debug('Compatibility report stored in localStorage');
                } catch (e) {
                    this.debugLogger.warn('Could not store compatibility report in localStorage', { error: e.message });
                }
            }

        } catch (error) {
            this.debugLogger.logError('Development tests failed', {
                message: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Get browser compatibility information for debugging
     * @returns {Object} Browser compatibility information
     */
    getBrowserCompatibilityInfo() {
        if (!this.browserCompatibility) {
            return { error: 'Browser compatibility module not initialized' };
        }

        return {
            browser: this.browserCompatibility.browserInfo,
            features: this.browserCompatibility.supportedFeatures,
            support: this.browserCompatibility.checkBrowserSupport(),
            report: this.browserCompatibility.getCompatibilityReport()
        };
    }

    /**
     * Get debug information for troubleshooting
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            appState: {
                isInitialized: this.isInitialized,
                initializationError: this.initializationError,
                modules: {
                    dataManager: !!this.dataManager,
                    uiState: !!this.uiState,
                    headerController: !!this.headerController,
                    contentController: !!this.contentController,
                    pdfViewer: !!this.pdfViewer,
                    browserCompatibility: !!this.browserCompatibility,
                    debugLogger: !!this.debugLogger
                }
            },
            browser: this.getBrowserCompatibilityInfo(),
            performance: {
                memory: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                } : 'Not available',
                timing: performance.timing ? {
                    navigationStart: performance.timing.navigationStart,
                    loadEventEnd: performance.timing.loadEventEnd,
                    domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                    pageLoad: performance.timing.loadEventEnd - performance.timing.navigationStart
                } : 'Not available'
            }
        };

        if (this.debugLogger) {
            debugInfo.logs = {
                sessionStats: this.debugLogger.getSessionStats(),
                recentErrors: this.debugLogger.getLogsByLevel('error').slice(-5),
                recentWarnings: this.debugLogger.getLogsByLevel('warn').slice(-5)
            };
        }

        if (this.uiState) {
            debugInfo.uiState = this.uiState.getState();
        }

        return debugInfo;
    }

    /**
     * Export debug information for support
     * @returns {string} JSON string of debug information
     */
    exportDebugInfo() {
        const debugInfo = this.getDebugInfo();
        return JSON.stringify(debugInfo, null, 2);
    }

    /**
     * Test cross-browser functionality manually
     */
    async testCrossBrowserFunctionality() {
        if (!this.debugLogger || !this.browserCompatibility) {
            console.warn('Debug logger or browser compatibility not available');
            return;
        }

        console.group('🧪 Manual Cross-Browser Functionality Test');
        
        this.debugLogger.info('Starting manual cross-browser functionality test');

        try {
            // Test 1: Basic DOM operations
            console.log('Testing DOM operations...');
            const testResult1 = this.browserCompatibility.testDOMManipulation();
            console.log('DOM test result:', testResult1);

            // Test 2: Event handling
            console.log('Testing event handling...');
            const testResult2 = this.browserCompatibility.testEventHandling();
            console.log('Event handling test result:', testResult2);

            // Test 3: Image loading
            console.log('Testing image loading...');
            const testResult3 = await this.browserCompatibility.testImageLoading();
            console.log('Image loading test result:', testResult3);

            // Test 4: CSV parsing
            console.log('Testing CSV parsing...');
            const testResult4 = await this.browserCompatibility.testCSVParsing();
            console.log('CSV parsing test result:', testResult4);

            // Test 5: PDF support
            console.log('Testing PDF support...');
            const testResult5 = await this.browserCompatibility.testPDFSupport();
            console.log('PDF support test result:', testResult5);

            // Test 6: Error handling
            console.log('Testing error handling...');
            const testResult6 = this.browserCompatibility.testErrorHandling();
            console.log('Error handling test result:', testResult6);

            const allResults = {
                domOperations: testResult1,
                eventHandling: testResult2,
                imageLoading: testResult3,
                csvParsing: testResult4,
                pdfSupport: testResult5,
                errorHandling: testResult6
            };

            this.debugLogger.info('Manual cross-browser functionality test completed', allResults);

            console.log('✅ Cross-browser functionality test completed');
            console.log('Results:', allResults);

            return allResults;

        } catch (error) {
            this.debugLogger.logError('Manual cross-browser functionality test failed', {
                message: error.message,
                stack: error.stack
            });
            console.error('❌ Cross-browser functionality test failed:', error);
            throw error;
        } finally {
            console.groupEnd();
        }
    }

    /**
     * Test error handling functionality (for development/debugging)
     */
    testErrorHandling() {
        console.group('🧪 Testing Error Handling');
        
        // Test CSV error handling
        console.log('Testing CSV error handling...');
        this.dataManager.loadCSVData('nonexistent.csv').catch(error => {
            console.log('✅ CSV error handled:', error.message);
        });
        
        // Test image error handling
        console.log('Testing image error handling...');
        this.contentController.displayProblemImage('nonexistent.png').catch(error => {
            console.log('✅ Image error handled:', error.message);
        });
        
        // Test PDF error handling
        console.log('Testing PDF error handling...');
        this.pdfViewer.loadPDF('nonexistent.pdf').catch(error => {
            console.log('✅ PDF error handled:', error.message);
        });
        
        console.groupEnd();
    }

    /**
     * Get error handling status for debugging
     */
    getErrorHandlingStatus() {
        return {
            csvErrorHandling: {
                hasRetry: typeof this.dataManager.retryLoadCSVData === 'function',
                hasValidation: typeof this.dataManager.validateCSVFormat === 'function',
                hasSuggestions: typeof this.dataManager.getErrorRecoverySuggestions === 'function'
            },
            imageErrorHandling: {
                hasRetry: typeof this.contentController.retryImageLoad === 'function',
                hasValidation: typeof this.contentController.validateImageFile === 'function',
                hasExistenceCheck: typeof this.contentController.checkImageExists === 'function'
            },
            pdfErrorHandling: {
                hasEnhancedLoading: this.pdfViewer.loadPDF.toString().includes('timeout'),
                hasErrorCategorization: this.pdfViewer.loadPDF.toString().includes('InvalidPDFException')
            },
            globalErrorHandling: {
                hasErrorLogger: typeof this.logError === 'function',
                hasRetryMechanism: typeof this.retryCurrentOperation === 'function',
                hasErrorRecovery: typeof this.handleError === 'function'
            }
        };
    }

    /**
     * Reset all selections and clear content
     */
    resetSelections() {
        try {
            console.log('Resetting all selections');
            
            // Reset through header controller (this will trigger the cascade)
            this.headerController.resetSelections();
            
            // Show confirmation message
            this.showTemporaryMessage('선택이 초기화되었습니다.', 'info', 2000);
            
        } catch (error) {
            this.handleError(error, 'Reset selections');
        }
    }

    /**
     * Initialize UI with loaded data
     */
    initializeUI() {
        // Initialize header controller with data
        this.headerController.initializeWithData();
        
        // Set initial UI state
        this.uiState.updateUI();
        
        console.log('UI initialized with data');
    }

    /**
     * Handle selection changes from dropdowns
     * Implements the cascading update workflow: Year -> Month -> Question -> Image
     * @param {string} property - Changed property
     * @param {*} oldValue - Previous value
     * @param {*} newValue - New value
     * @param {UIState} state - Current UI state
     */
    handleSelectionChange(property, oldValue, newValue, state) {
        console.log(`Selection changed: ${property} = ${newValue}`);
        
        try {
            switch (property) {
                case 'selectedYear':
                    this.handleYearChange(newValue, state);
                    break;
                    
                case 'selectedMonth':
                    this.handleMonthChange(newValue, state);
                    break;
                    
                case 'selectedQuestion':
                    this.handleQuestionChange(newValue, state);
                    break;
            }
        } catch (error) {
            this.handleError(error, `Selection change (${property})`);
        }
    }

    /**
     * Handle year selection change
     * @param {string|null} year - Selected year
     * @param {UIState} state - Current UI state
     */
    handleYearChange(year, state) {
        if (year) {
            console.log(`Year selected: ${year}`);
            
            // Validate year exists in data
            const availableYears = this.dataManager.getAvailableYears();
            if (!availableYears.includes(year)) {
                throw new Error(`선택한 학년도(${year})의 데이터가 없습니다.`);
            }
            
            // Get months for selected year
            const months = this.dataManager.getMonthsForYear(year);
            console.log(`Available months for ${year}:`, months);
            
            if (months.length === 0) {
                this.showTemporaryMessage(`${year}년도에 해당하는 시행월이 없습니다.`, 'warning');
            }
            
        } else {
            console.log('Year selection cleared');
            // Clear content when year is deselected
            this.clearProblemContent();
        }
    }

    /**
     * Handle month selection change
     * @param {string|null} month - Selected month
     * @param {UIState} state - Current UI state
     */
    handleMonthChange(month, state) {
        if (month && state.selectedYear) {
            console.log(`Month selected: ${month} for year ${state.selectedYear}`);
            
            // Validate month exists for selected year
            const availableMonths = this.dataManager.getMonthsForYear(state.selectedYear);
            if (!availableMonths.includes(month)) {
                throw new Error(`선택한 시행월(${month}월)의 데이터가 없습니다.`);
            }
            
            // Get questions for selected year and month
            const questions = this.dataManager.getQuestionsForYearMonth(state.selectedYear, month);
            console.log(`Available questions for ${state.selectedYear}-${month}:`, questions);
            
            if (questions.length === 0) {
                this.showTemporaryMessage(`${state.selectedYear}년 ${month}월에 해당하는 문항이 없습니다.`, 'warning');
            }
            
        } else {
            console.log('Month selection cleared');
            // Clear content when month is deselected
            this.clearProblemContent();
        }
    }

    /**
     * Handle question selection change
     * @param {string|null} question - Selected question
     * @param {UIState} state - Current UI state
     */
    handleQuestionChange(question, state) {
        if (question && state.selectedYear && state.selectedMonth) {
            console.log(`Question selected: ${question} for ${state.selectedYear}-${state.selectedMonth}`);
            
            // Validate question exists for selected year and month
            const availableQuestions = this.dataManager.getQuestionsForYearMonth(
                state.selectedYear, 
                state.selectedMonth
            );
            if (!availableQuestions.includes(question)) {
                throw new Error(`선택한 문항번호(${question}번)의 데이터가 없습니다.`);
            }
            
            // Create problem data and load image
            this.loadProblemData(state.selectedYear, state.selectedMonth, question);
            
        } else {
            console.log('Question selection cleared');
            // Clear content when question is deselected
            this.clearProblemContent();
        }
    }

    /**
     * Load problem data and display image
     * @param {string} year - Selected year
     * @param {string} month - Selected month
     * @param {string} question - Selected question
     */
    async loadProblemData(year, month, question) {
        try {
            // Create problem data instance
            const problemData = this.dataManager.createProblemData(year, month, question);
            console.log(`Loading problem: ${problemData.toString()}`);
            
            // Set current problem in UI state
            this.uiState.setCurrentProblem(problemData);
            
            // Load and display problem image
            await this.contentController.setCurrentProblem(problemData);
            
            // Show success message
            this.showTemporaryMessage(`문제 로드 완료: ${problemData.toString()}`, 'success', 3000);
            
            console.log(`Problem loaded successfully: ${problemData.toString()}`);
            
        } catch (error) {
            console.error('Error loading problem data:', error);
            this.uiState.setErrorMessage(`문제 로딩 오류: ${error.message}`);
            throw error;
        }
    }

    /**
     * Clear problem content and reset solution state
     */
    clearProblemContent() {
        // Clear current problem
        this.uiState.setCurrentProblem(null);
        
        // Hide solution if visible
        if (this.uiState.isSolutionVisible) {
            this.uiState.setSolutionVisible(false);
            this.pdfViewer.hidePDF();
        }
        
        // Clear content controller
        this.contentController.clearContent();
        
        console.log('Problem content cleared');
    }

    /**
     * Handle UI state changes
     * Implements workflows for solution display, loading states, and error handling
     * @param {string} property - Changed property
     * @param {*} oldValue - Previous value
     * @param {*} newValue - New value
     * @param {UIState} state - Current UI state
     */
    handleUIStateChange(property, oldValue, newValue, state) {
        try {
            switch (property) {
                case 'isSolutionVisible':
                    this.handleSolutionVisibilityChange(newValue, state);
                    break;
                    
                case 'currentProblem':
                    this.handleCurrentProblemChange(newValue, oldValue);
                    break;
                    
                case 'isLoading':
                    this.handleLoadingStateChange(newValue);
                    break;
                    
                case 'isPdfLoading':
                    this.handlePdfLoadingStateChange(newValue);
                    break;
                    
                case 'errorMessage':
                    this.handleErrorMessageChange(newValue);
                    break;
                    
                case 'pdfError':
                    this.handlePdfErrorChange(newValue);
                    break;
            }
        } catch (error) {
            this.handleError(error, `UI state change (${property})`);
        }
    }

    /**
     * Handle solution visibility changes
     * @param {boolean} isVisible - Whether solution is visible
     * @param {UIState} state - Current UI state
     */
    handleSolutionVisibilityChange(isVisible, state) {
        console.log(`Solution visibility changed: ${isVisible}`);
        
        if (isVisible && state.currentProblem) {
            // Load and show solution PDF
            this.loadSolutionPDF(state.currentProblem);
        } else if (!isVisible) {
            // Hide solution PDF
            this.pdfViewer.hidePDF();
            console.log('Solution PDF hidden');
        }
    }

    /**
     * Load and display solution PDF
     * @param {ProblemData} problemData - Current problem data
     */
    async loadSolutionPDF(problemData) {
        try {
            console.log(`Loading solution PDF for: ${problemData.toString()}`);
            
            const pdfPath = problemData.getPDFPath();
            console.log(`PDF path: ${pdfPath}`);
            
            // Set PDF loading state
            this.uiState.setPdfLoading(true);
            
            // Load PDF through PDF viewer
            await this.pdfViewer.loadPDF(pdfPath);
            
            // Show PDF viewer
            this.pdfViewer.showPDF();
            
            // Update UI state
            this.uiState.setSolutionVisible(true);
            
            // Show success message
            this.showTemporaryMessage('해설을 불러왔습니다.', 'success', 2000);
            
            console.log('Solution PDF loaded successfully');
            
        } catch (error) {
            console.error('Error loading solution PDF:', error);
            
            // Handle specific PDF loading errors
            let errorMessage = '해설을 불러올 수 없습니다.';
            if (error.message.includes('404') || error.message.includes('not found')) {
                errorMessage = '해설 파일이 존재하지 않습니다.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = '네트워크 오류로 해설을 불러올 수 없습니다.';
            }
            
            // Set PDF error state
            this.uiState.setPdfError(errorMessage);
            this.uiState.setSolutionVisible(false);
            
            throw error;
        } finally {
            // Clear PDF loading state
            this.uiState.setPdfLoading(false);
        }
    }

    /**
     * Handle current problem changes
     * @param {ProblemData|null} newProblem - New problem data
     * @param {ProblemData|null} oldProblem - Previous problem data
     */
    handleCurrentProblemChange(newProblem, oldProblem) {
        if (newProblem) {
            console.log(`Current problem changed to: ${newProblem.toString()}`);
            
            // Verify problem exists in data
            if (!this.dataManager.problemExists(newProblem.year, newProblem.month, newProblem.questionNumber)) {
                console.warn(`Problem not found in data: ${newProblem.toString()}`);
            }
            
        } else if (oldProblem) {
            console.log(`Current problem cleared (was: ${oldProblem.toString()})`);
        }
    }

    /**
     * Handle loading state changes
     * @param {boolean} isLoading - Loading state
     */
    handleLoadingStateChange(isLoading) {
        console.log(`Loading state changed: ${isLoading}`);
        
        if (isLoading) {
            // Clear any existing error messages when starting to load
            this.uiState.setErrorMessage(null);
        }
    }

    /**
     * Handle PDF loading state changes
     * @param {boolean} isPdfLoading - PDF loading state
     */
    handlePdfLoadingStateChange(isPdfLoading) {
        console.log(`PDF loading state changed: ${isPdfLoading}`);
        
        if (isPdfLoading) {
            // Clear any existing PDF error messages when starting to load
            this.uiState.setPdfError(null);
        }
    }

    /**
     * Handle error message changes
     * @param {string|null} errorMessage - Error message
     */
    handleErrorMessageChange(errorMessage) {
        if (errorMessage) {
            console.error('Error message set:', errorMessage);
            this.showTemporaryMessage(errorMessage, 'error');
        }
    }

    /**
     * Handle PDF error changes
     * @param {string|null} pdfError - PDF error message
     */
    handlePdfErrorChange(pdfError) {
        if (pdfError) {
            console.error('PDF error set:', pdfError);
            this.showTemporaryMessage(pdfError, 'error');
        }
    }

    /**
     * Show global loading state
     * @param {string} message - Loading message
     */
    showGlobalLoading(message = '로딩 중...') {
        const loadingElement = document.getElementById('global-loading');
        const loadingText = document.getElementById('global-loading-text');
        
        if (loadingElement && loadingText) {
            loadingText.textContent = message;
            loadingElement.classList.remove('hidden');
        }
    }

    /**
     * Hide global loading state
     */
    hideGlobalLoading() {
        const loadingElement = document.getElementById('global-loading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    }

    /**
     * Show global error state
     * @param {string} message - Error message
     */
    showGlobalError(message) {
        const errorElement = document.getElementById('global-error');
        const errorText = document.getElementById('global-error-text');
        
        if (errorElement && errorText) {
            errorText.textContent = message;
            errorElement.classList.remove('hidden');
        }
        
        // Hide loading if it's showing
        this.hideGlobalLoading();
    }

    /**
     * Hide global error state
     */
    hideGlobalError() {
        const errorElement = document.getElementById('global-error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    /**
     * Show temporary message to user
     * @param {string} message - Message to show
     * @param {string} type - Message type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds (default: 5000)
     */
    showTemporaryMessage(message, type = 'info', duration = 5000) {
        // Remove any existing temporary messages
        const existingMessages = document.querySelectorAll('.temp-message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message element
        const messageElement = document.createElement('div');
        messageElement.className = `temp-message temp-message--${type}`;
        messageElement.textContent = message;

        // Add to document
        document.body.appendChild(messageElement);

        // Auto-remove after duration
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.opacity = '0';
                messageElement.style.transform = 'translateX(100%)';
                
                setTimeout(() => {
                    messageElement.remove();
                }, 300); // Wait for animation to complete
            }
        }, duration);

        // Return element reference for manual control if needed
        return messageElement;
    }

    /**
     * Get current workflow state for debugging and error reporting
     * @returns {Object} Current workflow state
     */
    getWorkflowState() {
        return {
            isInitialized: this.isInitialized,
            initializationError: this.initializationError?.message || null,
            dataLoaded: this.dataManager?.isDataLoaded || false,
            currentSelections: {
                year: this.uiState?.selectedYear || null,
                month: this.uiState?.selectedMonth || null,
                question: this.uiState?.selectedQuestion || null
            },
            currentProblem: this.uiState?.currentProblem?.toString() || null,
            uiStates: {
                isLoading: this.uiState?.isLoading || false,
                isSolutionVisible: this.uiState?.isSolutionVisible || false,
                isPdfLoading: this.uiState?.isPdfLoading || false,
                hasError: !!(this.uiState?.errorMessage || this.uiState?.pdfError)
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Enhanced network connectivity check
     * @returns {Promise<boolean>} True if network is available
     */
    async checkNetworkConnectivity() {
        // Check navigator.onLine first (basic check)
        if (!navigator.onLine) {
            return false;
        }

        try {
            // Try to fetch a small resource to verify actual connectivity
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch('data:text/plain;base64,', {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache'
            });

            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            console.warn('Network connectivity check failed:', error);
            return false;
        }
    }

    /**
     * Enhanced retry mechanism with exponential backoff
     * @param {Function} operation - Operation to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} baseDelay - Base delay in milliseconds
     * @param {string} operationName - Name of operation for logging
     * @returns {Promise<any>} Result of successful operation
     */
    async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000, operationName = 'Operation') {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`${operationName} 시도 ${attempt}/${maxRetries}`);
                
                // Check network connectivity before retry (except first attempt)
                if (attempt > 1) {
                    const isConnected = await this.checkNetworkConnectivity();
                    if (!isConnected) {
                        throw new Error('네트워크 연결을 확인할 수 없습니다. 인터넷 연결을 확인해주세요.');
                    }
                }

                const result = await operation();
                
                if (attempt > 1) {
                    this.showTemporaryMessage(`${operationName} 재시도 성공!`, 'success', 3000);
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                console.error(`${operationName} 시도 ${attempt} 실패:`, error);

                if (attempt === maxRetries) {
                    // Final attempt failed
                    break;
                }

                // Calculate delay with exponential backoff and jitter
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
                console.log(`${delay.toFixed(0)}ms 후 재시도...`);
                
                // Show retry message to user
                this.showTemporaryMessage(
                    `${operationName} 실패. ${Math.ceil(delay / 1000)}초 후 재시도... (${attempt}/${maxRetries})`, 
                    'warning', 
                    Math.min(delay, 3000)
                );

                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // All retries failed
        throw new Error(`${operationName} 실패 (${maxRetries}회 시도): ${lastError.message}`);
    }

    /**
     * Enhanced timeout wrapper for operations
     * @param {Promise} promise - Promise to wrap with timeout
     * @param {number} timeoutMs - Timeout in milliseconds
     * @param {string} operationName - Name of operation for error message
     * @returns {Promise<any>} Promise that rejects on timeout
     */
    withTimeout(promise, timeoutMs, operationName = 'Operation') {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`${operationName} 시간 초과 (${timeoutMs / 1000}초). 네트워크 연결이 느리거나 서버에 문제가 있을 수 있습니다.`));
            }, timeoutMs);

            promise
                .then(result => {
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }

    /**
     * Setup global retry button functionality
     */
    setupGlobalRetryButton() {
        const globalRetryBtn = document.getElementById('global-retry-btn');
        if (globalRetryBtn) {
            globalRetryBtn.addEventListener('click', async () => {
                try {
                    this.hideGlobalError();
                    
                    // Check what needs to be retried based on current state
                    if (!this.isInitialized || this.initializationError) {
                        // Retry full initialization
                        console.log('전체 초기화 재시도');
                        await this.init();
                    } else {
                        // Retry current operation
                        await this.retryCurrentOperation();
                    }
                    
                } catch (error) {
                    console.error('Global retry failed:', error);
                    this.showGlobalError(`재시도 실패: ${error.message}`);
                }
            });
        }
    }

    /**
     * Monitor network status and show appropriate messages
     */
    setupNetworkMonitoring() {
        // Create network status indicator
        this.createNetworkStatusIndicator();
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('네트워크 연결 복구됨');
            this.updateNetworkStatus(true);
            this.showTemporaryMessage('인터넷 연결이 복구되었습니다.', 'success', 3000);
            
            // Auto-retry if there was a network-related error
            if (this.initializationError && this.initializationError.message.includes('네트워크')) {
                setTimeout(() => {
                    this.retryCurrentOperation();
                }, 1000);
            }
        });

        window.addEventListener('offline', () => {
            console.log('네트워크 연결 끊어짐');
            this.updateNetworkStatus(false);
            this.showTemporaryMessage('인터넷 연결이 끊어졌습니다. 연결을 확인해주세요.', 'error', 8000);
        });

        // Initial network status check
        this.updateNetworkStatus(navigator.onLine);

        // Periodic connectivity check (every 30 seconds when offline)
        setInterval(async () => {
            if (!navigator.onLine) {
                const isConnected = await this.checkNetworkConnectivity();
                if (isConnected && !navigator.onLine) {
                    // Browser thinks we're offline but we can actually connect
                    console.log('네트워크 상태 불일치 감지');
                    this.showTemporaryMessage('네트워크 연결 상태를 확인하는 중...', 'info', 2000);
                }
            }
        }, 30000);
    }

    /**
     * Create network status indicator
     */
    createNetworkStatusIndicator() {
        // Remove existing indicator if present
        const existing = document.getElementById('network-status');
        if (existing) {
            existing.remove();
        }

        // Create new indicator
        const indicator = document.createElement('div');
        indicator.id = 'network-status';
        indicator.className = 'network-status hidden';
        document.body.appendChild(indicator);
    }

    /**
     * Update network status indicator
     * @param {boolean} isOnline - Whether network is online
     */
    updateNetworkStatus(isOnline) {
        const indicator = document.getElementById('network-status');
        if (!indicator) return;

        if (isOnline) {
            indicator.className = 'network-status network-status--online';
            indicator.textContent = '온라인';
            
            // Hide after 2 seconds if online
            setTimeout(() => {
                indicator.classList.add('hidden');
            }, 2000);
        } else {
            indicator.className = 'network-status network-status--offline';
            indicator.textContent = '오프라인 - 연결을 확인해주세요';
            indicator.classList.remove('hidden');
        }
    }

    /**
     * Show enhanced loading state with progress indication
     * @param {string} message - Loading message
     * @param {boolean} showProgress - Whether to show progress bar
     */
    showEnhancedLoading(message, showProgress = false) {
        const loadingElement = document.getElementById('global-loading');
        const loadingText = document.getElementById('global-loading-text');
        
        if (loadingElement && loadingText) {
            loadingText.textContent = message;
            
            // Add progress bar if requested
            if (showProgress) {
                let progressBar = loadingElement.querySelector('.loading-progress');
                if (!progressBar) {
                    progressBar = document.createElement('div');
                    progressBar.className = 'loading-progress';
                    progressBar.innerHTML = '<div class="loading-progress__bar"></div>';
                    loadingText.parentNode.appendChild(progressBar);
                }
            }
            
            loadingElement.classList.remove('hidden');
        }
    }

    /**
     * Update loading progress
     * @param {number} percentage - Progress percentage (0-100)
     */
    updateLoadingProgress(percentage) {
        const progressBar = document.querySelector('.loading-progress__bar');
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    /**
     * Enhanced loading state management with progress indication
     * @param {string} message - Loading message
     * @param {number} progress - Progress percentage (0-100, optional)
     */
    showLoadingWithProgress(message, progress = null) {
        this.showGlobalLoading(message);
        
        // If progress is provided, could add a progress bar here
        if (progress !== null) {
            console.log(`Loading progress: ${progress}%`);
            // Future enhancement: add progress bar to loading overlay
        }
    }

    /**
     * Debounced error handler to prevent spam
     */
    createDebouncedErrorHandler() {
        let errorTimeout;
        
        return (error, context) => {
            clearTimeout(errorTimeout);
            errorTimeout = setTimeout(() => {
                this.handleError(error, context);
            }, 100); // 100ms debounce
        };
    }

    /**
     * Show global loading state
     * @param {string} message - Loading message
     */
    showGlobalLoading(message = '로딩 중...') {
        const loadingElement = document.getElementById('global-loading');
        const loadingText = document.getElementById('global-loading-text');
        
        if (loadingElement && loadingText) {
            loadingText.textContent = message;
            loadingElement.classList.remove('hidden');
        }
    }

    /**
     * Hide global loading state
     */
    hideGlobalLoading() {
        const loadingElement = document.getElementById('global-loading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    }

    /**
     * Show global error message
     * @param {string} message - Error message
     */
    showGlobalError(message) {
        const errorElement = document.getElementById('global-error');
        const errorText = document.getElementById('global-error-text');
        const retryButton = document.getElementById('global-retry-btn');
        
        if (errorElement) {
            if (errorText) {
                errorText.textContent = message;
            }
            
            // Set up retry button
            if (retryButton) {
                retryButton.onclick = () => {
                    this.hideGlobalError();
                    this.init(); // Retry initialization
                };
            }
            
            errorElement.classList.remove('hidden');
        }
        
        // Also log to console
        console.error('Global error:', message);
    }

    /**
     * Hide global error message
     */
    hideGlobalError() {
        const errorElement = document.getElementById('global-error');
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    /**
     * Show temporary message (success, error, info)
     * @param {string} message - Message to show
     * @param {string} type - Message type ('success', 'error', 'info')
     * @param {number} duration - Duration in milliseconds
     */
    showTemporaryMessage(message, type = 'info', duration = 5000) {
        // Create message element if it doesn't exist
        let messageElement = document.getElementById('temp-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'temp-message';
            messageElement.className = 'temp-message';
            document.body.appendChild(messageElement);
        }
        
        // Set message content and type
        messageElement.textContent = message;
        messageElement.className = `temp-message temp-message--${type}`;
        messageElement.classList.remove('hidden');
        
        // Auto-hide after duration
        setTimeout(() => {
            if (messageElement) {
                messageElement.classList.add('hidden');
            }
        }, duration);
    }

    /**
     * Get application status
     * @returns {Object} Application status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            initializationError: this.initializationError,
            dataLoaded: this.dataManager?.isDataLoaded || false,
            totalProblems: this.dataManager?.getTotalProblemsCount() || 0,
            currentState: this.uiState?.getState() || null,
            dataStatistics: this.dataManager?.getDataStatistics() || null
        };
    }

    /**
     * Navigate to specific problem (programmatic navigation)
     * @param {string} year - Year to navigate to
     * @param {string} month - Month to navigate to
     * @param {string} question - Question to navigate to
     */
    async navigateToProblem(year, month, question) {
        try {
            console.log(`Navigating to problem: ${year}-${month}-${question}`);
            
            // Validate problem exists
            if (!this.dataManager.problemExists(year, month, question)) {
                throw new Error(`문제를 찾을 수 없습니다: ${year}년 ${month}월 ${question}번`);
            }
            
            // Set selections programmatically
            this.headerController.setSelections(year, month, question);
            
            // Show success message
            this.showTemporaryMessage(`문제로 이동: ${year}년 ${month}월 ${question}번`, 'success');
            
        } catch (error) {
            this.handleError(error, 'Navigate to problem');
        }
    }

    /**
     * Get current workflow state for debugging
     * @returns {Object} Current workflow state
     */
    getWorkflowState() {
        const uiState = this.uiState?.getState();
        const headerSelections = this.headerController?.getCurrentSelections();
        const contentState = this.contentController?.getCurrentState();
        
        return {
            timestamp: new Date().toISOString(),
            ui: uiState,
            header: headerSelections,
            content: contentState,
            pdfVisible: this.pdfViewer?.isVisible() || false,
            dataLoaded: this.dataManager?.isDataLoaded || false
        };
    }

    /**
     * Validate current application state
     * @returns {Object} Validation result
     */
    validateState() {
        const issues = [];
        const warnings = [];
        
        // Check if modules are initialized
        if (!this.dataManager) issues.push('DataManager not initialized');
        if (!this.uiState) issues.push('UIState not initialized');
        if (!this.headerController) issues.push('HeaderController not initialized');
        if (!this.contentController) issues.push('ContentController not initialized');
        if (!this.pdfViewer) issues.push('PDFViewer not initialized');
        
        // Check if data is loaded
        if (this.dataManager && !this.dataManager.isDataLoaded) {
            warnings.push('CSV data not loaded');
        }
        
        // Check UI state consistency
        if (this.uiState) {
            const state = this.uiState.getState();
            
            if (state.selectedQuestion && (!state.selectedYear || !state.selectedMonth)) {
                issues.push('Question selected without year/month');
            }
            
            if (state.isSolutionVisible && !state.currentProblem) {
                issues.push('Solution visible without current problem');
            }
        }
        
        return {
            isValid: issues.length === 0,
            issues,
            warnings,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Restart application (for error recovery)
     */
    async restart() {
        console.log('Restarting application...');
        
        // Reset state
        this.isInitialized = false;
        this.initializationError = null;
        
        // Clear UI state
        if (this.uiState) {
            this.uiState.reset();
        }
        
        // Hide any error messages
        this.hideGlobalError();
        
        // Reinitialize
        await this.init();
    }

    /**
     * Handle application errors gracefully
     * @param {Error} error - Error to handle
     * @param {string} context - Context where error occurred
     */
    handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        // Show user-friendly error message
        const userMessage = this.getUserFriendlyErrorMessage(error);
        this.showTemporaryMessage(userMessage, 'error');
        
        // Update UI state if available
        if (this.uiState) {
            this.uiState.setErrorMessage(userMessage);
        }
    }

    /**
     * Convert technical errors to user-friendly messages
     * @param {Error} error - Technical error
     * @returns {string} User-friendly message
     */
    getUserFriendlyErrorMessage(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('network') || message.includes('fetch')) {
            return '네트워크 연결을 확인해주세요.';
        } else if (message.includes('csv') || message.includes('parse')) {
            return '데이터 파일 형식에 문제가 있습니다.';
        } else if (message.includes('pdf')) {
            return '해설 파일을 불러올 수 없습니다.';
        } else if (message.includes('image') || message.includes('img')) {
            return '문제 이미지를 불러올 수 없습니다.';
        } else {
            return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
    }

    /**
     * Initialize memory monitoring for performance optimization
     */
    initializeMemoryMonitoring() {
        // Monitor memory usage every 2 minutes
        this.memoryMonitorInterval = setInterval(() => {
            this.performMemoryMonitoring();
        }, 2 * 60 * 1000);

        // Monitor when page becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.performMemoryMonitoring();
            }
        });

        // Clean up before page unload
        window.addEventListener('beforeunload', () => {
            this.performAppCleanup();
        });

        console.log('Memory monitoring initialized');
    }

    /**
     * Perform memory monitoring and cleanup
     * Performance optimization: Monitor and optimize memory usage
     */
    performMemoryMonitoring() {
        try {
            // Get memory information if available (Chrome)
            let memoryInfo = null;
            if (performance.memory) {
                memoryInfo = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                    usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
                };
            }

            // Get cache statistics
            const imageStats = this.contentController?.getCacheStats();
            const pdfStats = this.pdfViewer?.getPdfCacheStats();

            console.group('📊 Memory Monitoring Report');
            
            if (memoryInfo) {
                console.log(`JS Heap Usage: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB / ${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB (${memoryInfo.usagePercentage.toFixed(1)}%)`);
                
                // Trigger cleanup if memory usage is high
                if (memoryInfo.usagePercentage > 80) {
                    console.warn('High memory usage detected, performing cleanup...');
                    this.performMemoryCleanup();
                }
            }

            if (imageStats) {
                console.log(`Image Cache: ${imageStats.cacheSize}/${imageStats.maxCacheSize} images, ${(imageStats.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
            }

            if (pdfStats) {
                console.log(`PDF Cache: ${pdfStats.pdfCacheSize}/${pdfStats.maxPdfCacheSize} PDFs, ${pdfStats.pageCacheSize}/${pdfStats.maxPageCacheSize} pages`);
            }

            console.groupEnd();

        } catch (error) {
            console.error('Memory monitoring error:', error);
        }
    }

    /**
     * Perform comprehensive memory cleanup
     * Performance optimization: Clean up all cached resources
     */
    performMemoryCleanup() {
        console.log('🧹 Performing comprehensive memory cleanup...');

        try {
            // Clean up content controller cache
            if (this.contentController) {
                this.contentController.performMemoryCleanup();
            }

            // Clean up PDF viewer cache
            if (this.pdfViewer) {
                this.pdfViewer.performPdfMemoryCleanup();
            }

            // Force garbage collection if available
            if (window.gc && typeof window.gc === 'function') {
                window.gc();
                console.log('Forced garbage collection');
            }

            console.log('Memory cleanup completed');

        } catch (error) {
            console.error('Memory cleanup error:', error);
        }
    }

    /**
     * Get comprehensive performance statistics
     * @returns {Object} Performance statistics
     */
    getPerformanceStats() {
        const stats = {
            timestamp: new Date().toISOString(),
            memory: null,
            imageCache: null,
            pdfCache: null,
            loadTimes: {
                appInitialization: this.isInitialized ? 'completed' : 'pending',
                dataLoading: this.dataManager?.isDataLoaded ? 'completed' : 'pending'
            }
        };

        // Memory information
        if (performance.memory) {
            stats.memory = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            };
        }

        // Cache statistics
        if (this.contentController) {
            stats.imageCache = this.contentController.getCacheStats();
        }

        if (this.pdfViewer) {
            stats.pdfCache = this.pdfViewer.getPdfCacheStats();
        }

        return stats;
    }

    /**
     * Perform application cleanup
     * Performance optimization: Clean up all resources before unload
     */
    performAppCleanup() {
        console.log('🧹 Performing application cleanup...');

        try {
            // Clear memory monitoring interval
            if (this.memoryMonitorInterval) {
                clearInterval(this.memoryMonitorInterval);
                this.memoryMonitorInterval = null;
            }

            // Clean up content controller
            if (this.contentController) {
                this.contentController.cleanup();
            }

            // Clean up PDF viewer
            if (this.pdfViewer) {
                this.pdfViewer.clearPdfCache();
            }

            console.log('Application cleanup completed');

        } catch (error) {
            console.error('Application cleanup error:', error);
        }
    }

    /**
     * Test performance optimizations (for development/debugging)
     */
    testPerformanceOptimizations() {
        console.group('🧪 Testing Performance Optimizations');

        // Test image caching
        if (this.contentController) {
            console.log('Image cache stats:', this.contentController.getCacheStats());
        }

        // Test PDF caching
        if (this.pdfViewer) {
            console.log('PDF cache stats:', this.pdfViewer.getPdfCacheStats());
        }

        // Test memory monitoring
        this.performMemoryMonitoring();

        console.groupEnd();
    }

    /**
     * Set up debug panel for development and testing
     */
    setupDebugPanel() {
        // Check if we're in debug mode
        const isDebugMode = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' || 
                           window.location.search.includes('debug=true');

        if (!isDebugMode) {
            return;
        }

        // Add debug mode class to body
        document.body.classList.add('debug-mode');

        // Show debug controls
        const debugToggle = document.getElementById('debug-toggle');
        const debugPanel = document.getElementById('debug-panel');

        if (debugToggle) {
            debugToggle.classList.remove('hidden');
            debugToggle.addEventListener('click', () => {
                debugPanel.classList.toggle('hidden');
            });
        }

        if (debugPanel) {
            // Close button
            const closeBtn = document.getElementById('debug-panel-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    debugPanel.classList.add('hidden');
                });
            }

            // Compatibility test button
            const testCompatibilityBtn = document.getElementById('test-compatibility');
            if (testCompatibilityBtn) {
                testCompatibilityBtn.addEventListener('click', async () => {
                    await this.runCompatibilityTestsUI();
                });
            }

            // Functionality test button
            const testFunctionalityBtn = document.getElementById('test-functionality');
            if (testFunctionalityBtn) {
                testFunctionalityBtn.addEventListener('click', async () => {
                    await this.runFunctionalityTestsUI();
                });
            }

            // Export debug info button
            const exportDebugBtn = document.getElementById('export-debug-info');
            if (exportDebugBtn) {
                exportDebugBtn.addEventListener('click', () => {
                    this.exportDebugInfoUI();
                });
            }

            // Clear logs button
            const clearLogsBtn = document.getElementById('clear-logs');
            if (clearLogsBtn) {
                clearLogsBtn.addEventListener('click', () => {
                    this.clearLogsUI();
                });
            }

            // Error testing buttons
            const testImageErrorBtn = document.getElementById('test-image-error');
            if (testImageErrorBtn) {
                testImageErrorBtn.addEventListener('click', () => {
                    this.testImageErrorUI();
                });
            }

            const testPdfErrorBtn = document.getElementById('test-pdf-error');
            if (testPdfErrorBtn) {
                testPdfErrorBtn.addEventListener('click', () => {
                    this.testPdfErrorUI();
                });
            }

            const testCsvErrorBtn = document.getElementById('test-csv-error');
            if (testCsvErrorBtn) {
                testCsvErrorBtn.addEventListener('click', () => {
                    this.testCsvErrorUI();
                });
            }

            // Update debug stats periodically
            this.updateDebugStats();
            setInterval(() => {
                this.updateDebugStats();
            }, 5000);
        }

        if (this.debugLogger) {
            this.debugLogger.info('Debug panel initialized');
        }
    }

    /**
     * Run compatibility tests and display results in UI
     */
    async runCompatibilityTestsUI() {
        const resultsDiv = document.getElementById('compatibility-results');
        if (!resultsDiv || !this.browserCompatibility) {
            return;
        }

        resultsDiv.innerHTML = '<div class="test-info">Running compatibility tests...</div>';

        try {
            const results = this.browserCompatibility.runCompatibilityTests();
            
            let html = `<div class="test-info">Compatibility Test Results:</div>`;
            html += `<div class="test-info">Score: ${results.overall.score}%</div>`;
            html += `<div class="test-pass">Passed: ${results.overall.passed}</div>`;
            html += `<div class="test-fail">Failed: ${results.overall.failed}</div>`;
            html += `<div class="test-warning">Warnings: ${results.overall.warnings}</div>`;

            // Show failed tests
            if (results.overall.failed > 0) {
                html += `<div class="test-fail">Failed Tests:</div>`;
                Object.entries(results.tests).forEach(([category, tests]) => {
                    Object.entries(tests).forEach(([testName, test]) => {
                        if (test.status === 'fail') {
                            html += `<div class="test-fail">- ${category}.${testName}: ${test.message}</div>`;
                        }
                    });
                });
            }

            resultsDiv.innerHTML = html;

            if (this.debugLogger) {
                this.debugLogger.info('Compatibility tests completed via UI', results.overall);
            }

        } catch (error) {
            resultsDiv.innerHTML = `<div class="test-fail">Error running tests: ${error.message}</div>`;
            if (this.debugLogger) {
                this.debugLogger.logError('Compatibility tests failed via UI', { error: error.message });
            }
        }
    }

    /**
     * Run functionality tests and display results in UI
     */
    async runFunctionalityTestsUI() {
        const resultsDiv = document.getElementById('compatibility-results');
        if (!resultsDiv || !this.browserCompatibility) {
            return;
        }

        resultsDiv.innerHTML = '<div class="test-info">Running functionality tests...</div>';

        try {
            const results = await this.testCrossBrowserFunctionality();
            
            let html = `<div class="test-info">Functionality Test Results:</div>`;
            
            Object.entries(results).forEach(([testName, result]) => {
                const statusClass = result.status === 'pass' ? 'test-pass' : 
                                   result.status === 'fail' ? 'test-fail' : 'test-warning';
                html += `<div class="${statusClass}">${testName}: ${result.message}</div>`;
            });

            resultsDiv.innerHTML = html;

            if (this.debugLogger) {
                this.debugLogger.info('Functionality tests completed via UI', results);
            }

        } catch (error) {
            resultsDiv.innerHTML = `<div class="test-fail">Error running functionality tests: ${error.message}</div>`;
            if (this.debugLogger) {
                this.debugLogger.logError('Functionality tests failed via UI', { error: error.message });
            }
        }
    }

    /**
     * Export debug information via UI
     */
    exportDebugInfoUI() {
        try {
            const debugInfo = this.exportDebugInfo();
            
            // Create and download file
            const blob = new Blob([debugInfo], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `debug-info-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showTemporaryMessage('Debug information exported successfully', 'success', 3000);

            if (this.debugLogger) {
                this.debugLogger.info('Debug information exported via UI');
            }

        } catch (error) {
            this.showTemporaryMessage(`Export failed: ${error.message}`, 'error');
            if (this.debugLogger) {
                this.debugLogger.logError('Debug info export failed via UI', { error: error.message });
            }
        }
    }

    /**
     * Clear logs via UI
     */
    clearLogsUI() {
        if (this.debugLogger) {
            this.debugLogger.clearLogs();
            this.showTemporaryMessage('Logs cleared successfully', 'success', 2000);
            this.updateDebugStats();
        }
    }

    /**
     * Test image error handling via UI
     */
    testImageErrorUI() {
        if (this.contentController) {
            this.contentController.displayProblemImage('nonexistent-image.png')
                .catch(error => {
                    this.showTemporaryMessage(`Image error test: ${error.message}`, 'info', 3000);
                });
        }
    }

    /**
     * Test PDF error handling via UI
     */
    testPdfErrorUI() {
        if (this.pdfViewer) {
            this.pdfViewer.loadPDF('nonexistent-pdf.pdf')
                .catch(error => {
                    this.showTemporaryMessage(`PDF error test: ${error.message}`, 'info', 3000);
                });
        }
    }

    /**
     * Test CSV error handling via UI
     */
    testCsvErrorUI() {
        if (this.dataManager) {
            this.dataManager.loadCSVData('nonexistent-csv.csv')
                .catch(error => {
                    this.showTemporaryMessage(`CSV error test: ${error.message}`, 'info', 3000);
                });
        }
    }

    /**
     * Update debug statistics in UI
     */
    updateDebugStats() {
        const debugStatsDiv = document.getElementById('debug-stats');
        if (!debugStatsDiv || !this.debugLogger) {
            return;
        }

        const stats = this.debugLogger.getSessionStats();
        const browserInfo = this.browserCompatibility ? this.browserCompatibility.browserInfo : null;

        let html = '';
        if (browserInfo) {
            html += `<div>Browser: ${browserInfo.name} ${browserInfo.version}</div>`;
            html += `<div>Engine: ${browserInfo.engine}</div>`;
            html += `<div>Mobile: ${browserInfo.isMobile ? 'Yes' : 'No'}</div>`;
        }
        
        html += `<div>Session: ${stats.sessionId.slice(-8)}</div>`;
        html += `<div>Duration: ${Math.round(stats.duration / 1000)}s</div>`;
        html += `<div>Total Logs: ${stats.totalLogs}</div>`;
        html += `<div>Errors: ${stats.errorCount}</div>`;
        html += `<div>Warnings: ${stats.warningCount}</div>`;
        html += `<div>Log Level: ${stats.logLevel}</div>`;

        if (performance.memory) {
            const memory = performance.memory;
            html += `<div>Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB</div>`;
        }

        debugStatsDiv.innerHTML = html;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init().catch(error => {
        console.error('Failed to initialize app:', error);
    });
    
    // Make app globally available for debugging
    window.mathApp = app;
});
