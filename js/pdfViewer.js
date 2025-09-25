// PDF Viewer Module
// Manages PDF display and interactions using PDF.js

/**
 * Manages PDF display and interactions using PDF.js
 */
export class PDFViewer {
    constructor(container) {
        this.container = container;
        this.canvas = document.getElementById('pdf-canvas');
        this.context = this.canvas.getContext('2d');
        this.loadingElement = document.getElementById('pdf-loading');
        this.errorElement = document.getElementById('pdf-error');
        
        // PDF.js configuration
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        
        // PDF state
        this.pdfDocument = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.0;
        this.isLoading = false;
        
        // Page info elements
        this.currentPageElement = document.getElementById('pdf-current-page');
        this.totalPagesElement = document.getElementById('pdf-total-pages');
        
        // Performance optimization: PDF caching
        this.pdfCache = new Map();
        this.maxPdfCacheSize = 5; // Cache up to 5 PDFs
        this.renderedPageCache = new Map();
        this.maxPageCacheSize = 20; // Cache up to 20 rendered pages
        
        this.initializeCanvas();
        this.initializeEventListeners();
    }

    /**
     * Initialize canvas settings
     */
    initializeCanvas() {
        // Set initial canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Set canvas style for responsive design
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.height = 'auto';
    }

    /**
     * Load PDF file
     * @param {string} pdfPath - Path to PDF file
     * @returns {Promise<void>}
     */
    async loadPDF(pdfPath) {
        if (this.isLoading) {
            console.warn('PDF 로딩이 이미 진행 중입니다.');
            return;
        }

        // Validate PDF path
        if (!pdfPath || typeof pdfPath !== 'string' || pdfPath.trim().length === 0) {
            const error = new Error('유효하지 않은 PDF 파일 경로입니다.');
            this.showError(error.message);
            throw error;
        }

        console.log(`PDF 로딩 시작: ${pdfPath}`);

        try {
            this.isLoading = true;
            this.showLoadingState();
            this.hideError();

            // Performance optimization: Check if PDF is already cached
            if (this.pdfCache.has(pdfPath)) {
                const cachedPdf = this.pdfCache.get(pdfPath);
                console.log(`PDF loaded from cache: ${pdfPath}`);
                
                this.pdfDocument = cachedPdf.document;
                this.totalPages = this.pdfDocument.numPages;
                this.currentPage = 1;
                
                // Update cache access
                cachedPdf.accessCount++;
                cachedPdf.lastAccess = Date.now();
                
                this.updatePageInfo();
                await this.renderPage(this.currentPage);
                this.hideLoadingState();
                return;
            }

            // Check if PDF.js is available
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js 라이브러리를 로드할 수 없습니다. 페이지를 새로고침해주세요.');
            }

            // First, check if PDF file exists using fetch
            let response;
            try {
                response = await fetch(pdfPath, { 
                    method: 'HEAD',
                    cache: 'no-cache'
                });
            } catch (fetchError) {
                console.error('PDF 파일 존재 확인 실패:', fetchError);
                
                if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
                    throw new Error('네트워크 오류로 해설 파일을 확인할 수 없습니다. 인터넷 연결을 확인해주세요.');
                }
                
                throw new Error('해설 파일에 접근할 수 없습니다.');
            }

            // Handle HTTP errors
            if (!response.ok) {
                let errorMessage;
                
                switch (response.status) {
                    case 404:
                        errorMessage = '해설 파일이 존재하지 않습니다. 아직 해설이 준비되지 않았을 수 있습니다.';
                        break;
                    case 403:
                        errorMessage = '해설 파일에 접근할 권한이 없습니다.';
                        break;
                    case 500:
                        errorMessage = '서버 오류로 해설 파일을 불러올 수 없습니다.';
                        break;
                    case 503:
                        errorMessage = '서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
                        break;
                    default:
                        errorMessage = `해설 파일 로딩 오류 (${response.status}): ${response.statusText}`;
                }
                
                throw new Error(errorMessage);
            }

            // Check content type
            const contentType = response.headers.get('content-type');
            if (contentType && !contentType.includes('application/pdf')) {
                console.warn(`예상치 못한 Content-Type: ${contentType}`);
                // Continue anyway, as some servers might not set correct content-type
            }

