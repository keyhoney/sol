// Data Manager Module
// This file will be implemented in tasks 3.1, 3.2, and 3.3

/**
 * Manages CSV data loading and problem data operations
 */
export class DataManager {
    constructor() {
        this.csvData = [];
        this.isDataLoaded = false;
    }

    /**
     * Load and parse CSV data
     * @param {string} csvPath - Path to CSV file
     * @returns {Promise<Array>} Parsed CSV data
     */
    async loadCSVData(csvPath) {
        try {
            console.log(`CSV 파일 로딩 시작: ${csvPath}`);
            
            // Validate CSV path
            if (!csvPath || typeof csvPath !== 'string') {
                throw new Error('유효하지 않은 CSV 파일 경로입니다.');
            }
            
            // Fetch CSV file with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            let response;
            try {
                response = await fetch(csvPath, { 
                    signal: controller.signal,
                    cache: 'no-cache' // Ensure fresh data
                });
                clearTimeout(timeoutId);
            } catch (fetchError) {
                clearTimeout(timeoutId);
                
                if (fetchError.name === 'AbortError') {
                    throw new Error('CSV 파일 로딩 시간이 초과되었습니다. 네트워크 연결을 확인해주세요.');
                }
                
                // Handle network errors
                if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
                    throw new Error('네트워크 오류로 CSV 파일을 불러올 수 없습니다. 인터넷 연결을 확인해주세요.');
                }
                
                throw new Error(`CSV 파일 요청 실패: ${fetchError.message}`);
            }
            
            // Handle HTTP errors
            if (!response.ok) {
                let errorMessage = `CSV 파일을 불러올 수 없습니다 (${response.status})`;
                
                switch (response.status) {
                    case 404:
                        errorMessage = `CSV 파일을 찾을 수 없습니다. 파일 경로를 확인해주세요: ${csvPath}`;
                        break;
                    case 403:
                        errorMessage = 'CSV 파일에 접근할 권한이 없습니다.';
                        break;
                    case 500:
                        errorMessage = '서버 오류로 CSV 파일을 불러올 수 없습니다.';
                        break;
                    case 503:
                        errorMessage = '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
                        break;
                    default:
                        errorMessage = `HTTP 오류 ${response.status}: ${response.statusText}`;
                }
                
                throw new Error(errorMessage);
            }
            
            // Check content type
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('text/') && !contentType.includes('application/')) {
                console.warn(`예상치 못한 Content-Type: ${contentType}`);
            }
            
            // Get CSV text content
            let csvText;
            try {
                csvText = await response.text();
            } catch (textError) {
                throw new Error(`CSV 파일 내용을 읽을 수 없습니다: ${textError.message}`);
            }
            
