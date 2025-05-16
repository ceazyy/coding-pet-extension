// Error handling system
class ErrorHandler {
  static errors = [];
  static maxErrors = 100;

  static log(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errors.push(errorLog);
    
    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Coding Pet Error:', errorLog);
    }

    // Send to analytics if available
    if (window.analytics) {
      window.analytics.track('Error', errorLog);
    }

    // Store in chrome.storage
    chrome.storage.local.get('errorLogs', (result) => {
      const errorLogs = result.errorLogs || [];
      errorLogs.push(errorLog);
      chrome.storage.local.set({ errorLogs });
    });
  }

  static async getErrors() {
    return new Promise((resolve) => {
      chrome.storage.local.get('errorLogs', (result) => {
        resolve(result.errorLogs || []);
      });
    });
  }

  static clearErrors() {
    this.errors = [];
    chrome.storage.local.set({ errorLogs: [] });
  }
}

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
  ErrorHandler.log(error, {
    message,
    source,
    lineno,
    colno
  });
  return false;
};

// Promise error handler
window.addEventListener('unhandledrejection', function(event) {
  ErrorHandler.log(event.reason, {
    type: 'unhandledrejection'
  });
});

export default ErrorHandler; 