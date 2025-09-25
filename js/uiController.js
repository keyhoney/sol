// UI Controller Module
// Manages UI state and controls for the math problem solver webapp

/**
 * Controls header dropdown interactions
 */
export class HeaderController {
    constructor(dataManager, uiState) {
        this.dataManager = dataManager;
        this.uiState = uiState;
        
        // Get DOM elements
        this.yearSelect = document.getElementById('year-select');
        this.monthSelect = document.getElementById('month-select');
        this.questionSelect = document.getElementById('question-select');
        this.resetBtn = document.getElementById('reset-btn');
        
        // Validate DOM elements
        if (!this.yearSelect || !this.monthSelect || !this.questionSelect || !this.resetBtn) {
            throw new Error('Required DOM elements not found for HeaderController');
        }
        
        // Bind event handlers
        this.initializeEventHandlers();
        
        // Listen to state changes
        this.uiState.addStateChangeListener(this.handleStateChange.bind(this));
    }

    /**
     * Initialize event handlers for dropdowns and reset button
     */
    initializeEventHandlers() {
        // Year selection change
        this.yearSelect.addEventListener('change', (e) => {
            const selectedYear = e.target.value || null;
            this.uiState.setSelectedYear(selectedYear);
            
            if (selectedYear) {
                // Update month options for selected year
                const months = this.dataManager.getMonthsForYear(selectedYear);
                this.updateMonthOptions(months);
                this.enableDropdown(this.monthSelect);
            } else {
                // Clear and disable dependent dropdowns
                this.updateMonthOptions([]);
                this.updateQuestionOptions([]);
                this.disableDropdown(this.monthSelect);
                this.disableDropdown(this.questionSelect);
            }
        });

        // Month selection change
        this.monthSelect.addEventListener('change', (e) => {
            const selectedMonth = e.target.value || null;
            this.uiState.setSelectedMonth(selectedMonth);
            
            if (selectedMonth && this.uiState.selectedYear) {
                // Update question options for selected year and month
                const questions = this.dataManager.getQuestionsForYearMonth(
                    this.uiState.selectedYear, 
                    selectedMonth
                );
                this.updateQuestionOptions(questions);
                this.enableDropdown(this.questionSelect);
            } else {
                // Clear and disable question dropdown
                this.updateQuestionOptions([]);
                this.disableDropdown(this.questionSelect);
            }
        });

        // Question selection change
        this.questionSelect.addEventListener('change', (e) => {
            const selectedQuestion = e.target.value || null;
            this.uiState.setSelectedQuestion(selectedQuestion);
        });

        // Reset button click
        this.resetBtn.addEventListener('click', () => {
            this.resetSelections();
        });
    }

    /**
     * Handle UI state changes
     * @param {string} property - Changed property
     * @param {*} oldValue - Previous value
     * @param {*} newValue - New value
     * @param {UIState} state - Current state
     */
    handleStateChange(property, oldValue, newValue, state) {
        switch (property) {
            case 'selectedYear':
                this.updateResetButtonState();
                break;
            case 'selectedMonth':
                this.updateResetButtonState();
                break;
            case 'selectedQuestion':
                this.updateResetButtonState();
                break;
        }
    }