            // Validate CSV content
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('CSV 파일이 비어있습니다.');
            }
            
            console.log(`CSV 파일 로딩 완료. 크기: ${csvText.length} bytes`);
            
            // Parse CSV using Papa Parse
            return new Promise((resolve, reject) => {
                try {
                    Papa.parse(csvText, {
                        header: false, // We'll handle headers manually since we know the structure
                        skipEmptyLines: true,
                        delimiter: ',', // Explicitly set delimiter
                        complete: (results) => {
                            try {
                                // Check for parsing errors
                                if (results.errors && results.errors.length > 0) {
                                    const criticalErrors = results.errors.filter(error => 
                                        error.type === 'Delimiter' || error.type === 'Quotes'
                                    );
                                    
                                    if (criticalErrors.length > 0) {
                                        console.error('CSV 파싱 오류:', criticalErrors);
                                        reject(new Error(`CSV 파일 형식이 올바르지 않습니다: ${criticalErrors[0].message}`));
                                        return;
                                    }
                                    
                                    console.warn('CSV 파싱 경고:', results.errors);
                                }
                                
                                // Validate parsed data
                                if (!results.data || !Array.isArray(results.data)) {
                                    reject(new Error('CSV 파싱 결과가 올바르지 않습니다.'));
                                    return;
                                }
                                
                                console.log(`CSV 파싱 완료. 총 ${results.data.length}개 행 발견`);
                                
                                // Filter out any rows that don't have at least 3 columns (year, month, question)
                                const validData = results.data.filter((row, index) => {
                                    if (!row || !Array.isArray(row) || row.length < 3) {
                                        console.warn(`행 ${index + 1}: 필수 컬럼이 부족합니다 (최소 3개 필요)`);
                                        return false;
                                    }
                                    
                                    const [year, month, question] = row;
                                    
                                    // Check if all required fields exist and are not empty
                                    if (!year || !month || !question) {
                                        console.warn(`행 ${index + 1}: 빈 값이 있습니다 (학년도: ${year}, 시행월: ${month}, 문항번호: ${question})`);
                                        return false;
                                    }
                                    
                                    // Ensure they are valid numbers
                                    const yearNum = parseInt(year.toString().trim());
                                    const monthNum = parseInt(month.toString().trim());
                                    const questionNum = parseInt(question.toString().trim());
                                    
                                    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(questionNum)) {
                                        // Check if this might be a header row
                                        if (index === 0 && (
                                            year.toString().includes('학년도') || 
                                            month.toString().includes('시행월') || 
                                            question.toString().includes('문항번호')
                                        )) {
                                            console.log(`행 ${index + 1}: 헤더 행을 건너뜁니다 (${year}, ${month}, ${question})`);
                                        } else {
                                            console.warn(`행 ${index + 1}: 숫자가 아닌 값이 있습니다 (학년도: ${year}, 시행월: ${month}, 문항번호: ${question})`);
                                        }
                                        return false;
                                    }
                                    
                                    // Validate ranges
                                    if (yearNum < 2000 || yearNum > 2100) {
                                        console.warn(`행 ${index + 1}: 학년도가 유효하지 않습니다: ${yearNum}`);
                                        return false;
                                    }
                                    
                                    if (monthNum < 1 || monthNum > 12) {
                                        console.warn(`행 ${index + 1}: 시행월이 유효하지 않습니다: ${monthNum}`);
                                        return false;
                                    }
                                    
                                    if (questionNum < 1 || questionNum > 999) {
                                        console.warn(`행 ${index + 1}: 문항번호가 유효하지 않습니다: ${questionNum}`);
                                        return false;
                                    }
                                    
                                    return true;
                                });
                                
                                if (validData.length === 0) {
                                    reject(new Error('CSV 파일에 유효한 데이터가 없습니다. 학년도, 시행월, 문항번호가 모두 올바르게 포함된 행이 필요합니다.'));
                                    return;
                                }
                                
                                console.log(`유효한 데이터: ${validData.length}개 행`);
                                
                                // Store the parsed data
                                this.csvData = validData.map(row => ({
                                    year: row[0].toString().trim(),
                                    month: row[1].toString().trim(),
                                    questionNumber: row[2].toString().trim()
                                }));
                                
                                this.isDataLoaded = true;
                                console.log('CSV 데이터 로딩 및 파싱 완료');
                                resolve(this.csvData);
                                
                            } catch (processingError) {
                                reject(new Error(`CSV 데이터 처리 오류: ${processingError.message}`));
                            }
                        },
                        error: (error) => {
                            console.error('Papa Parse 오류:', error);
                            reject(new Error(`CSV 파싱 라이브러리 오류: ${error.message || '알 수 없는 오류'}`));
                        }
                    });
                } catch (parseError) {
                    reject(new Error(`CSV 파싱 초기화 오류: ${parseError.message}`));
                }
            });
            
        } catch (error) {
            this.isDataLoaded = false;
            console.error('CSV 데이터 로딩 실패:', error);
            
            // Re-throw with enhanced error message
            if (error.message.includes('CSV')) {
                throw error; // Already has CSV-specific message
            } else {
                throw new Error(`CSV 데이터 로딩 실패: ${error.message}`);
            }
        }
    }

    /**
     * Get available years from data
     * @returns {Array<string>} Array of years sorted in descending order
     */
    getAvailableYears() {
        if (!this.isDataLoaded || this.csvData.length === 0) {
            return [];
        }
        
        // Extract unique years and sort in descending order (newest first)
        const years = [...new Set(this.csvData.map(item => item.year))];
        return years.sort((a, b) => parseInt(b) - parseInt(a));
    }

    /**
     * Get months for specific year
     * @param {string} year - Selected year
     * @returns {Array<string>} Array of months sorted in ascending order
     */
    getMonthsForYear(year) {
        if (!this.isDataLoaded || this.csvData.length === 0 || !year) {
            return [];
        }
        
        // Filter data by year and extract unique months
        const monthsForYear = this.csvData
            .filter(item => item.year === year.toString())
            .map(item => item.month);
        
        // Remove duplicates and sort in ascending order
        const uniqueMonths = [...new Set(monthsForYear)];
        return uniqueMonths.sort((a, b) => parseInt(a) - parseInt(b));
    }

    /**
     * Get questions for specific year and month
     * @param {string} year - Selected year
     * @param {string} month - Selected month
     * @returns {Array<string>} Array of question numbers sorted in ascending order
     */
    getQuestionsForYearMonth(year, month) {
        if (!this.isDataLoaded || this.csvData.length === 0 || !year || !month) {
            return [];
        }
        
        // Filter data by year and month, then extract unique question numbers
        const questionsForYearMonth = this.csvData
            .filter(item => 
                item.year === year.toString() && 
                item.month === month.toString()
            )
            .map(item => item.questionNumber);
        
        // Remove duplicates and sort in ascending order
        const uniqueQuestions = [...new Set(questionsForYearMonth)];
        return uniqueQuestions.sort((a, b) => parseInt(a) - parseInt(b));
    }

    /**
     * Get all problem data for specific filters
     * @param {string} year - Selected year (optional)
     * @param {string} month - Selected month (optional)
     * @param {string} questionNumber - Selected question number (optional)
     * @returns {Array<Object>} Array of filtered problem data
     */
    getFilteredData(year = null, month = null, questionNumber = null) {
        if (!this.isDataLoaded || this.csvData.length === 0) {
            return [];
        }
        
        return this.csvData.filter(item => {
            if (year && item.year !== year.toString()) return false;
            if (month && item.month !== month.toString()) return false;
            if (questionNumber && item.questionNumber !== questionNumber.toString()) return false;
            return true;
        });
    }

    /**
     * Create ProblemData instance from year, month, and question number
     * @param {string} year - Year
     * @param {string} month - Month
     * @param {string} questionNumber - Question number
     * @returns {ProblemData} ProblemData instance
     */
    createProblemData(year, month, questionNumber) {
        return new ProblemData(year, month, questionNumber);
    }

    /**
     * Check if a specific problem exists in the data
     * @param {string} year - Year
     * @param {string} month - Month
     * @param {string} questionNumber - Question number
     * @returns {boolean} True if problem exists
     */
    problemExists(year, month, questionNumber) {
        if (!this.isDataLoaded || this.csvData.length === 0) {
            return false;
        }
        
        return this.csvData.some(item => 
            item.year === year.toString() && 
            item.month === month.toString() && 
            item.questionNumber === questionNumber.toString()
        );
    }

    /**
     * Get total count of problems
     * @returns {number} Total number of problems
     */
    getTotalProblemsCount() {
        return this.isDataLoaded ? this.csvData.length : 0;
    }

    /**
     * Get statistics about the data
     * @returns {Object} Statistics object
     */
    getDataStatistics() {
        if (!this.isDataLoaded || this.csvData.length === 0) {
            return {
                totalProblems: 0,
                totalYears: 0,
                totalMonths: 0,
                yearRange: null
            };
        }
        
        const years = this.getAvailableYears();
        const allMonths = [...new Set(this.csvData.map(item => item.month))];
        
        return {
            totalProblems: this.csvData.length,
            totalYears: years.length,
            totalMonths: allMonths.length,
            yearRange: years.length > 0 ? {
                earliest: years[years.length - 1],
                latest: years[0]
            } : null
        };
    }

    /**
     * Retry loading CSV data
     * @param {string} csvPath - Path to CSV file
     * @returns {Promise<Array>} Parsed CSV data
     */
    async retryLoadCSVData(csvPath) {
        console.log('CSV 데이터 재시도 중...');
        
        // Reset state
        this.csvData = [];
        this.isDataLoaded = false;
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return await this.loadCSVData(csvPath);
    }

    /**
     * Validate CSV file format
     * @param {string} csvPath - Path to CSV file
     * @returns {Promise<boolean>} True if CSV format is valid
     */
    async validateCSVFormat(csvPath) {
        try {
            const response = await fetch(csvPath, { method: 'HEAD' });
            
            if (!response.ok) {
                return false;
            }

            const contentType = response.headers.get('content-type');
            return !contentType || contentType.includes('text/') || contentType.includes('application/');
            
        } catch (error) {
            console.error('CSV 형식 검증 실패:', error);
            return false;
        }
    }

    /**
     * Get error recovery suggestions
     * @param {Error} error - The error that occurred
     * @returns {Array<string>} Array of recovery suggestions
     */
    getErrorRecoverySuggestions(error) {
        const suggestions = [];
        const errorMessage = error.message.toLowerCase();

        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            suggestions.push('CSV 파일 경로가 올바른지 확인해주세요.');
            suggestions.push('mun/mun.csv 파일이 존재하는지 확인해주세요.');
        }

        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            suggestions.push('인터넷 연결을 확인해주세요.');
            suggestions.push('잠시 후 다시 시도해주세요.');
        }

        if (errorMessage.includes('timeout')) {
            suggestions.push('네트워크 연결이 느릴 수 있습니다. 다시 시도해주세요.');
        }

        if (errorMessage.includes('parsing') || errorMessage.includes('format')) {
            suggestions.push('CSV 파일 형식을 확인해주세요.');
            suggestions.push('파일이 UTF-8 인코딩으로 저장되었는지 확인해주세요.');
        }

        if (errorMessage.includes('empty') || errorMessage.includes('no data')) {
            suggestions.push('CSV 파일에 데이터가 있는지 확인해주세요.');
            suggestions.push('학년도, 시행월, 문항번호 컬럼이 모두 포함되어 있는지 확인해주세요.');
        }

        if (suggestions.length === 0) {
            suggestions.push('페이지를 새로고침하고 다시 시도해주세요.');
            suggestions.push('문제가 계속되면 관리자에게 문의해주세요.');
        }

        return suggestions;
    }
}

