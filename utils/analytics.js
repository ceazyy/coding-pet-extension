// Analytics system
class Analytics {
  static events = [];
  static maxEvents = 1000;

  static track(eventName, properties = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      event: eventName,
      properties,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.events.push(event);

    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Store in chrome.storage
    chrome.storage.local.get('analyticsEvents', (result) => {
      const events = result.analyticsEvents || [];
      events.push(event);
      chrome.storage.local.set({ analyticsEvents: events });
    });

    // Send to analytics service if configured
    if (this.analyticsEndpoint) {
      this.sendToAnalytics(event);
    }
  }

  static async getEvents() {
    return new Promise((resolve) => {
      chrome.storage.local.get('analyticsEvents', (result) => {
        resolve(result.analyticsEvents || []);
      });
    });
  }

  static clearEvents() {
    this.events = [];
    chrome.storage.local.set({ analyticsEvents: [] });
  }

  static setAnalyticsEndpoint(endpoint) {
    this.analyticsEndpoint = endpoint;
  }

  static async sendToAnalytics(event) {
    try {
      const response = await fetch(this.analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send analytics');
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }
}

// Track common events
const trackCommonEvents = () => {
  // Track extension installation
  chrome.runtime.onInstalled.addListener((details) => {
    Analytics.track('Extension Installed', { reason: details.reason });
  });

  // Track daily goals
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.petState) {
      const newState = changes.petState.newValue;
      const oldState = changes.petState.oldValue;

      if (newState.solvedToday > oldState.solvedToday) {
        Analytics.track('Problem Solved', {
          solvedToday: newState.solvedToday,
          dailyGoal: newState.chonkLevel
        });
      }

      if (newState.solvedToday >= newState.chonkLevel) {
        Analytics.track('Daily Goal Achieved', {
          solvedToday: newState.solvedToday,
          dailyGoal: newState.chonkLevel
        });
      }
    }
  });
};

// Initialize analytics tracking
trackCommonEvents();

export default Analytics; 