    /**
     * Update year dropdown options
     * @param {Array<string>} years - Available years
     */
    updateYearOptions(years) {
        // Clear existing options except the first placeholder
        this.yearSelect.innerHTML = '<option value="">학년도 선택</option>';
        
        // Add year options
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = `${year}년`;
            this.yearSelect.appendChild(option);
        });
        
        // Enable year dropdown if years are available
        if (years.length > 0) {
            this.enableDropdown(this.yearSelect);
        } else {
            this.disableDropdown(this.yearSelect);
        }
    }

    /**
     * Update month dropdown options
     * @param {Array<string>} months - Available months
     */
    updateMonthOptions(months) {
        // Clear existing options except the first placeholder
        this.monthSelect.innerHTML = '<option value="">시행월 선택</option>';
        
        // Add month options
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = `${month}월`;
            this.monthSelect.appendChild(option);
        });
        
        // Reset selection
        this.monthSelect.value = '';
    }

    /**
     * Update question dropdown options
     * @param {Array<string>} questions - Available questions
     */
    updateQuestionOptions(questions) {
        // Clear existing options except the first placeholder
        this.questionSelect.innerHTML = '<option value="">문항번호 선택</option>';
        
        // Add question options
        questions.forEach(question => {
            const option = document.createElement('option');
            option.value = question;
            option.textContent = `${question}번`;
            this.questionSelect.appendChild(option);
        });
        
        // Reset selection
        this.questionSelect.value = '';
    }

    /**
     * Enable a dropdown element
     * @param {HTMLSelectElement} dropdown - Dropdown to enable
     */
    enableDropdown(dropdown) {
        dropdown.disabled = false;
        dropdown.classList.remove('disabled');
    }

    /**
     * Disable a dropdown element
     * @param {HTMLSelectElement} dropdown - Dropdown to disable
     */
    disableDropdown(dropdown) {
        dropdown.disabled = true;
        dropdown.classList.add('disabled');
        dropdown.value = ''; // Reset selection
    }

    /**
     * Update reset button state based on current selections
     */
    updateResetButtonState() {
        const hasAnySelection = !!(
            this.uiState.selectedYear || 
            this.uiState.selectedMonth || 
            this.uiState.selectedQuestion
        );
        
        this.resetBtn.disabled = !hasAnySelection;
        
        if (hasAnySelection) {
            this.resetBtn.classList.remove('disabled');
        } else {
            this.resetBtn.classList.add('disabled');
        }
    }

    /**
     * Reset all selections
     */
    resetSelections() {
        // Reset UI state
        this.uiState.reset();
        
        // Reset dropdown values
        this.yearSelect.value = '';
        this.monthSelect.value = '';
        this.questionSelect.value = '';
        
        // Clear and disable dependent dropdowns
        this.updateMonthOptions([]);
        this.updateQuestionOptions([]);
        this.disableDropdown(this.monthSelect);
        this.disableDropdown(this.questionSelect);
        
        // Update reset button state
        this.updateResetButtonState();
    }

    /**
     * Set initial state after data is loaded
     */
    initializeWithData() {
        if (this.dataManager.isDataLoaded) {
            const years = this.dataManager.getAvailableYears();
            this.updateYearOptions(years);
        }
    }

    /**
     * Handle selection changes (for external callbacks)
     * @param {Function} callback - Callback function
     */
    onSelectionChange(callback) {
        this.uiState.addStateChangeListener((property, oldValue, newValue, state) => {
            if (['selectedYear', 'selectedMonth', 'selectedQuestion'].includes(property)) {
                callback(property, oldValue, newValue, state);
            }
        });
    }

    /**
     * Get current selections
     * @returns {Object} Current selections
     */
    getCurrentSelections() {
        return {
            year: this.uiState.selectedYear,
            month: this.uiState.selectedMonth,
            question: this.uiState.selectedQuestion
        };
    }

    /**
     * Set selections programmatically
     * @param {string} year - Year to select
     * @param {string} month - Month to select
     * @param {string} question - Question to select
     */
    setSelections(year = null, month = null, question = null) {
        if (year) {
            this.yearSelect.value = year;
            this.uiState.setSelectedYear(year);
            
            if (month) {
                const months = this.dataManager.getMonthsForYear(year);
                this.updateMonthOptions(months);
                this.enableDropdown(this.monthSelect);
                this.monthSelect.value = month;
                this.uiState.setSelectedMonth(month);
                
                if (question) {
                    const questions = this.dataManager.getQuestionsForYearMonth(year, month);
                    this.updateQuestionOptions(questions);
                    this.enableDropdown(this.questionSelect);
                    this.questionSelect.value = question;
                    this.uiState.setSelectedQuestion(question);
                }
            }
        }
    }
}

/**
 * Controls main content display
 */
export class ContentController {
    constructor(pdfViewer, uiState) {
        this.pdfViewer = pdfViewer;
        this.uiState = uiState;
        
        // Get DOM elements
        this.loadingSpinner = document.getElementById('loading-spinner');
        this.errorMessage = document.getElementById('error-message');
        this.errorMessageText = this.errorMessage?.querySelector('.error-message__text');
        this.retryBtn = document.getElementById('retry-btn');
        this.problemImageContainer = document.getElementById('problem-image-container');
        this.problemImage = document.getElementById('problem-image');
        this.solutionBtn = document.getElementById('solution-btn');
        
        // Validate DOM elements
        if (!this.loadingSpinner || !this.errorMessage || !this.errorMessageText || 
            !this.retryBtn || !this.problemImageContainer || !this.problemImage || 
            !this.solutionBtn) {
            throw new Error('Required DOM elements not found for ContentController');
        }
        
        // Initialize event handlers
        this.initializeEventHandlers();
        
        // Listen to state changes
        this.uiState.addStateChangeListener(this.handleStateChange.bind(this));
        
        // Track current image loading
        this.currentImagePath = null;
        this.imageLoadPromise = null;
        
        // Performance optimization: Image cache
        this.imageCache = new Map();
        this.maxCacheSize = 20; // Cache up to 20 images
        
        // Performance optimization: Lazy loading
        this.intersectionObserver = null;
        this.initializeLazyLoading();
        
        // Performance optimization: Memory management
        this.memoryCleanupInterval = null;
        this.initializeMemoryManagement();
    }

