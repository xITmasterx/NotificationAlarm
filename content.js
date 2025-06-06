// Content script for detecting notifications and playing alarm sounds
class NotificationDetector {
  constructor() {
    this.audioElements = new Map();
    this.originalNotification = window.Notification;
    this.init();
  }

  init() {
    this.interceptNotifications();
    this.setupMessageListener();
    this.observePageChanges();
    console.log('Notification detector initialized on:', window.location.hostname);
  }

  interceptNotifications() {
    const self = this;

    // Override the Notification constructor
    window.Notification = function(title, options = {}) {
      // Send notification data to background script
      self.sendNotificationToBackground({
        title: title,
        message: options.body || '',
        icon: options.icon || '',
        tag: options.tag || '',
        timestamp: Date.now()
      });

      // Create the original notification (but it might be replaced by our alarm)
      return new self.originalNotification(title, options);
    };

    // Copy static properties
    Object.setPrototypeOf(window.Notification, self.originalNotification);
    Object.defineProperty(window.Notification, 'permission', {
      get: () => self.originalNotification.permission
    });
    window.Notification.requestPermission = self.originalNotification.requestPermission.bind(self.originalNotification);
  }

  observePageChanges() {
    // Watch for dynamically created notifications
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.checkForNotificationElements(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  checkForNotificationElements(element) {
    // Check for common notification selectors
    const notificationSelectors = [
      '.notification',
      '.toast',
      '.alert',
      '.popup-notification',
      '[role="alert"]',
      '.snackbar'
    ];

    notificationSelectors.forEach(selector => {
      const notifications = element.querySelectorAll ?
        element.querySelectorAll(selector) :
        (element.matches && element.matches(selector) ? [element] : []);

      notifications.forEach(notif => {
        if (!notif.dataset.alarmProcessed) {
          notif.dataset.alarmProcessed = 'true';
          this.processElementNotification(notif);
        }
      });
    });
  }

  processElementNotification(element) {
    const title = this.extractTitle(element);
    const message = this.extractMessage(element);

    if (title || message) {
      this.sendNotificationToBackground({
        title: title || 'Page Notification',
        message: message || '',
        timestamp: Date.now(),
        source: 'element'
      });
    }
  }

  extractTitle(element) {
    // Try various methods to extract title
    const titleSelectors = [
      '.notification-title',
      '.toast-title',
      '.alert-title',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      '.title',
      '[data-title]'
    ];

    for (const selector of titleSelectors) {
      const titleEl = element.querySelector(selector);
      if (titleEl) {
        return titleEl.textContent.trim();
      }
    }

    // Fallback to element's own text if it's short
    const text = element.textContent.trim();
    return text.length < 100 ? text : text.substring(0, 100) + '...';
  }

  extractMessage(element) {
    // Try to extract message content
    const messageSelectors = [
      '.notification-message',
      '.toast-message',
      '.alert-message',
      '.message',
      'p',
      '.content'
    ];

    for (const selector of messageSelectors) {
      const messageEl = element.querySelector(selector);
      if (messageEl) {
        return messageEl.textContent.trim();
      }
    }

    return '';
  }

  sendNotificationToBackground(notificationData) {
    browser.runtime.sendMessage({
      type: 'NOTIFICATION_DETECTED',
      data: notificationData
    }).catch(error => {
      console.error('Error sending notification to background:', error);
    });
  }

  setupMessageListener() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'PLAY_ALARM_SOUND':
          this.playAlarmSound(message.alarmId, message.soundFile, message.volume);
          break;

        case 'STOP_ALARM_SOUND':
          this.stopAlarmSound(message.alarmId);
          break;
      }
    });
  }

  playAlarmSound(alarmId, soundFile = 'default', volume = 0.8) {
    // Stop any existing alarm for this ID
    this.stopAlarmSound(alarmId);

    // Create audio element
    const audio = document.createElement('audio');
    audio.loop = true;
    audio.volume = volume;

    // Set sound source
    const soundPath = soundFile === 'default' ?
      browser.runtime.getURL('sounds/default-alarm.mp3') :
      browser.runtime.getURL(`sounds/${soundFile}`);

    audio.src = soundPath;

    // Store reference
    this.audioElements.set(alarmId, audio);

    // Play the sound
    audio.play().catch(error => {
      console.error('Error playing alarm sound:', error);
      // Fallback to system beep
      this.playSystemBeep(alarmId);
    });
  }

  stopAlarmSound(alarmId) {
    const audio = this.audioElements.get(alarmId);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      this.audioElements.delete(alarmId);
    }
  }

  playSystemBeep(alarmId) {
    // Fallback beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

      oscillator.start();

      // Create beeping pattern
      const beepInterval = setInterval(() => {
        if (!this.audioElements.has(alarmId)) {
          clearInterval(beepInterval);
          oscillator.stop();
          return;
        }

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
      }, 1000);

      // Store reference for stopping
      this.audioElements.set(alarmId, {
        stop: () => {
          clearInterval(beepInterval);
          oscillator.stop();
        }
      });

    } catch (error) {
      console.error('Error creating system beep:', error);
    }
  }
}

// Initialize the detector
const detector = new NotificationDetector();