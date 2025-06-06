// Simple browser polyfill for Firefox extension compatibility
(function() {
  'use strict';
  
  // If browser API already exists (Firefox), use it
  if (typeof browser !== 'undefined') {
    return;
  }
  
  // If chrome API exists, create browser polyfill
  if (typeof chrome !== 'undefined') {
    window.browser = chrome;
    return;
  }
  
  // Fallback - create minimal API structure
  window.browser = {
    runtime: {
      onMessage: {
        addListener: function() { console.warn('Browser API not available'); }
      },
      sendMessage: function() { 
        console.warn('Browser API not available');
        return Promise.reject('API not available');
      },
      getURL: function(path) {
        return chrome?.runtime?.getURL?.(path) || path;
      }
    },
    storage: {
      sync: {
        get: function() { 
          console.warn('Storage API not available');
          return Promise.resolve({});
        },
        set: function() {
          console.warn('Storage API not available');
          return Promise.resolve();
        }
      }
    },
    tabs: {
      query: function(queryInfo, callback) {
        console.warn('Tabs API not available');
        if (callback) callback([]);
      },
      sendMessage: function() {
        console.warn('Tabs API not available');
        return Promise.reject('API not available');
      }
    },
    notifications: {
      create: function() {
        console.warn('Notifications API not available');
        return Promise.resolve();
      },
      clear: function() {
        console.warn('Notifications API not available');
        return Promise.resolve();
      },
      onClicked: {
        addListener: function() { console.warn('Notifications API not available'); }
      },
      onButtonClicked: {
        addListener: function() { console.warn('Notifications API not available'); }
      }
    },
    alarms: {
      create: function() {
        console.warn('Alarms API not available');
        return Promise.resolve();
      },
      onAlarm: {
        addListener: function() { console.warn('Alarms API not available'); }
      }
    },
    browserAction: {
      openPopup: function() {
        console.warn('BrowserAction API not available');
      }
    }
  };
})();