    /**
     * Initialize event handlers
     */
    initializeEventHandlers() {
        // Solution button click
        this.solutionBtn.addEventListener('click', () => {
            if (this.uiState.isSolutionVisible) {
                // Hide solution
                this.uiState.setSolutionVisible(false);
                this.pdfViewer.hidePDF();
            } else {
                // Show solution
                if (this.uiState.currentProblem) {
                    const pdfPath = this.uiState.currentProblem.getPDFPath();
                    this.loadAndShowSolution(pdfPath);
                }
            }
        });

        // Retry button click
        this.retryBtn.addEventListener('click', () => {
            if (this.currentImagePath) {
                this.displayProblemImage(this.currentImagePath);
            }
        });

        // Image load error handling
        this.problemImage.addEventListener('error', () => {
            this.showErrorMessage('문제 이미지를 불러올 수 없습니다. 파일이 존재하지 않거나 손상되었을 수 있습니다.');
            this.uiState.setLoading(false);
        });

        // Image load success
        this.problemImage.addEventListener('load', () => {
            this.showProblemImageContainer();
            this.uiState.setLoading(false);
            this.toggleSolutionButton(true);
        });
    }

    /**
     * Handle UI state changes
     * @param {string} property - Changed property
     * @param {*} oldValue - Previous value
     * @param {*} newValue - New value
     * @param {UIState} state - Current state
     */
    handleStateChange(property, oldValue, newValue, state) {
        switch (property) {
            case 'isLoading':
                if (newValue) {
                    this.showLoadingState();
                } else {
                    this.hideLoadingState();
                }
                break;
                
            case 'errorMessage':
                if (newValue) {
                    this.showErrorMessage(newValue);
                } else {
                    this.hideErrorMessage();
                }
                break;
                
            case 'selectedQuestion':
                if (newValue && state.selectedYear && state.selectedMonth) {
                    // Load problem image when question is selected
                    // Note: ProblemData will be imported by the main app
                    this.loadProblemForSelection(state.selectedYear, state.selectedMonth, newValue);
                } else {
                    // Hide problem image when question is deselected
                    this.hideProblemImage();
                    this.toggleSolutionButton(false);
                }
                break;
                
            case 'isSolutionVisible':
                this.updateSolutionButtonText(newValue);
                break;
        }
    }

