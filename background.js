// Background script for Notification Alarm Extension
class NotificationAlarmManager {
  constructor() {
    this.activeAlarms = new Map();
    this.settings = {
      monitoredSites: [],
      defaultAlarmDuration: 30, // seconds
      defaultSnoozeTime: 5, // minutes
      alarmSound: 'default',
      volume: 0.8
    };
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    console.log('Notification Alarm Manager initialized');
  }

  async loadSettings() {
    try {
      const result = await browser.storage.sync.get(['notificationAlarmSettings']);
      if (result.notificationAlarmSettings) {
        this.settings = { ...this.settings, ...result.notificationAlarmSettings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    try {
      await browser.storage.sync.set({ notificationAlarmSettings: this.settings });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  setupEventListeners() {
    // Listen for messages from content scripts
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Listen for alarm events (for snooze functionality)
    browser.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarmEvent(alarm);
    });

    // Listen for notification clicks
    browser.notifications.onClicked.addListener((notificationId) => {
      this.handleNotificationClick(notificationId);
    });

    // Listen for notification button clicks
    browser.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
      this.handleNotificationButtonClick(notificationId, buttonIndex);
    });
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'NOTIFICATION_DETECTED':
        await this.handleNotificationDetected(message.data, sender.tab);
        sendResponse({ success: true });
        break;
      
      case 'GET_ACTIVE_ALARMS':
        sendResponse({ alarms: Array.from(this.activeAlarms.values()) });
        break;
      
      case 'DISMISS_ALARM':
        await this.dismissAlarm(message.alarmId);
        sendResponse({ success: true });
        break;
      
      case 'SNOOZE_ALARM':
        await this.snoozeAlarm(message.alarmId, message.duration);
        sendResponse({ success: true });
        break;
      
      case 'GET_SETTINGS':
        sendResponse({ settings: this.settings });
        break;
      
      case 'UPDATE_SETTINGS':
        this.settings = { ...this.settings, ...message.settings };
        await this.saveSettings();
        sendResponse({ success: true });
        break;
    }
  }

  async handleNotificationDetected(notificationData, tab) {
    // Handle test alarms (no tab provided) or regular notifications
    let domain = 'test-alarm';
    if (tab && tab.url) {
      domain = new URL(tab.url).hostname;

      // Check if this domain is in our monitored sites
      if (!this.settings.monitoredSites.includes(domain)) {
        return;
      }
    }

    console.log('Creating alarm for notification from:', domain);
    
    // Create persistent alarm
    const alarmId = `alarm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alarm = {
      id: alarmId,
      title: notificationData.title || 'Notification Alarm',
      message: notificationData.message || 'You have a notification',
      domain: domain,
      timestamp: Date.now(),
      isActive: true,
      snoozeCount: 0
    };

    this.activeAlarms.set(alarmId, alarm);
    await this.startAlarm(alarm);
  }

  async startAlarm(alarm) {
    // Create notification with action buttons
    await browser.notifications.create(alarm.id, {
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: `🚨 ${alarm.title}`,
      message: `${alarm.message}\n\nFrom: ${alarm.domain}`,
      buttons: [
        { title: 'Snooze' },
        { title: 'Dismiss' }
      ],
      requireInteraction: true
    });

    // Start audio alarm
    this.playAlarmSound(alarm.id);
    
    // Set auto-dismiss timer
    setTimeout(() => {
      if (this.activeAlarms.has(alarm.id)) {
        this.dismissAlarm(alarm.id);
      }
    }, this.settings.defaultAlarmDuration * 1000);
  }

  playAlarmSound(alarmId) {
    // Send message to content script to play sound
    // Try active tab first, then fall back to any available tab
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, {
          type: 'PLAY_ALARM_SOUND',
          alarmId: alarmId,
          soundFile: this.settings.alarmSound,
          volume: this.settings.volume
        }).catch(() => {
          // If active tab fails, try any available tab
          this.playAlarmSoundFallback(alarmId);
        });
      } else {
        // No active tab, try any available tab
        this.playAlarmSoundFallback(alarmId);
      }
    });
  }

  playAlarmSoundFallback(alarmId) {
    // Send to any available tab as fallback
    browser.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        browser.tabs.sendMessage(tab.id, {
          type: 'PLAY_ALARM_SOUND',
          alarmId: alarmId,
          soundFile: this.settings.alarmSound,
          volume: this.settings.volume
        }).then(() => {
          // Successfully sent to a tab, stop trying others
          return;
        }).catch(() => {
          // Continue to next tab
        });
      }
    });
  }

  async handleNotificationClick(notificationId) {
    if (this.activeAlarms.has(notificationId)) {
      // Show popup or focus extension
      browser.browserAction.openPopup();
    }
  }

  async handleNotificationButtonClick(notificationId, buttonIndex) {
    if (!this.activeAlarms.has(notificationId)) return;

    if (buttonIndex === 0) {
      // Snooze button
      await this.snoozeAlarm(notificationId, this.settings.defaultSnoozeTime);
    } else if (buttonIndex === 1) {
      // Dismiss button
      await this.dismissAlarm(notificationId);
    }
  }

  async snoozeAlarm(alarmId, duration = null) {
    const alarm = this.activeAlarms.get(alarmId);
    if (!alarm) return;

    const snoozeDuration = duration || this.settings.defaultSnoozeTime;
    alarm.snoozeCount++;
    alarm.isActive = false;

    // Clear current notification
    await browser.notifications.clear(alarmId);
    
    // Stop alarm sound
    this.stopAlarmSound(alarmId);

    // Set snooze alarm
    const snoozeAlarmName = `snooze_${alarmId}`;
    await browser.alarms.create(snoozeAlarmName, { delayInMinutes: snoozeDuration });

    console.log(`Alarm ${alarmId} snoozed for ${snoozeDuration} minutes`);
  }

  async dismissAlarm(alarmId) {
    const alarm = this.activeAlarms.get(alarmId);
    if (!alarm) return;

    // Clear notification
    await browser.notifications.clear(alarmId);
    
    // Stop alarm sound
    this.stopAlarmSound(alarmId);
    
    // Remove from active alarms
    this.activeAlarms.delete(alarmId);

    console.log(`Alarm ${alarmId} dismissed`);
  }

  stopAlarmSound(alarmId) {
    // Send message to content script to stop sound
    browser.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        browser.tabs.sendMessage(tab.id, {
          type: 'STOP_ALARM_SOUND',
          alarmId: alarmId
        }).catch(() => {}); // Ignore errors for tabs that don't have content script
      });
    });
  }

  async handleAlarmEvent(alarm) {
    if (alarm.name.startsWith('snooze_')) {
      const originalAlarmId = alarm.name.replace('snooze_', '');
      const alarmData = this.activeAlarms.get(originalAlarmId);
      
      if (alarmData) {
        alarmData.isActive = true;
        await this.startAlarm(alarmData);
      }
    }
  }
}

// Initialize the manager
const alarmManager = new NotificationAlarmManager();