            // Load PDF document with timeout
            let loadingTask;
            try {
                loadingTask = pdfjsLib.getDocument({
                    url: pdfPath,
                    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
                    cMapPacked: true,
                    enableXfa: true
                });

                // Set up timeout for PDF loading (15 seconds)
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => {
                        if (loadingTask) {
                            loadingTask.destroy();
                        }
                        reject(new Error('PDF 로딩 시간이 초과되었습니다. 파일이 너무 크거나 네트워크가 느릴 수 있습니다.'));
                    }, 15000);
                });

                // Race between PDF loading and timeout
                this.pdfDocument = await Promise.race([
                    loadingTask.promise,
                    timeoutPromise
                ]);

            } catch (pdfError) {
                console.error('PDF.js 로딩 오류:', pdfError);
                
                // Handle specific PDF.js errors
                if (pdfError.name === 'InvalidPDFException') {
                    throw new Error('PDF 파일이 손상되었거나 유효하지 않습니다.');
                } else if (pdfError.name === 'MissingPDFException') {
                    throw new Error('PDF 파일을 찾을 수 없습니다.');
                } else if (pdfError.name === 'UnexpectedResponseException') {
                    throw new Error('PDF 파일 응답이 올바르지 않습니다. 파일이 손상되었을 수 있습니다.');
                } else if (pdfError.message && pdfError.message.includes('timeout')) {
                    throw new Error('PDF 로딩 시간이 초과되었습니다.');
                } else {
                    throw new Error(`PDF 로딩 실패: ${pdfError.message || '알 수 없는 오류'}`);
                }
            }

            // Validate PDF document
            if (!this.pdfDocument) {
                throw new Error('PDF 문서를 로드할 수 없습니다.');
            }

            // Set total pages
            this.totalPages = this.pdfDocument.numPages;
            
            if (this.totalPages === 0) {
                throw new Error('PDF 파일에 페이지가 없습니다.');
            }
            
            this.currentPage = 1;
            
            console.log(`PDF 로딩 완료. 총 ${this.totalPages}페이지`);
            
            // Performance optimization: Cache the loaded PDF
            this.cachePDF(pdfPath, this.pdfDocument);
            
            // Update page info
            this.updatePageInfo();
            
            // Render first page
            await this.renderPage(this.currentPage);
            
            this.hideLoadingState();
            console.log('PDF 렌더링 완료');
            
        } catch (error) {
            console.error('PDF 로딩 오류:', error);
            this.hideLoadingState();
            
            // Enhanced error message
            let errorMessage = error.message;
            
            // If it's a generic error, provide more helpful message
            if (!errorMessage || errorMessage === 'PDF 로딩 실패') {
                errorMessage = '해설 파일을 불러올 수 없습니다. 파일이 존재하는지 확인해주세요.';
            }
            
            this.showError(errorMessage);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Render specific page
     * @param {number} pageNumber - Page number to render
     * @returns {Promise<void>}
     */
    async renderPage(pageNumber) {
        if (!this.pdfDocument || pageNumber < 1 || pageNumber > this.totalPages) {
            return;
        }

        try {
            // Performance optimization: Check for cached rendered page
            const cacheKey = `${this.pdfDocument._pdfInfo?.fingerprint || 'unknown'}_${pageNumber}_${this.scale}`;
            const cachedPage = this.getCachedRenderedPage(cacheKey);
            
            if (cachedPage) {
                // Use cached rendered page
                this.canvas.width = cachedPage.width;
                this.canvas.height = cachedPage.height;
                this.context.putImageData(cachedPage, 0, 0);
                console.log(`Page rendered from cache: ${pageNumber}`);
            } else {
                // Render page and cache it
                const page = await this.pdfDocument.getPage(pageNumber);
                
                // Calculate viewport
                const viewport = page.getViewport({ scale: this.scale });
                
                // Set canvas dimensions
                this.canvas.width = viewport.width;
                this.canvas.height = viewport.height;
                
                // Render page
                const renderContext = {
                    canvasContext: this.context,
                    viewport: viewport
                };
                
                await page.render(renderContext).promise;
                
                // Cache the rendered page
                const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
                this.cacheRenderedPage(cacheKey, imageData);
                
                console.log(`Page rendered and cached: ${pageNumber}`);
            }
            
            // Update current page
            this.currentPage = pageNumber;
            this.updatePageInfo();
            this.updateNavigationButtons();
            
        } catch (error) {
            console.error('페이지 렌더링 오류:', error);
            this.showError('페이지를 렌더링할 수 없습니다.');
        }
    }

    /**
     * Update page information display
     */
    updatePageInfo() {
        if (this.currentPageElement && this.totalPagesElement) {
            this.currentPageElement.textContent = this.currentPage;
            this.totalPagesElement.textContent = this.totalPages;
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        if (this.loadingElement) {
            this.loadingElement.classList.remove('hidden');
        }
    }

    /**
     * Hide loading state
     */
    hideLoadingState() {
        if (this.loadingElement) {
            this.loadingElement.classList.add('hidden');
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        if (this.errorElement) {
            const errorText = this.errorElement.querySelector('.error-message__text');
            if (errorText) {
                errorText.textContent = message;
            }
            this.errorElement.classList.remove('hidden');
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        if (this.errorElement) {
            this.errorElement.classList.add('hidden');
        }
    }

    /**
     * Show PDF viewer with slide animation
     */
    showPDF() {
        if (this.container) {
            // Remove hidden class to make element visible
            this.container.classList.remove('hidden');
            
            // Force reflow to ensure the element is rendered
            this.container.offsetHeight;
            
            // Add slide-in animation class
            this.container.classList.add('pdf-section--visible');
            
            // Scroll to PDF section smoothly
            setTimeout(() => {
                this.container.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 100);
        }
    }

    /**
     * Hide PDF viewer with slide animation
     */
    hidePDF() {
        if (this.container) {
            // Remove slide-in animation class
            this.container.classList.remove('pdf-section--visible');
            
            // Wait for animation to complete, then hide
            setTimeout(() => {
                this.container.classList.add('hidden');
                
                // Clear PDF document to free memory
                if (this.pdfDocument) {
                    this.pdfDocument.destroy();
                    this.pdfDocument = null;
                }
                
                // Clear canvas
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Reset state
                this.currentPage = 1;
                this.totalPages = 0;
                this.scale = 1.0;
                this.updatePageInfo();
                
            }, 300); // Match CSS transition duration
        }
    }

    /**
     * Toggle PDF visibility
     * @returns {boolean} - True if PDF is now visible, false if hidden
     */
    togglePDF() {
        if (this.container) {
            const isVisible = !this.container.classList.contains('hidden');
            
            if (isVisible) {
                this.hidePDF();
                return false;
            } else {
                this.showPDF();
                return true;
            }
        }
        return false;
    }

    /**
     * Check if PDF viewer is currently visible
     * @returns {boolean}
     */
    isVisible() {
        return this.container && !this.container.classList.contains('hidden');
    }

    /**
     * Navigate to next page
     */
    async nextPage() {
        if (!this.pdfDocument || this.currentPage >= this.totalPages) {
            return;
        }
        
        await this.renderPage(this.currentPage + 1);
    }

    /**
     * Navigate to previous page
     */
    async previousPage() {
        if (!this.pdfDocument || this.currentPage <= 1) {
            return;
        }
        
        await this.renderPage(this.currentPage - 1);
    }

    /**
     * Go to specific page
     * @param {number} pageNumber - Page number to navigate to
     */
    async goToPage(pageNumber) {
        if (!this.pdfDocument || pageNumber < 1 || pageNumber > this.totalPages) {
            return;
        }
        
        await this.renderPage(pageNumber);
    }

    /**
     * Zoom in (increase scale)
     */
    async zoomIn() {
        if (!this.pdfDocument) {
            return;
        }
        
        const newScale = Math.min(this.scale * 1.25, 3.0); // Max zoom 3x
        await this.setZoom(newScale);
    }

    /**
     * Zoom out (decrease scale)
     */
    async zoomOut() {
        if (!this.pdfDocument) {
            return;
        }
        
        const newScale = Math.max(this.scale * 0.8, 0.5); // Min zoom 0.5x
        await this.setZoom(newScale);
    }

    /**
     * Set specific zoom level
     * @param {number} scale - Zoom scale (0.5 to 3.0)
     */
    async setZoom(scale) {
        if (!this.pdfDocument || scale < 0.5 || scale > 3.0) {
            return;
        }
        
        this.scale = scale;
        await this.renderPage(this.currentPage);
    }

    /**
     * Reset zoom to fit width
     */
    async resetZoom() {
        if (!this.pdfDocument) {
            return;
        }
        
        // Calculate scale to fit container width
        const page = await this.pdfDocument.getPage(this.currentPage);
        const viewport = page.getViewport({ scale: 1.0 });
        const containerWidth = this.canvas.parentElement.clientWidth - 48; // Account for padding
        const fitScale = Math.min(containerWidth / viewport.width, 2.0); // Max 2x for readability
        
        await this.setZoom(fitScale);
    }

    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!this.container) {
            return;
        }

        if (!document.fullscreenElement) {
            // Enter fullscreen
            if (this.container.requestFullscreen) {
                this.container.requestFullscreen();
            } else if (this.container.webkitRequestFullscreen) {
                this.container.webkitRequestFullscreen();
            } else if (this.container.msRequestFullscreen) {
                this.container.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    /**
     * Get current zoom percentage
     * @returns {number} - Zoom percentage (100 = 100%)
     */
    getZoomPercentage() {
        return Math.round(this.scale * 100);
    }

    /**
     * Check if navigation is available
     * @returns {object} - Navigation availability status
     */
    getNavigationStatus() {
        return {
            canGoNext: this.pdfDocument && this.currentPage < this.totalPages,
            canGoPrevious: this.pdfDocument && this.currentPage > 1,
            canZoomIn: this.pdfDocument && this.scale < 3.0,
            canZoomOut: this.pdfDocument && this.scale > 0.5,
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            zoomPercentage: this.getZoomPercentage()
        };
    }

    /**
     * Initialize event listeners for PDF controls
     */
    initializeEventListeners() {
        // Previous page button
        const prevButton = document.getElementById('pdf-prev');
        if (prevButton) {
            prevButton.addEventListener('click', () => this.previousPage());
        }

        // Next page button
        const nextButton = document.getElementById('pdf-next');
        if (nextButton) {
            nextButton.addEventListener('click', () => this.nextPage());
        }

        // Zoom in button
        const zoomInButton = document.getElementById('pdf-zoom-in');
        if (zoomInButton) {
            zoomInButton.addEventListener('click', () => this.zoomIn());
        }

        // Zoom out button
        const zoomOutButton = document.getElementById('pdf-zoom-out');
        if (zoomOutButton) {
            zoomOutButton.addEventListener('click', () => this.zoomOut());
        }

        // Close button
        const closeButton = document.getElementById('pdf-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.hidePDF());
        }

        // Keyboard navigation
        document.addEventListener('keydown', (event) => {
            if (!this.isVisible()) return;

            switch (event.key) {
                case 'ArrowLeft':
                case 'PageUp':
                    event.preventDefault();
                    this.previousPage();
                    break;
                case 'ArrowRight':
                case 'PageDown':
                    event.preventDefault();
                    this.nextPage();
                    break;
                case 'Home':
                    event.preventDefault();
                    this.goToPage(1);
                    break;
                case 'End':
                    event.preventDefault();
                    this.goToPage(this.totalPages);
                    break;
                case '+':
                case '=':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.zoomIn();
                    }
                    break;
                case '-':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.zoomOut();
                    }
                    break;
                case '0':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        this.resetZoom();
                    }
                    break;
                case 'Escape':
                    event.preventDefault();
                    this.hidePDF();
                    break;
                case 'F11':
                    event.preventDefault();
                    this.toggleFullscreen();
                    break;
            }
        });

        // Update button states when navigation status changes
        this.updateNavigationButtons();
    }

    /**
     * Update navigation button states based on current status
     */
    updateNavigationButtons() {
        const status = this.getNavigationStatus();

        // Update previous button
        const prevButton = document.getElementById('pdf-prev');
        if (prevButton) {
            prevButton.disabled = !status.canGoPrevious;
        }

        // Update next button
        const nextButton = document.getElementById('pdf-next');
        if (nextButton) {
            nextButton.disabled = !status.canGoNext;
        }

        // Update zoom buttons
        const zoomInButton = document.getElementById('pdf-zoom-in');
        if (zoomInButton) {
            zoomInButton.disabled = !status.canZoomIn;
        }

        const zoomOutButton = document.getElementById('pdf-zoom-out');
        if (zoomOutButton) {
            zoomOutButton.disabled = !status.canZoomOut;
        }
    }

    /**
     * Cache PDF document for performance optimization
     * @param {string} pdfPath - Path to PDF file
     * @param {Object} pdfDocument - PDF.js document object
     */
    cachePDF(pdfPath, pdfDocument) {
        // Manage cache size
        if (this.pdfCache.size >= this.maxPdfCacheSize) {
            // Remove least recently used PDF
            let oldestPath = null;
            let oldestTime = Date.now();
            
            for (const [path, data] of this.pdfCache) {
                if (data.lastAccess < oldestTime) {
                    oldestTime = data.lastAccess;
                    oldestPath = path;
                }
            }
            
            if (oldestPath) {
                const removedData = this.pdfCache.get(oldestPath);
                if (removedData && removedData.document) {
                    removedData.document.destroy();
                }
                this.pdfCache.delete(oldestPath);
                console.log(`PDF cache full, removed: ${oldestPath}`);
            }
        }

        // Add to cache
        this.pdfCache.set(pdfPath, {
            document: pdfDocument,
            loadTime: Date.now(),
            lastAccess: Date.now(),
            accessCount: 1,
            totalPages: pdfDocument.numPages
        });

        console.log(`PDF cached: ${pdfPath} (cache size: ${this.pdfCache.size})`);
    }

    /**
     * Cache rendered page for performance optimization
     * @param {string} cacheKey - Cache key (pdfPath + page + scale)
     * @param {ImageData} imageData - Rendered page image data
     */
    cacheRenderedPage(cacheKey, imageData) {
        // Manage page cache size
        if (this.renderedPageCache.size >= this.maxPageCacheSize) {
            // Remove oldest cached page
            const firstKey = this.renderedPageCache.keys().next().value;
            this.renderedPageCache.delete(firstKey);
        }

        this.renderedPageCache.set(cacheKey, {
            imageData: imageData,
            timestamp: Date.now()
        });
    }

    /**
     * Get cached rendered page
     * @param {string} cacheKey - Cache key (pdfPath + page + scale)
     * @returns {ImageData|null} Cached image data or null
     */
    getCachedRenderedPage(cacheKey) {
        const cached = this.renderedPageCache.get(cacheKey);
        if (cached) {
            // Check if cache is still valid (5 minutes)
            const maxAge = 5 * 60 * 1000;
            if (Date.now() - cached.timestamp < maxAge) {
                return cached.imageData;
            } else {
                // Remove expired cache
                this.renderedPageCache.delete(cacheKey);
            }
        }
        return null;
    }

    /**
     * Get PDF cache statistics
     * @returns {Object} Cache statistics
     */
    getPdfCacheStats() {
        let totalPages = 0;
        let totalAccessCount = 0;
        
        for (const [path, data] of this.pdfCache) {
            totalPages += data.totalPages || 0;
            totalAccessCount += data.accessCount || 0;
        }

        return {
            pdfCacheSize: this.pdfCache.size,
            maxPdfCacheSize: this.maxPdfCacheSize,
            pageCacheSize: this.renderedPageCache.size,
            maxPageCacheSize: this.maxPageCacheSize,
            totalCachedPages: totalPages,
            averageAccessCount: this.pdfCache.size > 0 ? totalAccessCount / this.pdfCache.size : 0,
            cachedPdfs: Array.from(this.pdfCache.keys())
        };
    }

    /**
     * Clear PDF cache
     * Performance optimization: Manual cache clearing
     */
    clearPdfCache() {
        console.log(`Clearing PDF cache (${this.pdfCache.size} PDFs, ${this.renderedPageCache.size} pages)`);
        
        // Clean up PDF documents
        for (const [path, data] of this.pdfCache) {
            if (data.document) {
                data.document.destroy();
            }
        }
        
        this.pdfCache.clear();
        this.renderedPageCache.clear();
        console.log('PDF cache cleared');
    }

    /**
     * Perform PDF memory cleanup
     * Performance optimization: Clean up old cached PDFs and pages
     */
    performPdfMemoryCleanup() {
        console.log('Performing PDF memory cleanup...');
        
        const beforeStats = this.getPdfCacheStats();
        let cleanedPdfs = 0;
        let cleanedPages = 0;

        // Clean up old PDFs (older than 15 minutes and accessed less than 2 times)
        const now = Date.now();
        const maxAge = 15 * 60 * 1000; // 15 minutes
        const minAccessCount = 2;

        for (const [path, data] of this.pdfCache) {
            const age = now - data.lastAccess;
            if (age > maxAge && data.accessCount < minAccessCount) {
                if (data.document) {
                    data.document.destroy();
                }
                this.pdfCache.delete(path);
                cleanedPdfs++;
            }
        }

        // Clean up old rendered pages (older than 5 minutes)
        const pageMaxAge = 5 * 60 * 1000; // 5 minutes
        for (const [key, data] of this.renderedPageCache) {
            const age = now - data.timestamp;
            if (age > pageMaxAge) {
                this.renderedPageCache.delete(key);
                cleanedPages++;
            }
        }

        const afterStats = this.getPdfCacheStats();
        console.log(`PDF memory cleanup completed: removed ${cleanedPdfs} PDFs and ${cleanedPages} pages, ` +
                   `PDF cache: ${beforeStats.pdfCacheSize} → ${afterStats.pdfCacheSize}, ` +
                   `page cache: ${beforeStats.pageCacheSize} → ${afterStats.pageCacheSize}`);
    }
}