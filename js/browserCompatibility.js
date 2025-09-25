// Browser Compatibility Module
// Handles cross-browser compatibility and feature detection

/**
 * Browser Compatibility Manager
 * Detects browser features and provides polyfills/fallbacks
 */
export class BrowserCompatibility {
    constructor() {
        this.browserInfo = this.detectBrowser();
        this.supportedFeatures = this.detectFeatures();
        this.initializePolyfills();
        
        console.log('Browser Compatibility initialized:', this.browserInfo);
    }

    /**
     * Detect browser type and version
     * @returns {Object} Browser information
     */
    detectBrowser() {
        const userAgent = navigator.userAgent;
        const browserInfo = {
            name: 'Unknown',
            version: 'Unknown',
            engine: 'Unknown',
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
            isTablet: /iPad|Android(?!.*Mobile)/i.test(userAgent)
        };

        // Chrome
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browserInfo.name = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+)/);
            browserInfo.version = match ? match[1] : 'Unknown';
            browserInfo.engine = 'Blink';
        }
        // Edge (Chromium-based)
        else if (userAgent.includes('Edg')) {
            browserInfo.name = 'Edge';
            const match = userAgent.match(/Edg\/(\d+)/);
            browserInfo.version = match ? match[1] : 'Unknown';
            browserInfo.engine = 'Blink';
        }
        // Firefox
        else if (userAgent.includes('Firefox')) {
            browserInfo.name = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+)/);
            browserInfo.version = match ? match[1] : 'Unknown';
            browserInfo.engine = 'Gecko';
        }
        // Safari
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browserInfo.name = 'Safari';
            const match = userAgent.match(/Version\/(\d+)/);
            browserInfo.version = match ? match[1] : 'Unknown';
            browserInfo.engine = 'WebKit';
        }
        // Internet Explorer
        else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
            browserInfo.name = 'Internet Explorer';
            const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
            browserInfo.version = match ? match[1] : 'Unknown';
            browserInfo.engine = 'Trident';
        }

        return browserInfo;
    }

    /**
     * Detect supported browser features
     * @returns {Object} Feature support information
     */
    detectFeatures() {
        const features = {
            // ES6+ Features
            es6: {
                arrow: this.testFeature(() => eval('(() => true)()')),
                const: this.testFeature(() => eval('const x = 1; true')),
                let: this.testFeature(() => eval('let x = 1; true')),
                templateLiterals: this.testFeature(() => eval('`test` === "test"')),
                destructuring: this.testFeature(() => eval('const [a] = [1]; a === 1')),
                classes: this.testFeature(() => eval('class Test {}; true')),
                modules: typeof module !== 'undefined' || 'import' in window,
                promises: typeof Promise !== 'undefined',
                asyncAwait: this.testFeature(() => eval('(async () => true)'))
            },

            // DOM Features
            dom: {
                querySelector: typeof document.querySelector === 'function',
                addEventListener: typeof document.addEventListener === 'function',
                classList: 'classList' in document.createElement('div'),
                dataset: 'dataset' in document.createElement('div'),
                customElements: 'customElements' in window,
                shadowDOM: 'attachShadow' in Element.prototype
            },

            // CSS Features
            css: {
                flexbox: this.testCSSFeature('display', 'flex'),
                grid: this.testCSSFeature('display', 'grid'),
                variables: this.testCSSFeature('--test', 'value'),
                transforms: this.testCSSFeature('transform', 'translateX(1px)'),
                transitions: this.testCSSFeature('transition', 'all 1s'),
                animations: this.testCSSFeature('animation', 'test 1s')
            },

            // API Features
            apis: {
                fetch: typeof fetch === 'function',
                intersectionObserver: 'IntersectionObserver' in window,
                mutationObserver: 'MutationObserver' in window,
                resizeObserver: 'ResizeObserver' in window,
                webWorkers: typeof Worker !== 'undefined',
                serviceWorker: 'serviceWorker' in navigator,
                localStorage: this.testLocalStorage(),
                sessionStorage: this.testSessionStorage(),
                indexedDB: 'indexedDB' in window,
                webGL: this.testWebGL(),
                canvas: this.testCanvas(),
                fileAPI: 'File' in window && 'FileReader' in window,
                dragDrop: 'draggable' in document.createElement('div'),
                fullscreen: this.testFullscreen(),
                geolocation: 'geolocation' in navigator,
                notifications: 'Notification' in window,
                vibration: 'vibrate' in navigator
            },

            // Performance Features
            performance: {
                performanceAPI: 'performance' in window,
                performanceObserver: 'PerformanceObserver' in window,
                memoryAPI: 'memory' in performance,
                navigationTiming: 'timing' in performance,
                resourceTiming: 'getEntriesByType' in performance
            }
        };

        return features;
    }

    /**
     * Test a JavaScript feature safely
     * @param {Function} testFn - Function to test the feature
     * @returns {boolean} Whether the feature is supported
     */
    testFeature(testFn) {
        try {
            return testFn();
        } catch (error) {
            return false;
        }
    }

    /**
     * Test CSS feature support
     * @param {string} property - CSS property to test
     * @param {string} value - CSS value to test
     * @returns {boolean} Whether the CSS feature is supported
     */
    testCSSFeature(property, value) {
        try {
            const element = document.createElement('div');
            element.style[property] = value;
            return element.style[property] === value;
        } catch (error) {
            return false;
        }
    }

    /**
     * Test localStorage support
     * @returns {boolean} Whether localStorage is supported
     */
    testLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Test sessionStorage support
     * @returns {boolean} Whether sessionStorage is supported
     */
    testSessionStorage() {
        try {
            const test = 'test';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Test WebGL support
     * @returns {boolean} Whether WebGL is supported
     */
    testWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (error) {
            return false;
        }
    }

    /**
     * Test Canvas support
     * @returns {boolean} Whether Canvas is supported
     */
    testCanvas() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        } catch (error) {
            return false;
        }
    }

    /**
     * Test Fullscreen API support
     * @returns {boolean} Whether Fullscreen API is supported
     */
    testFullscreen() {
        const element = document.createElement('div');
        return !!(
            element.requestFullscreen ||
            element.webkitRequestFullscreen ||
            element.mozRequestFullScreen ||
            element.msRequestFullscreen
        );
    }

    /**
     * Initialize polyfills for missing features
     */
    initializePolyfills() {
        console.log('Initializing browser polyfills...');

        // Polyfill for fetch API
        if (!this.supportedFeatures.apis.fetch) {
            console.warn('Fetch API not supported, using XMLHttpRequest fallback');
            this.polyfillFetch();
        }

        // Polyfill for Promise
        if (!this.supportedFeatures.es6.promises) {
            console.warn('Promises not supported, loading polyfill');
            this.polyfillPromise();
        }

        // Polyfill for IntersectionObserver
        if (!this.supportedFeatures.apis.intersectionObserver) {
            console.warn('IntersectionObserver not supported, using fallback');
            this.polyfillIntersectionObserver();
        }

        // Polyfill for classList
        if (!this.supportedFeatures.dom.classList) {
            console.warn('classList not supported, using polyfill');
            this.polyfillClassList();
        }

        // Polyfill for addEventListener
        if (!this.supportedFeatures.dom.addEventListener) {
            console.warn('addEventListener not supported, using attachEvent fallback');
            this.polyfillAddEventListener();
        }

        console.log('Polyfills initialized');
    }

    /**
     * Polyfill for fetch API using XMLHttpRequest
     */
    polyfillFetch() {
        if (typeof window.fetch === 'undefined') {
            window.fetch = function(url, options = {}) {
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    const method = options.method || 'GET';
                    
                    xhr.open(method, url);
                    
                    // Set headers
                    if (options.headers) {
                        Object.keys(options.headers).forEach(key => {
                            xhr.setRequestHeader(key, options.headers[key]);
                        });
                    }
                    
                    xhr.onload = function() {
                        const response = {
                            ok: xhr.status >= 200 && xhr.status < 300,
                            status: xhr.status,
                            statusText: xhr.statusText,
                            headers: {
                                get: function(name) {
                                    return xhr.getResponseHeader(name);
                                }
                            },
                            text: function() {
                                return Promise.resolve(xhr.responseText);
                            },
                            json: function() {
                                return Promise.resolve(JSON.parse(xhr.responseText));
                            }
                        };
                        resolve(response);
                    };
                    
                    xhr.onerror = function() {
                        reject(new Error('Network error'));
                    };
                    
                    xhr.send(options.body);
                });
            };
        }
    }

    /**
     * Simple Promise polyfill
     */
    polyfillPromise() {
        if (typeof window.Promise === 'undefined') {
            window.Promise = function(executor) {
                const self = this;
                self.state = 'pending';
                self.value = undefined;
                self.handlers = [];

                function resolve(result) {
                    if (self.state === 'pending') {
                        self.state = 'fulfilled';
                        self.value = result;
                        self.handlers.forEach(handle);
                        self.handlers = null;
                    }
                }

                function reject(error) {
                    if (self.state === 'pending') {
                        self.state = 'rejected';
                        self.value = error;
                        self.handlers.forEach(handle);
                        self.handlers = null;
                    }
                }

                function handle(handler) {
                    if (self.state === 'pending') {
                        self.handlers.push(handler);
                    } else {
                        if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
                            handler.onFulfilled(self.value);
                        }
                        if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
                            handler.onRejected(self.value);
                        }
                    }
                }

                this.then = function(onFulfilled, onRejected) {
                    return new Promise(function(resolve, reject) {
                        handle({
                            onFulfilled: function(result) {
                                try {
                                    resolve(onFulfilled ? onFulfilled(result) : result);
                                } catch (ex) {
                                    reject(ex);
                                }
                            },
                            onRejected: function(error) {
                                try {
                                    resolve(onRejected ? onRejected(error) : error);
                                } catch (ex) {
                                    reject(ex);
                                }
                            }
                        });
                    });
                };

                executor(resolve, reject);
            };
        }
    }

    /**
     * Polyfill for IntersectionObserver
     */
    polyfillIntersectionObserver() {
        if (typeof window.IntersectionObserver === 'undefined') {
            window.IntersectionObserver = function(callback, options = {}) {
                this.callback = callback;
                this.options = options;
                this.elements = [];

                this.observe = function(element) {
                    this.elements.push(element);
                    // Immediate callback for fallback
                    setTimeout(() => {
                        this.callback([{
                            target: element,
                            isIntersecting: true,
                            intersectionRatio: 1
                        }]);
                    }, 100);
                };

                this.unobserve = function(element) {
                    const index = this.elements.indexOf(element);
                    if (index > -1) {
                        this.elements.splice(index, 1);
                    }
                };

                this.disconnect = function() {
                    this.elements = [];
                };
            };
        }
    }

    /**
     * Polyfill for classList
     */
    polyfillClassList() {
        if (!('classList' in document.createElement('_'))) {
            (function(view) {
                if (!('Element' in view)) return;

                const classListProp = 'classList',
                    protoProp = 'prototype',
                    elemCtrProto = view.Element[protoProp],
                    objCtr = Object,
                    strTrim = String[protoProp].trim || function() {
                        return this.replace(/^\s+|\s+$/g, '');
                    };

                const DOMTokenList = function(el) {
                    this.el = el;
                    const classes = el.className.replace(/^\s+|\s+$/g, '').split(/\s+/);
                    for (let i = 0; i < classes.length; i++) {
                        this.push(classes[i]);
                    }
                    this._updateClassName = function() {
                        this.el.className = this.toString();
                    };
                };

                const dtp = DOMTokenList[protoProp] = [];

                dtp.item = function(i) {
                    return this[i] || null;
                };

                dtp.contains = function(token) {
                    token += '';
                    return this.indexOf(token) !== -1;
                };

                dtp.add = function() {
                    const tokens = arguments;
                    let i = 0,
                        l = tokens.length,
                        token, updated = false;
                    do {
                        token = tokens[i] + '';
                        if (this.indexOf(token) === -1) {
                            this.push(token);
                            updated = true;
                        }
                    } while (++i < l);

                    if (updated) {
                        this._updateClassName();
                    }
                };

                dtp.remove = function() {
                    const tokens = arguments;
                    let i = 0,
                        l = tokens.length,
                        token, updated = false, index;
                    do {
                        token = tokens[i] + '';
                        index = this.indexOf(token);
                        while (index !== -1) {
                            this.splice(index, 1);
                            updated = true;
                            index = this.indexOf(token);
                        }
                    } while (++i < l);

                    if (updated) {
                        this._updateClassName();
                    }
                };

                dtp.toggle = function(token, force) {
                    token += '';

                    const result = this.contains(token),
                        method = result ?
                        force !== true && 'remove' :
                        force !== false && 'add';

                    if (method) {
                        this[method](token);
                    }

                    if (force === true || force === false) {
                        return force;
                    } else {
                        return !result;
                    }
                };

                dtp.toString = function() {
                    return this.join(' ');
                };

                if (objCtr.defineProperty) {
                    const dtp = {
                        get: function() {
                            return new DOMTokenList(this);
                        },
                        enumerable: true,
                        configurable: true
                    };
                    try {
                        objCtr.defineProperty(elemCtrProto, classListProp, dtp);
                    } catch (ex) {
                        if (ex.number === -0x7FF5EC54) {
                            dtp.enumerable = false;
                            objCtr.defineProperty(elemCtrProto, classListProp, dtp);
                        }
                    }
                }
            }(window));
        }
    }

    /**
     * Polyfill for addEventListener
     */
    polyfillAddEventListener() {
        if (!window.addEventListener) {
            window.addEventListener = function(type, listener) {
                this.attachEvent('on' + type, listener);
            };

            window.removeEventListener = function(type, listener) {
                this.detachEvent('on' + type, listener);
            };
        }
    }

    /**
     * Get browser compatibility report
     * @returns {Object} Comprehensive compatibility report
     */
    getCompatibilityReport() {
        const report = {
            browser: this.browserInfo,
            features: this.supportedFeatures,
            recommendations: [],
            warnings: [],
            errors: []
        };

        // Check for critical missing features
        if (!this.supportedFeatures.apis.fetch) {
            report.warnings.push('Fetch API not supported - using XMLHttpRequest fallback');
        }

        if (!this.supportedFeatures.es6.promises) {
            report.warnings.push('Promises not supported - using polyfill');
        }

        if (!this.supportedFeatures.apis.canvas) {
            report.errors.push('Canvas not supported - PDF viewing may not work');
        }

        if (this.browserInfo.name === 'Internet Explorer') {
            report.errors.push('Internet Explorer is not fully supported - please use a modern browser');
        }

        // Recommendations
        if (this.browserInfo.name === 'Chrome' && parseInt(this.browserInfo.version) < 80) {
            report.recommendations.push('Consider updating Chrome for better performance');
        }

        if (this.browserInfo.name === 'Firefox' && parseInt(this.browserInfo.version) < 70) {
            report.recommendations.push('Consider updating Firefox for better compatibility');
        }

        if (this.browserInfo.name === 'Safari' && parseInt(this.browserInfo.version) < 13) {
            report.recommendations.push('Consider updating Safari for better features');
        }

        return report;
    }

    /**
     * Check if the current browser is supported
     * @returns {Object} Support status
     */
    checkBrowserSupport() {
        const requiredFeatures = [
            'apis.canvas',
            'dom.querySelector',
            'dom.addEventListener',
            'css.flexbox'
        ];

        const missingFeatures = [];
        const supportLevel = {
            full: true,
            partial: false,
            unsupported: false
        };

        requiredFeatures.forEach(feature => {
            const keys = feature.split('.');
            let current = this.supportedFeatures;
            
            for (const key of keys) {
                current = current[key];
                if (current === undefined) {
                    break;
                }
            }

            if (!current) {
                missingFeatures.push(feature);
                supportLevel.full = false;
            }
        });

        if (missingFeatures.length > 0) {
            if (missingFeatures.includes('apis.canvas')) {
                supportLevel.unsupported = true;
            } else {
                supportLevel.partial = true;
            }
        }

        return {
            ...supportLevel,
            missingFeatures,
            browserInfo: this.browserInfo,
            message: this.getSupportMessage(supportLevel, missingFeatures)
        };
    }

    /**
     * Get support message based on browser capabilities
     * @param {Object} supportLevel - Support level information
     * @param {Array} missingFeatures - Array of missing features
     * @returns {string} Support message
     */
    getSupportMessage(supportLevel) {
        if (supportLevel.unsupported) {
            return '이 브라우저는 지원되지 않습니다. Chrome, Firefox, Safari, 또는 Edge의 최신 버전을 사용해주세요.';
        } else if (supportLevel.partial) {
            return '일부 기능이 제한될 수 있습니다. 최신 브라우저로 업데이트하시면 더 나은 경험을 제공받을 수 있습니다.';
        } else {
            return '브라우저가 완전히 지원됩니다.';
        }
    }

    /**
     * Log compatibility information to console
     */
    logCompatibilityInfo() {
        const report = this.getCompatibilityReport();
        
        console.group('🌐 Browser Compatibility Report');
        console.log('Browser:', `${report.browser.name} ${report.browser.version} (${report.browser.engine})`);
        console.log('Mobile:', report.browser.isMobile);
        console.log('Tablet:', report.browser.isTablet);
        
        if (report.errors.length > 0) {
            console.group('❌ Errors');
            report.errors.forEach(error => console.error(error));
            console.groupEnd();
        }
        
        if (report.warnings.length > 0) {
            console.group('⚠️ Warnings');
            report.warnings.forEach(warning => console.warn(warning));
            console.groupEnd();
        }
        
        if (report.recommendations.length > 0) {
            console.group('💡 Recommendations');
            report.recommendations.forEach(rec => console.info(rec));
            console.groupEnd();
        }
        
        console.groupEnd();
    }

    /**
     * Run comprehensive browser compatibility tests
     * @returns {Object} Test results
     */
    runCompatibilityTests() {
        console.group('🧪 Running Browser Compatibility Tests');
        
        const testResults = {
            browser: this.browserInfo,
            timestamp: new Date().toISOString(),
            tests: {
                essential: this.testEssentialFeatures(),
                javascript: this.testJavaScriptFeatures(),
                dom: this.testDOMFeatures(),
                css: this.testCSSFeatures(),
                apis: this.testAPIFeatures(),
                performance: this.testPerformanceFeatures(),
                mobile: this.testMobileFeatures()
            },
            overall: {
                passed: 0,
                failed: 0,
                warnings: 0,
                score: 0
            }
        };

        // Calculate overall results
        Object.values(testResults.tests).forEach(category => {
            Object.values(category).forEach(test => {
                if (test.status === 'pass') testResults.overall.passed++;
                else if (test.status === 'fail') testResults.overall.failed++;
                else if (test.status === 'warning') testResults.overall.warnings++;
            });
        });

        const total = testResults.overall.passed + testResults.overall.failed + testResults.overall.warnings;
        testResults.overall.score = total > 0 ? Math.round((testResults.overall.passed / total) * 100) : 0;

        console.log('Test Results Summary:', testResults.overall);
        console.groupEnd();

        return testResults;
    }

    /**
     * Test essential features required for the app
     * @returns {Object} Essential feature test results
     */
    testEssentialFeatures() {
        return {
            canvas: this.createTest('Canvas API', () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                return ctx && typeof ctx.drawImage === 'function';
            }),
            
            fetch: this.createTest('Fetch API', () => {
                return typeof fetch === 'function';
            }),
            
            promises: this.createTest('Promises', () => {
                return typeof Promise === 'function' && 
                       typeof Promise.resolve === 'function';
            }),
            
            querySelector: this.createTest('querySelector', () => {
                return typeof document.querySelector === 'function';
            }),
            
            addEventListener: this.createTest('addEventListener', () => {
                return typeof document.addEventListener === 'function';
            })
        };
    }

    /**
     * Test JavaScript ES6+ features
     * @returns {Object} JavaScript feature test results
     */
    testJavaScriptFeatures() {
        return {
            arrowFunctions: this.createTest('Arrow Functions', () => {
                try {
                    eval('(() => true)()');
                    return true;
                } catch (e) {
                    return false;
                }
            }),
            
            constLet: this.createTest('const/let', () => {
                try {
                    eval('const x = 1; let y = 2;');
                    return true;
                } catch (e) {
                    return false;
                }
            }),
            
            templateLiterals: this.createTest('Template Literals', () => {
                try {
                    return eval('`test` === "test"');
                } catch (e) {
                    return false;
                }
            }),
            
            destructuring: this.createTest('Destructuring', () => {
                try {
                    eval('const [a] = [1]; const {b} = {b: 2};');
                    return true;
                } catch (e) {
                    return false;
                }
            }),
            
            classes: this.createTest('ES6 Classes', () => {
                try {
                    eval('class Test { constructor() {} }');
                    return true;
                } catch (e) {
                    return false;
                }
            }),
            
            asyncAwait: this.createTest('Async/Await', () => {
                try {
                    eval('async function test() { await Promise.resolve(); }');
                    return true;
                } catch (e) {
                    return false;
                }
            })
        };
    }

    /**
     * Test DOM manipulation features
     * @returns {Object} DOM feature test results
     */
    testDOMFeatures() {
        return {
            classList: this.createTest('classList', () => {
                const div = document.createElement('div');
                return 'classList' in div && 
                       typeof div.classList.add === 'function';
            }),
            
            dataset: this.createTest('dataset', () => {
                const div = document.createElement('div');
                return 'dataset' in div;
            }),
            
            querySelectorAll: this.createTest('querySelectorAll', () => {
                return typeof document.querySelectorAll === 'function';
            }),
            
            createElement: this.createTest('createElement', () => {
                return typeof document.createElement === 'function';
            }),
            
            appendChild: this.createTest('appendChild', () => {
                const div = document.createElement('div');
                return typeof div.appendChild === 'function';
            })
        };
    }

    /**
     * Test CSS features
     * @returns {Object} CSS feature test results
     */
    testCSSFeatures() {
        return {
            flexbox: this.createTest('Flexbox', () => {
                return this.testCSSFeature('display', 'flex');
            }),
            
            grid: this.createTest('CSS Grid', () => {
                return this.testCSSFeature('display', 'grid');
            }),
            
            variables: this.createTest('CSS Variables', () => {
                return this.testCSSFeature('--test', 'value');
            }),
            
            transforms: this.createTest('CSS Transforms', () => {
                return this.testCSSFeature('transform', 'translateX(1px)');
            }),
            
            transitions: this.createTest('CSS Transitions', () => {
                return this.testCSSFeature('transition', 'all 1s');
            }),
            
            animations: this.createTest('CSS Animations', () => {
                return this.testCSSFeature('animation', 'test 1s');
            })
        };
    }

    /**
     * Test API features
     * @returns {Object} API feature test results
     */
    testAPIFeatures() {
        return {
            localStorage: this.createTest('localStorage', () => {
                return this.testLocalStorage();
            }),
            
            sessionStorage: this.createTest('sessionStorage', () => {
                return this.testSessionStorage();
            }),
            
            intersectionObserver: this.createTest('IntersectionObserver', () => {
                return 'IntersectionObserver' in window;
            }),
            
            mutationObserver: this.createTest('MutationObserver', () => {
                return 'MutationObserver' in window;
            }),
            
            fileAPI: this.createTest('File API', () => {
                return 'File' in window && 'FileReader' in window;
            }),
            
            fullscreen: this.createTest('Fullscreen API', () => {
                return this.testFullscreen();
            })
        };
    }

    /**
     * Test performance features
     * @returns {Object} Performance feature test results
     */
    testPerformanceFeatures() {
        return {
            performanceAPI: this.createTest('Performance API', () => {
                return 'performance' in window && 
                       typeof performance.now === 'function';
            }),
            
            performanceObserver: this.createTest('PerformanceObserver', () => {
                return 'PerformanceObserver' in window;
            }),
            
            navigationTiming: this.createTest('Navigation Timing', () => {
                return 'timing' in performance;
            }),
            
            resourceTiming: this.createTest('Resource Timing', () => {
                return 'getEntriesByType' in performance;
            }),
            
            memoryAPI: this.createTest('Memory API', () => {
                return 'memory' in performance;
            })
        };
    }

    /**
     * Test mobile-specific features
     * @returns {Object} Mobile feature test results
     */
    testMobileFeatures() {
        return {
            touchEvents: this.createTest('Touch Events', () => {
                return 'ontouchstart' in window || 
                       'TouchEvent' in window;
            }),
            
            orientationChange: this.createTest('Orientation Change', () => {
                return 'onorientationchange' in window;
            }),
            
            deviceMotion: this.createTest('Device Motion', () => {
                return 'DeviceMotionEvent' in window;
            }),
            
            vibration: this.createTest('Vibration API', () => {
                return 'vibrate' in navigator;
            }),
            
            geolocation: this.createTest('Geolocation', () => {
                return 'geolocation' in navigator;
            })
        };
    }

    /**
     * Create a test result object
     * @param {string} name - Test name
     * @param {Function} testFn - Test function
     * @returns {Object} Test result
     */
    createTest(name, testFn) {
        try {
            const result = testFn();
            return {
                name: name,
                status: result ? 'pass' : 'fail',
                supported: result,
                message: result ? `${name} is supported` : `${name} is not supported`
            };
        } catch (error) {
            return {
                name: name,
                status: 'fail',
                supported: false,
                message: `${name} test failed: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Test specific browser functionality with real operations
     * @returns {Object} Functional test results
     */
    async testBrowserFunctionality() {
        console.group('🔧 Testing Browser Functionality');
        
        const functionalTests = {
            imageLoading: await this.testImageLoading(),
            pdfSupport: await this.testPDFSupport(),
            csvParsing: await this.testCSVParsing(),
            domManipulation: this.testDOMManipulation(),
            eventHandling: this.testEventHandling(),
            errorHandling: this.testErrorHandling()
        };

        console.log('Functional Test Results:', functionalTests);
        console.groupEnd();

        return functionalTests;
    }

    /**
     * Test image loading functionality
     * @returns {Promise<Object>} Image loading test result
     */
    async testImageLoading() {
        return new Promise((resolve) => {
            const img = new Image();
            const startTime = performance.now();
            
            img.onload = () => {
                const loadTime = performance.now() - startTime;
                resolve({
                    status: 'pass',
                    message: 'Image loading works correctly',
                    loadTime: loadTime
                });
            };
            
            img.onerror = () => {
                resolve({
                    status: 'fail',
                    message: 'Image loading failed',
                    error: 'Image load error'
                });
            };
            
            // Use a small test image (1x1 pixel PNG)
            img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
            
            // Timeout after 5 seconds
            setTimeout(() => {
                resolve({
                    status: 'warning',
                    message: 'Image loading test timed out',
                    timeout: true
                });
            }, 5000);
        });
    }

    /**
     * Test PDF support (basic check)
     * @returns {Promise<Object>} PDF support test result
     */
    async testPDFSupport() {
        try {
            // Check if PDF.js is available
            if (typeof pdfjsLib !== 'undefined') {
                return {
                    status: 'pass',
                    message: 'PDF.js is available',
                    version: pdfjsLib.version || 'unknown'
                };
            } else {
                return {
                    status: 'warning',
                    message: 'PDF.js not loaded yet',
                    note: 'PDF functionality may still work when library loads'
                };
            }
        } catch (error) {
            return {
                status: 'fail',
                message: 'PDF support test failed',
                error: error.message
            };
        }
    }

    /**
     * Test CSV parsing functionality
     * @returns {Promise<Object>} CSV parsing test result
     */
    async testCSVParsing() {
        try {
            // Check if Papa Parse is available
            if (typeof Papa !== 'undefined') {
                // Test basic CSV parsing
                const testCSV = 'year,month,question\n2025,6,1\n2025,6,2';
                const result = Papa.parse(testCSV, { header: true });
                
                if (result.data && result.data.length === 2) {
                    return {
                        status: 'pass',
                        message: 'CSV parsing works correctly',
                        parsedRows: result.data.length
                    };
                } else {
                    return {
                        status: 'fail',
                        message: 'CSV parsing produced unexpected results',
                        result: result
                    };
                }
            } else {
                return {
                    status: 'warning',
                    message: 'Papa Parse not loaded yet',
                    note: 'CSV functionality may still work when library loads'
                };
            }
        } catch (error) {
            return {
                status: 'fail',
                message: 'CSV parsing test failed',
                error: error.message
            };
        }
    }

    /**
     * Test DOM manipulation functionality
     * @returns {Object} DOM manipulation test result
     */
    testDOMManipulation() {
        try {
            // Create test element
            const testDiv = document.createElement('div');
            testDiv.id = 'compatibility-test';
            testDiv.className = 'test-class';
            testDiv.innerHTML = '<span>Test</span>';
            
            // Test appendChild
            document.body.appendChild(testDiv);
            
            // Test querySelector
            const found = document.querySelector('#compatibility-test');
            
            // Test classList
            found.classList.add('added-class');
            found.classList.remove('test-class');
            
            // Test dataset
            found.dataset.testAttribute = 'test-value';
            
            // Clean up
            document.body.removeChild(testDiv);
            
            return {
                status: 'pass',
                message: 'DOM manipulation works correctly',
                operations: ['createElement', 'appendChild', 'querySelector', 'classList', 'dataset']
            };
        } catch (error) {
            return {
                status: 'fail',
                message: 'DOM manipulation test failed',
                error: error.message
            };
        }
    }

    /**
     * Test event handling functionality
     * @returns {Object} Event handling test result
     */
    testEventHandling() {
        try {
            let eventFired = false;
            
            // Create test element
            const testButton = document.createElement('button');
            
            // Test addEventListener
            const testHandler = () => {
                eventFired = true;
            };
            
            testButton.addEventListener('click', testHandler);
            
            // Simulate click event
            const clickEvent = new Event('click');
            testButton.dispatchEvent(clickEvent);
            
            // Test removeEventListener
            testButton.removeEventListener('click', testHandler);
            
            return {
                status: eventFired ? 'pass' : 'fail',
                message: eventFired ? 'Event handling works correctly' : 'Event handling failed',
                eventFired: eventFired
            };
        } catch (error) {
            return {
                status: 'fail',
                message: 'Event handling test failed',
                error: error.message
            };
        }
    }

    /**
     * Test error handling functionality
     * @returns {Object} Error handling test result
     */
    testErrorHandling() {
        try {
            let errorCaught = false;
            
            // Test try-catch
            try {
                throw new Error('Test error');
            } catch (e) {
                errorCaught = true;
            }
            
            // Test Promise rejection handling
            let promiseRejectionHandled = false;
            Promise.reject('Test rejection').catch(() => {
                promiseRejectionHandled = true;
            });
            
            return {
                status: errorCaught ? 'pass' : 'fail',
                message: errorCaught ? 'Error handling works correctly' : 'Error handling failed',
                tryCatchWorks: errorCaught,
                promiseRejectionHandling: promiseRejectionHandled
            };
        } catch (error) {
            return {
                status: 'fail',
                message: 'Error handling test failed',
                error: error.message
            };
        }
    }

    /**
     * Generate comprehensive compatibility report
     * @returns {Object} Comprehensive compatibility report
     */
    async generateCompatibilityReport() {
        console.group('📊 Generating Comprehensive Compatibility Report');
        
        const report = {
            timestamp: new Date().toISOString(),
            browser: this.browserInfo,
            features: this.supportedFeatures,
            compatibilityTests: this.runCompatibilityTests(),
            functionalTests: await this.testBrowserFunctionality(),
            recommendations: [],
            warnings: [],
            errors: []
        };

        // Analyze results and generate recommendations
        this.analyzeCompatibilityResults(report);

        console.log('Compatibility Report Generated:', report);
        console.groupEnd();

        return report;
    }

    /**
     * Analyze compatibility results and generate recommendations
     * @param {Object} report - Compatibility report to analyze
     */
    analyzeCompatibilityResults(report) {
        const { browser, compatibilityTests, functionalTests } = report;

        // Browser-specific recommendations
        if (browser.name === 'Internet Explorer') {
            report.errors.push('Internet Explorer is not supported. Please use Chrome, Firefox, Safari, or Edge.');
        } else if (browser.name === 'Chrome' && parseInt(browser.version) < 70) {
            report.warnings.push('Chrome version is outdated. Consider updating for better performance.');
        } else if (browser.name === 'Firefox' && parseInt(browser.version) < 65) {
            report.warnings.push('Firefox version is outdated. Consider updating for better compatibility.');
        } else if (browser.name === 'Safari' && parseInt(browser.version) < 12) {
            report.warnings.push('Safari version is outdated. Consider updating for better features.');
        }

        // Essential feature checks
        const essentialTests = compatibilityTests.tests.essential;
        if (essentialTests.canvas.status === 'fail') {
            report.errors.push('Canvas API is not supported. PDF viewing will not work.');
        }
        if (essentialTests.fetch.status === 'fail') {
            report.warnings.push('Fetch API is not supported. Using XMLHttpRequest fallback.');
        }
        if (essentialTests.promises.status === 'fail') {
            report.warnings.push('Promises are not supported. Using polyfill.');
        }

        // Mobile-specific recommendations
        if (browser.isMobile) {
            report.recommendations.push('Mobile device detected. Touch gestures are available for PDF navigation.');
            
            if (!compatibilityTests.tests.mobile.touchEvents.supported) {
                report.warnings.push('Touch events not fully supported on this mobile browser.');
            }
        }

        // Performance recommendations
        if (compatibilityTests.overall.score < 80) {
            report.recommendations.push('Browser compatibility score is low. Consider using a modern browser for better experience.');
        }

        // Functional test analysis
        if (functionalTests.imageLoading.status === 'fail') {
            report.errors.push('Image loading functionality is not working properly.');
        }
        if (functionalTests.pdfSupport.status === 'fail') {
            report.errors.push('PDF support is not available.');
        }
        if (functionalTests.csvParsing.status === 'fail') {
            report.errors.push('CSV parsing functionality is not working.');
        }
    }
}