/**
 * Problem Data Model
 */
export class ProblemData {
    constructor(year, month, questionNumber) {
        this.year = year.toString();
        this.month = month.toString();
        this.questionNumber = questionNumber.toString();
        
        // Validate input data
        if (!this.year || !this.month || !this.questionNumber) {
            throw new Error('학년도, 시행월, 문항번호는 모두 필수입니다.');
        }
        
        // Validate that they are numeric
        if (isNaN(this.year) || isNaN(this.month) || isNaN(this.questionNumber)) {
            throw new Error('학년도, 시행월, 문항번호는 모두 숫자여야 합니다.');
        }
    }

    /**
     * Get image file path for problem
     * Format: mun/{year}{month}{questionNumber}.png
     * Example: mun/20220601.png (year: 2022, month: 06, question: 01)
     * @returns {string} Image file path
     */
    getImagePath() {
        const paddedMonth = this.month.padStart(2, '0');
        const paddedQuestion = this.questionNumber.padStart(2, '0');
        return `mun/${this.year}${paddedMonth}${paddedQuestion}.png`;
    }

    /**
     * Get PDF file path for solution
     * Format: sol/{year}{month}{questionNumber}.pdf
     * Example: sol/20220601.pdf (year: 2022, month: 06, question: 01)
     * @returns {string} PDF file path
     */
    getPDFPath() {
        const paddedMonth = this.month.padStart(2, '0');
        const paddedQuestion = this.questionNumber.padStart(2, '0');
        return `sol/${this.year}${paddedMonth}${paddedQuestion}.pdf`;
    }

    /**
     * Get a string representation of the problem
     * @returns {string} Problem identifier
     */
    toString() {
        return `${this.year}년 ${this.month}월 ${this.questionNumber}번`;
    }

    /**
     * Check if this problem data equals another problem data
     * @param {ProblemData} other - Another ProblemData instance
     * @returns {boolean} True if equal
     */
    equals(other) {
        if (!(other instanceof ProblemData)) {
            return false;
        }
        return this.year === other.year && 
               this.month === other.month && 
               this.questionNumber === other.questionNumber;
    }
}