    /**
     * Display problem image with enhanced error handling and retry logic
     * @param {string} imagePath - Path to image file
     */
    async displayProblemImage(imagePath) {
        if (!imagePath) {
            this.showErrorMessage('이미지 경로가 제공되지 않았습니다.');
            return;
        }

        // Validate image path format
        if (typeof imagePath !== 'string' || imagePath.trim().length === 0) {
            this.showErrorMessage('유효하지 않은 이미지 경로입니다.');
            return;
        }

        // Store current image path for retry functionality
        this.currentImagePath = imagePath;
        
        // Set loading state
        this.uiState.setLoading(true);
        this.hideErrorMessage();
        this.hideProblemImage();
        this.toggleSolutionButton(false);

        console.log(`이미지 로딩 시작: ${imagePath}`);

        try {
            // Performance optimization: Try to load from cache first
            const cachedImage = await this.loadImageFromCache(imagePath);
            
            // Set the image source from cache or newly loaded image
            this.problemImage.src = cachedImage.src;
            this.problemImage.alt = `문제 이미지: ${imagePath}`;
            
            // Update cache access count
            if (this.imageCache.has(imagePath)) {
                const cacheData = this.imageCache.get(imagePath);
                cacheData.accessCount++;
                cacheData.timestamp = Date.now(); // Update last access time
            }
            
        } catch (error) {
            console.error('Error loading image after retries:', error);
            
            // Enhanced error message based on error type
            let errorMessage = error.message;
            
            // Categorize error types for better user experience
            if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                errorMessage = '문제 이미지 파일이 존재하지 않습니다. 다른 문제를 선택해보세요.';
            } else if (errorMessage.includes('timeout') || errorMessage.includes('시간 초과')) {
                errorMessage = '이미지 로딩 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
            } else if (errorMessage.includes('network') || errorMessage.includes('네트워크')) {
                errorMessage = '네트워크 오류로 이미지를 불러올 수 없습니다. 인터넷 연결을 확인해주세요.';
            } else if (errorMessage.includes('corrupted') || errorMessage.includes('손상')) {
                errorMessage = '이미지 파일이 손상되었습니다. 관리자에게 문의해주세요.';
            }
            
            this.showErrorMessage(errorMessage);
            this.uiState.setLoading(false);
            
            // Set error state in UI
            this.uiState.setErrorMessage(errorMessage);
        }
    }

    /**
     * Retry image loading with exponential backoff
     * @param {string} imagePath - Path to image file
     * @param {number} maxRetries - Maximum number of retries
     */
    async retryImageLoadWithBackoff(imagePath, maxRetries = 2) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                console.log(`이미지 로딩 시도 ${attempt}/${maxRetries + 1}: ${imagePath}`);
                
                // Load image with timeout
                await this.loadImageWithTimeout(imagePath, 15000); // 15 second timeout
                
                // Success - set the image source
                this.problemImage.src = imagePath;
                this.problemImage.alt = `문제 이미지: ${imagePath}`;
                
                if (attempt > 1) {
                    console.log(`이미지 로딩 재시도 성공: ${imagePath}`);
                }
                
                return; // Success
                
            } catch (error) {
                lastError = error;
                console.error(`이미지 로딩 시도 ${attempt} 실패:`, error);

                if (attempt === maxRetries + 1) {
                    // Final attempt failed
                    break;
                }

                // Wait before retrying with exponential backoff
                const delay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500; // 1s, 2s, 4s + jitter
                console.log(`${delay.toFixed(0)}ms 후 이미지 로딩 재시도...`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // All retries failed
        throw new Error(`이미지 로딩 실패 (${maxRetries + 1}회 시도): ${lastError.message}`);
    }

    /**
     * Load image with timeout and enhanced error detection
     * @param {string} imagePath - Path to image file
     * @param {number} timeoutMs - Timeout in milliseconds
     * @returns {Promise<void>}
     */
    async loadImageWithTimeout(imagePath, timeoutMs = 10000) {
        return new Promise(async (resolve, reject) => {
            let timeoutId;
            let img;

            // Set up timeout
            timeoutId = setTimeout(() => {
                if (img) {
                    img.onload = null;
                    img.onerror = null;
                }
                reject(new Error(`이미지 로딩 시간 초과 (${timeoutMs / 1000}초). 네트워크 연결이 느리거나 파일이 너무 클 수 있습니다.`));
            }, timeoutMs);

            try {
                // First, check if the image file exists and is accessible
                const response = await fetch(imagePath, { 
                    method: 'HEAD',
                    cache: 'no-cache'
                });

                if (!response.ok) {
                    clearTimeout(timeoutId);
                    
                    let errorMessage;
                    switch (response.status) {
                        case 404:
                            errorMessage = '문제 이미지 파일이 존재하지 않습니다.';
                            break;
                        case 403:
                            errorMessage = '이미지 파일에 접근할 권한이 없습니다.';
                            break;
                        case 500:
                        case 502:
                        case 503:
                            errorMessage = '서버 오류로 이미지를 불러올 수 없습니다.';
                            break;
                        default:
                            errorMessage = `이미지 로딩 오류 (${response.status}): ${response.statusText}`;
                    }
                    
                    reject(new Error(errorMessage));
                    return;
                }

                // Check content type if available
                const contentType = response.headers.get('content-type');
                if (contentType && !contentType.startsWith('image/')) {
                    clearTimeout(timeoutId);
                    reject(new Error('파일이 이미지 형식이 아닙니다.'));
                    return;
                }

            } catch (fetchError) {
                clearTimeout(timeoutId);
                
                if (fetchError.name === 'AbortError') {
                    reject(new Error('이미지 파일 확인 시간이 초과되었습니다.'));
                } else if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
                    reject(new Error('네트워크 오류로 이미지 파일을 확인할 수 없습니다.'));
                } else {
                    reject(new Error(`이미지 파일 확인 실패: ${fetchError.message}`));
                }
                return;
            }

            // If file exists and is accessible, try to load it as an image
            img = new Image();
            
            img.onload = () => {
                clearTimeout(timeoutId);
                console.log(`이미지 로딩 성공: ${imagePath} (${img.naturalWidth}x${img.naturalHeight})`);
                resolve();
            };
            
            img.onerror = (event) => {
                clearTimeout(timeoutId);
                console.error(`이미지 렌더링 실패: ${imagePath}`, event);
                
                // Image file exists but can't be rendered
                reject(new Error('이미지 파일이 손상되었거나 지원되지 않는 형식입니다.'));
            };
            
            // Start loading the image
            img.src = imagePath;
        });
    }

    /**
     * Load problem for current selection (called by state change handler)
     * @param {string} year - Selected year
     * @param {string} month - Selected month  
     * @param {string} question - Selected question
     */
    loadProblemForSelection(year, month, question) {
        // This method will be called by the main app with a ProblemData instance
        // For now, we'll create the image path directly
        const paddedMonth = month.padStart(2, '0');
        const paddedQuestion = question.padStart(2, '0');
        const imagePath = `mun/${year}${paddedMonth}${paddedQuestion}.png`;
        
        this.displayProblemImage(imagePath);
    }

    /**
     * Set current problem data (called by main app)
     * @param {ProblemData} problemData - Problem data instance
     */
    setCurrentProblem(problemData) {
        this.uiState.setCurrentProblem(problemData);
        if (problemData) {
            this.displayProblemImage(problemData.getImagePath());
        }
    }

    /**
     * Load and show solution PDF with enhanced error handling
     * @param {string} pdfPath - Path to PDF file
     */
    async loadAndShowSolution(pdfPath) {
        if (!pdfPath) {
            this.uiState.setPdfError('PDF 경로가 제공되지 않았습니다.');
            return;
        }

        console.log(`해설 PDF 로딩 시작: ${pdfPath}`);

        try {
            this.uiState.setPdfLoading(true);
            
            // Use retry mechanism for PDF loading
            await this.retryPdfLoadWithBackoff(pdfPath, 2); // 2 retries for PDFs
            
            this.pdfViewer.showPDF();
            this.uiState.setSolutionVisible(true);
            console.log('해설 PDF 로딩 및 표시 완료');
            
        } catch (error) {
            console.error('Error loading PDF after retries:', error);
            
            // Enhanced error message based on error type
            let errorMessage = error.message;
            
            // Categorize error types for better user experience
            if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                errorMessage = '해설 파일이 존재하지 않습니다. 아직 해설이 준비되지 않았을 수 있습니다.';
            } else if (errorMessage.includes('timeout') || errorMessage.includes('시간 초과')) {
                errorMessage = 'PDF 로딩 시간이 초과되었습니다. 파일이 크거나 네트워크가 느릴 수 있습니다.';
            } else if (errorMessage.includes('network') || errorMessage.includes('네트워크')) {
                errorMessage = '네트워크 오류로 해설을 불러올 수 없습니다. 인터넷 연결을 확인해주세요.';
            } else if (errorMessage.includes('InvalidPDF') || errorMessage.includes('손상')) {
                errorMessage = 'PDF 파일이 손상되었습니다. 관리자에게 문의해주세요.';
            }
            
            this.uiState.setPdfError(errorMessage);
            this.uiState.setSolutionVisible(false);
            
        } finally {
            this.uiState.setPdfLoading(false);
        }
    }

    /**
     * Retry PDF loading with exponential backoff
     * @param {string} pdfPath - Path to PDF file
     * @param {number} maxRetries - Maximum number of retries
     */
    async retryPdfLoadWithBackoff(pdfPath, maxRetries = 2) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                console.log(`PDF 로딩 시도 ${attempt}/${maxRetries + 1}: ${pdfPath}`);
                
                // Load PDF with enhanced timeout handling
                await this.pdfViewer.loadPDF(pdfPath);
                
                if (attempt > 1) {
                    console.log(`PDF 로딩 재시도 성공: ${pdfPath}`);
                }
                
                return; // Success
                
            } catch (error) {
                lastError = error;
                console.error(`PDF 로딩 시도 ${attempt} 실패:`, error);

                if (attempt === maxRetries + 1) {
                    // Final attempt failed
                    break;
                }

                // Wait before retrying with exponential backoff
                const delay = Math.pow(2, attempt - 1) * 2000 + Math.random() * 1000; // 2s, 4s, 8s + jitter
                console.log(`${delay.toFixed(0)}ms 후 PDF 로딩 재시도...`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // All retries failed
        throw new Error(`PDF 로딩 실패 (${maxRetries + 1}회 시도): ${lastError.message}`);
    }

    /**
     * Retry loading current image
     */
    retryImageLoad() {
        if (this.currentImagePath) {
            console.log(`이미지 재시도: ${this.currentImagePath}`);
            this.displayProblemImage(this.currentImagePath);
        } else {
            this.showErrorMessage('재시도할 이미지가 없습니다.');
        }
    }

    /**
     * Check if image file exists
     * @param {string} imagePath - Path to image file
     * @returns {Promise<boolean>} True if image exists
     */
    async checkImageExists(imagePath) {
        try {
            const response = await fetch(imagePath, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error('이미지 존재 확인 실패:', error);
            return false;
        }
    }

    /**
     * Validate image file before loading
     * @param {string} imagePath - Path to image file
     * @returns {Promise<boolean>} True if image is valid
     */
    async validateImageFile(imagePath) {
        if (!imagePath || typeof imagePath !== 'string') {
            return false;
        }

        // Check file extension
        const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
        const hasValidExtension = validExtensions.some(ext => 
            imagePath.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
            console.warn(`지원되지 않는 이미지 형식: ${imagePath}`);
            return false;
        }

        // Check if file exists
        return await this.checkImageExists(imagePath);
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.hideAllContentStates();
        this.loadingSpinner.classList.remove('hidden');
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        this.loadingSpinner.classList.add('hidden');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showErrorMessage(message) {
        this.hideAllContentStates();
        this.errorMessageText.textContent = message;
        this.errorMessage.classList.remove('hidden');
    }

    /**
     * Hide error message
     */
    hideErrorMessage() {
        this.errorMessage.classList.add('hidden');
    }

    /**
     * Show problem image container
     */
    showProblemImageContainer() {
        this.hideAllContentStates();
        this.problemImageContainer.classList.remove('hidden');
    }

    /**
     * Hide problem image
     */
    hideProblemImage() {
        this.problemImageContainer.classList.add('hidden');
        this.problemImage.src = '';
        this.problemImage.alt = '';
    }

    /**
     * Hide all content states (loading, error, image)
     */
    hideAllContentStates() {
        this.hideLoadingState();
        this.hideErrorMessage();
        this.hideProblemImage();
    }

    /**
     * Toggle solution button state
     * @param {boolean} enabled - Button enabled state
     */
    toggleSolutionButton(enabled) {
        this.solutionBtn.disabled = !enabled;
        
        if (enabled) {
            this.solutionBtn.classList.remove('disabled');
        } else {
            this.solutionBtn.classList.add('disabled');
        }
    }

    /**
     * Update solution button text based on visibility state
     * @param {boolean} isVisible - Whether solution is visible
     */
    updateSolutionButtonText(isVisible) {
        this.solutionBtn.textContent = isVisible ? '해설 닫기' : '해설 보기';
    }

    /**
     * Clear all content
     */
    clearContent() {
        this.hideAllContentStates();
        this.toggleSolutionButton(false);
        this.currentImagePath = null;
        this.imageLoadPromise = null;
    }

    /**
     * Get current display state
     * @returns {Object} Current display state
     */
    getCurrentState() {
        return {
            isLoading: !this.loadingSpinner.classList.contains('hidden'),
            hasError: !this.errorMessage.classList.contains('hidden'),
            hasImage: !this.problemImageContainer.classList.contains('hidden'),
            solutionButtonEnabled: !this.solutionBtn.disabled,
            currentImagePath: this.currentImagePath
        };
    }

    /**
     * Initialize lazy loading for images
     * Performance optimization: Only load images when they're about to be viewed
     */
    initializeLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        if (src && !img.src) {
                            this.loadImageFromCache(src).then(() => {
                                img.src = src;
                                img.classList.remove('lazy-loading');
                                this.intersectionObserver.unobserve(img);
                            }).catch(error => {
                                console.error('Lazy loading failed:', error);
                                img.classList.add('lazy-error');
                            });
                        }
                    }
                });
            }, {
                rootMargin: '50px' // Start loading 50px before image comes into view
            });
        }
    }

    /**
     * Initialize memory management
     * Performance optimization: Clean up unused resources periodically
     */
    initializeMemoryManagement() {
        // Clean up memory every 5 minutes
        this.memoryCleanupInterval = setInterval(() => {
            this.performMemoryCleanup();
        }, 5 * 60 * 1000);

        // Clean up when page becomes hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.performMemoryCleanup();
            }
        });

        // Clean up before page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * Load image from cache or fetch if not cached
     * Performance optimization: Cache frequently accessed images
     * @param {string} imagePath - Path to image
     * @returns {Promise<HTMLImageElement>}
     */
    async loadImageFromCache(imagePath) {
        // Check if image is already in cache
        if (this.imageCache.has(imagePath)) {
            const cachedData = this.imageCache.get(imagePath);
            console.log(`Image loaded from cache: ${imagePath}`);
            return cachedData.image;
        }

        // Load image and add to cache
        try {
            const image = await this.preloadImage(imagePath);
            
            // Manage cache size
            if (this.imageCache.size >= this.maxCacheSize) {
                // Remove oldest cached image
                const firstKey = this.imageCache.keys().next().value;
                const removedData = this.imageCache.get(firstKey);
                this.imageCache.delete(firstKey);
                
                // Clean up removed image
                if (removedData && removedData.image) {
                    removedData.image.src = '';
                }
                
                console.log(`Cache full, removed: ${firstKey}`);
            }

            // Add to cache with metadata
            this.imageCache.set(imagePath, {
                image: image,
                timestamp: Date.now(),
                accessCount: 1,
                size: this.estimateImageSize(image)
            });

            console.log(`Image cached: ${imagePath} (cache size: ${this.imageCache.size})`);
            return image;

        } catch (error) {
            console.error(`Failed to load and cache image: ${imagePath}`, error);
            throw error;
        }
    }

    /**
     * Preload image with enhanced error handling
     * @param {string} imagePath - Path to image
     * @returns {Promise<HTMLImageElement>}
     */
    async preloadImage(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                console.log(`Image preloaded: ${imagePath} (${img.naturalWidth}x${img.naturalHeight})`);
                resolve(img);
            };
            
            img.onerror = (error) => {
                console.error(`Image preload failed: ${imagePath}`, error);
                reject(new Error(`Failed to preload image: ${imagePath}`));
            };
            
            // Set crossOrigin if needed for CORS
            img.crossOrigin = 'anonymous';
            img.src = imagePath;
        });
    }

    /**
     * Estimate image memory size
     * @param {HTMLImageElement} image - Image element
     * @returns {number} Estimated size in bytes
     */
    estimateImageSize(image) {
        if (!image.naturalWidth || !image.naturalHeight) {
            return 0;
        }
        // Rough estimate: width * height * 4 bytes per pixel (RGBA)
        return image.naturalWidth * image.naturalHeight * 4;
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        let totalSize = 0;
        let totalAccessCount = 0;
        
        for (const [path, data] of this.imageCache) {
            totalSize += data.size || 0;
            totalAccessCount += data.accessCount || 0;
        }

        return {
            cacheSize: this.imageCache.size,
            maxCacheSize: this.maxCacheSize,
            totalMemoryUsage: totalSize,
            averageAccessCount: this.imageCache.size > 0 ? totalAccessCount / this.imageCache.size : 0,
            cachedImages: Array.from(this.imageCache.keys())
        };
    }

    /**
     * Perform memory cleanup
     * Performance optimization: Free up unused resources
     */
    performMemoryCleanup() {
        console.log('Performing memory cleanup...');
        
        const beforeStats = this.getCacheStats();
        let cleanedCount = 0;

        // Clean up old cached images (older than 10 minutes and accessed less than 3 times)
        const now = Date.now();
        const maxAge = 10 * 60 * 1000; // 10 minutes
        const minAccessCount = 3;

        for (const [path, data] of this.imageCache) {
            const age = now - data.timestamp;
            if (age > maxAge && data.accessCount < minAccessCount) {
                // Clean up image
                if (data.image) {
                    data.image.src = '';
                }
                this.imageCache.delete(path);
                cleanedCount++;
            }
        }

        // Force garbage collection if available (Chrome DevTools)
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }

        const afterStats = this.getCacheStats();
        console.log(`Memory cleanup completed: removed ${cleanedCount} images, ` +
                   `cache size: ${beforeStats.cacheSize} → ${afterStats.cacheSize}, ` +
                   `memory usage: ${(beforeStats.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB → ${(afterStats.totalMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }

    /**
     * Clear image cache
     * Performance optimization: Manual cache clearing
     */
    clearImageCache() {
        console.log(`Clearing image cache (${this.imageCache.size} images)`);
        
        // Clean up all cached images
        for (const [path, data] of this.imageCache) {
            if (data.image) {
                data.image.src = '';
            }
        }
        
        this.imageCache.clear();
        console.log('Image cache cleared');
    }

    /**
     * Prefetch images for better performance
     * Performance optimization: Preload likely-to-be-viewed images
     * @param {Array<string>} imagePaths - Array of image paths to prefetch
     */
    async prefetchImages(imagePaths) {
        if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
            return;
        }

        console.log(`Prefetching ${imagePaths.length} images...`);
        
        const prefetchPromises = imagePaths.map(async (imagePath) => {
            try {
                // Only prefetch if not already cached
                if (!this.imageCache.has(imagePath)) {
                    await this.loadImageFromCache(imagePath);
                }
            } catch (error) {
                console.warn(`Failed to prefetch image: ${imagePath}`, error);
            }
        });

        try {
            await Promise.allSettled(prefetchPromises);
            console.log('Image prefetching completed');
        } catch (error) {
            console.error('Image prefetching failed:', error);
        }
    }

    /**
     * Cleanup resources
     * Performance optimization: Clean up when component is destroyed
     */
    cleanup() {
        console.log('Cleaning up ContentController resources...');
        
        // Clear memory cleanup interval
        if (this.memoryCleanupInterval) {
            clearInterval(this.memoryCleanupInterval);
            this.memoryCleanupInterval = null;
        }

        // Disconnect intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }

        // Clear image cache
        this.clearImageCache();

        // Cancel any pending image loads
        if (this.imageLoadPromise) {
            this.imageLoadPromise = null;
        }

        console.log('ContentController cleanup completed');
    }
}

/**
 * Manages global UI state
 */
export class UIState {
    constructor() {
        // Initialize state properties
        this.selectedYear = null;
        this.selectedMonth = null;
        this.selectedQuestion = null;
        this.isLoading = false;
        this.isSolutionVisible = false;
        this.currentProblem = null;
        this.errorMessage = null;
        this.isPdfLoading = false;
        this.pdfError = null;
        
        // Event listeners for state changes
        this.stateChangeListeners = [];
    }

    /**
     * Add listener for state changes
     * @param {Function} listener - Callback function to call on state change
     */
    addStateChangeListener(listener) {
        this.stateChangeListeners.push(listener);
    }

    /**
     * Remove state change listener
     * @param {Function} listener - Listener to remove
     */
    removeStateChangeListener(listener) {
        const index = this.stateChangeListeners.indexOf(listener);
        if (index > -1) {
            this.stateChangeListeners.splice(index, 1);
        }
    }

    /**
     * Notify all listeners of state change
     * @param {string} property - Property that changed
     * @param {*} oldValue - Previous value
     * @param {*} newValue - New value
     */
    notifyStateChange(property, oldValue, newValue) {
        this.stateChangeListeners.forEach(listener => {
            try {
                listener(property, oldValue, newValue, this);
            } catch (error) {
                console.error('Error in state change listener:', error);
            }
        });
    }

    /**
     * Set selected year
     * @param {string|null} year - Selected year
     */
    setSelectedYear(year) {
        const oldValue = this.selectedYear;
        this.selectedYear = year;
        
        // Reset dependent selections when year changes
        if (oldValue !== year) {
            this.setSelectedMonth(null);
            this.setSelectedQuestion(null);
            this.notifyStateChange('selectedYear', oldValue, year);
        }
    }

    /**
     * Set selected month
     * @param {string|null} month - Selected month
     */
    setSelectedMonth(month) {
        const oldValue = this.selectedMonth;
        this.selectedMonth = month;
        
        // Reset dependent selections when month changes
        if (oldValue !== month) {
            this.setSelectedQuestion(null);
            this.notifyStateChange('selectedMonth', oldValue, month);
        }
    }

    /**
     * Set selected question
     * @param {string|null} question - Selected question
     */
    setSelectedQuestion(question) {
        const oldValue = this.selectedQuestion;
        this.selectedQuestion = question;
        
        if (oldValue !== question) {
            // Clear current problem and solution state when question changes
            this.setCurrentProblem(null);
            this.setSolutionVisible(false);
            this.notifyStateChange('selectedQuestion', oldValue, question);
        }
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        const oldValue = this.isLoading;
        this.isLoading = loading;
        
        if (oldValue !== loading) {
            // Clear error when starting to load
            if (loading) {
                this.setErrorMessage(null);
            }
            this.notifyStateChange('isLoading', oldValue, loading);
        }
    }

    /**
     * Set current problem
     * @param {ProblemData|null} problem - Current problem data
     */
    setCurrentProblem(problem) {
        const oldValue = this.currentProblem;
        this.currentProblem = problem;
        
        if (oldValue !== problem) {
            this.notifyStateChange('currentProblem', oldValue, problem);
        }
    }

    /**
     * Set solution visibility
     * @param {boolean} visible - Solution visibility
     */
    setSolutionVisible(visible) {
        const oldValue = this.isSolutionVisible;
        this.isSolutionVisible = visible;
        
        if (oldValue !== visible) {
            // Clear PDF error when hiding solution
            if (!visible) {
                this.setPdfError(null);
            }
            this.notifyStateChange('isSolutionVisible', oldValue, visible);
        }
    }

    /**
     * Set error message
     * @param {string|null} message - Error message
     */
    setErrorMessage(message) {
        const oldValue = this.errorMessage;
        this.errorMessage = message;
        
        if (oldValue !== message) {
            this.notifyStateChange('errorMessage', oldValue, message);
        }
    }

    /**
     * Set PDF loading state
     * @param {boolean} loading - PDF loading state
     */
    setPdfLoading(loading) {
        const oldValue = this.isPdfLoading;
        this.isPdfLoading = loading;
        
        if (oldValue !== loading) {
            // Clear PDF error when starting to load
            if (loading) {
                this.setPdfError(null);
            }
            this.notifyStateChange('isPdfLoading', oldValue, loading);
        }
    }

    /**
     * Set PDF error
     * @param {string|null} error - PDF error message
     */
    setPdfError(error) {
        const oldValue = this.pdfError;
        this.pdfError = error;
        
        if (oldValue !== error) {
            this.notifyStateChange('pdfError', oldValue, error);
        }
    }

    /**
     * Reset all selections and state
     */
    reset() {
        this.setSelectedYear(null);
        this.setSelectedMonth(null);
        this.setSelectedQuestion(null);
        this.setCurrentProblem(null);
        this.setSolutionVisible(false);
        this.setLoading(false);
        this.setErrorMessage(null);
        this.setPdfLoading(false);
        this.setPdfError(null);
    }

    /**
     * Check if all required selections are made
     * @returns {boolean} True if year, month, and question are selected
     */
    hasCompleteSelection() {
        return !!(this.selectedYear && this.selectedMonth && this.selectedQuestion);
    }

    /**
     * Get current state as plain object
     * @returns {Object} Current state
     */
    getState() {
        return {
            selectedYear: this.selectedYear,
            selectedMonth: this.selectedMonth,
            selectedQuestion: this.selectedQuestion,
            isLoading: this.isLoading,
            isSolutionVisible: this.isSolutionVisible,
            currentProblem: this.currentProblem,
            errorMessage: this.errorMessage,
            isPdfLoading: this.isPdfLoading,
            pdfError: this.pdfError,
            hasCompleteSelection: this.hasCompleteSelection()
        };
    }

    /**
     * Update UI based on state changes
     */
    updateUI() {
        // This method will be called by controllers to trigger UI updates
        // The actual UI updates are handled by the state change listeners
        this.notifyStateChange('ui', null, this.getState());
    }
}