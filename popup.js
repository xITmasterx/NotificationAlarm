// Popup script for Notification Alarm Extension
class PopupManager {
  constructor() {
    this.activeAlarms = [];
    this.settings = {};
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderUI();
    this.startPeriodicUpdate();
  }

  async loadData() {
    try {
      // Get active alarms
      const alarmsResponse = await browser.runtime.sendMessage({ type: 'GET_ACTIVE_ALARMS' });
      this.activeAlarms = alarmsResponse.alarms || [];

      // Get settings
      const settingsResponse = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' });
      this.settings = settingsResponse.settings || {};
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  setupEventListeners() {
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', () => {
      browser.runtime.openOptionsPage();
    });

    // Dismiss all button
    document.getElementById('dismissAllBtn').addEventListener('click', () => {
      this.dismissAllAlarms();
    });

    // Snooze all button
    document.getElementById('snoozeAllBtn').addEventListener('click', () => {
      this.snoozeAllAlarms();
    });

    // Add site button
    document.getElementById('addSiteBtn').addEventListener('click', () => {
      this.addMonitoredSite();
    });

    // Enter key for add site input
    document.getElementById('newSiteInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addMonitoredSite();
      }
    });
  }

  renderUI() {
    this.renderActiveAlarms();
    this.renderMonitoredSites();
    this.updateStatus();
  }

  renderActiveAlarms() {
    const container = document.getElementById('activeAlarmsList');
    const noAlarmsMessage = document.getElementById('noAlarmsMessage');
    const template = document.getElementById('alarmTemplate');

    // Clear existing content
    container.innerHTML = '';

    if (this.activeAlarms.length === 0) {
      noAlarmsMessage.style.display = 'block';
      return;
    }

    noAlarmsMessage.style.display = 'none';

    this.activeAlarms.forEach(alarm => {
      const alarmElement = template.content.cloneNode(true);
      
      // Set alarm data
      const alarmItem = alarmElement.querySelector('.alarm-item');
      alarmItem.dataset.alarmId = alarm.id;
      
      alarmElement.querySelector('.alarm-title').textContent = alarm.title;
      alarmElement.querySelector('.alarm-message').textContent = alarm.message;
      alarmElement.querySelector('.alarm-domain').textContent = alarm.domain;
      alarmElement.querySelector('.alarm-time').textContent = this.formatTime(alarm.timestamp);
      
      const snoozeCount = alarmElement.querySelector('.alarm-snooze-count');
      if (alarm.snoozeCount > 0) {
        snoozeCount.textContent = `Snoozed ${alarm.snoozeCount}x`;
        snoozeCount.style.display = 'inline';
      }

      // Add event listeners
      alarmElement.querySelector('.snooze-btn').addEventListener('click', () => {
        this.snoozeAlarm(alarm.id);
      });

      alarmElement.querySelector('.dismiss-btn').addEventListener('click', () => {
        this.dismissAlarm(alarm.id);
      });

      container.appendChild(alarmElement);
    });
  }

  renderMonitoredSites() {
    const container = document.getElementById('monitoredSitesList');
    const template = document.getElementById('siteTemplate');

    // Clear existing content
    container.innerHTML = '';

    if (!this.settings.monitoredSites || this.settings.monitoredSites.length === 0) {
      container.innerHTML = '<div class="no-sites">No sites being monitored</div>';
      return;
    }

    this.settings.monitoredSites.forEach(domain => {
      const siteElement = template.content.cloneNode(true);
      
      const siteItem = siteElement.querySelector('.site-item');
      siteItem.dataset.domain = domain;
      
      siteElement.querySelector('.site-domain').textContent = domain;
      
      // Add remove button listener
      siteElement.querySelector('.remove-site-btn').addEventListener('click', () => {
        this.removeMonitoredSite(domain);
      });

      container.appendChild(siteElement);
    });
  }

  updateStatus() {
    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    const totalAlarms = document.getElementById('totalAlarms');

    if (this.activeAlarms.length > 0) {
      statusText.textContent = `${this.activeAlarms.length} active alarm(s)`;
      statusDot.className = 'status-dot alarm';
    } else {
      statusText.textContent = 'Monitoring notifications...';
      statusDot.className = 'status-dot active';
    }

    // Update total alarms count (simplified for now)
    totalAlarms.textContent = `${this.activeAlarms.length} active alarms`;
  }

  async snoozeAlarm(alarmId, duration = null) {
    try {
      await browser.runtime.sendMessage({
        type: 'SNOOZE_ALARM',
        alarmId: alarmId,
        duration: duration || this.settings.defaultSnoozeTime
      });
      
      // Refresh data
      await this.loadData();
      this.renderUI();
    } catch (error) {
      console.error('Error snoozing alarm:', error);
    }
  }

  async dismissAlarm(alarmId) {
    try {
      await browser.runtime.sendMessage({
        type: 'DISMISS_ALARM',
        alarmId: alarmId
      });
      
      // Refresh data
      await this.loadData();
      this.renderUI();
    } catch (error) {
      console.error('Error dismissing alarm:', error);
    }
  }

  async dismissAllAlarms() {
    const promises = this.activeAlarms.map(alarm => this.dismissAlarm(alarm.id));
    await Promise.all(promises);
  }

  async snoozeAllAlarms() {
    const promises = this.activeAlarms.map(alarm => 
      this.snoozeAlarm(alarm.id, this.settings.defaultSnoozeTime)
    );
    await Promise.all(promises);
  }

  async addMonitoredSite() {
    const input = document.getElementById('newSiteInput');
    const domain = input.value.trim().toLowerCase();

    if (!domain) return;

    // Basic domain validation
    if (!this.isValidDomain(domain)) {
      alert('Please enter a valid domain (e.g., example.com)');
      return;
    }

    // Check if already exists
    if (this.settings.monitoredSites.includes(domain)) {
      alert('This site is already being monitored');
      return;
    }

    // Add to settings
    this.settings.monitoredSites.push(domain);
    
    try {
      await browser.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: { monitoredSites: this.settings.monitoredSites }
      });
      
      input.value = '';
      this.renderMonitoredSites();
    } catch (error) {
      console.error('Error adding site:', error);
    }
  }

  async removeMonitoredSite(domain) {
    this.settings.monitoredSites = this.settings.monitoredSites.filter(site => site !== domain);
    
    try {
      await browser.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: { monitoredSites: this.settings.monitoredSites }
      });
      
      this.renderMonitoredSites();
    } catch (error) {
      console.error('Error removing site:', error);
    }
  }

  isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domain);
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  startPeriodicUpdate() {
    // Update every 5 seconds
    setInterval(async () => {
      await this.loadData();
      this.renderUI();
    }, 5000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
