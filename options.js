// Options page script for Notification Alarm Extension
class OptionsManager {
  constructor() {
    this.settings = {
      monitoredSites: [],
      defaultAlarmDuration: 30,
      defaultSnoozeTime: 5,
      alarmSound: 'default',
      volume: 0.8,
      interceptBrowserNotifications: true,
      detectPageNotifications: true,
      notificationKeywords: [],
      maxActiveAlarms: 5,
      persistAcrossSessions: true,
      showDesktopNotifications: true,
      debugMode: false
    };
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.populateForm();
    this.renderSites();
  }

  async loadSettings() {
    try {
      const response = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response.settings) {
        this.settings = { ...this.settings, ...response.settings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    try {
      await browser.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: this.settings
      });
      this.showStatus('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }

  setupEventListeners() {
    // Form inputs
    document.getElementById('alarmDuration').addEventListener('change', (e) => {
      this.settings.defaultAlarmDuration = parseInt(e.target.value);
    });

    document.getElementById('snoozeTime').addEventListener('change', (e) => {
      this.settings.defaultSnoozeTime = parseInt(e.target.value);
    });

    document.getElementById('volume').addEventListener('input', (e) => {
      this.settings.volume = parseFloat(e.target.value);
      document.getElementById('volumeValue').textContent = Math.round(e.target.value * 100) + '%';
    });

    document.getElementById('alarmSound').addEventListener('change', (e) => {
      this.settings.alarmSound = e.target.value;
      const customSection = document.getElementById('customSoundSection');
      customSection.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });

    document.getElementById('interceptBrowserNotifications').addEventListener('change', (e) => {
      this.settings.interceptBrowserNotifications = e.target.checked;
    });

    document.getElementById('detectPageNotifications').addEventListener('change', (e) => {
      this.settings.detectPageNotifications = e.target.checked;
    });

    document.getElementById('notificationKeywords').addEventListener('change', (e) => {
      this.settings.notificationKeywords = e.target.value
        .split('\n')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
    });

    document.getElementById('maxActiveAlarms').addEventListener('change', (e) => {
      this.settings.maxActiveAlarms = parseInt(e.target.value);
    });

    document.getElementById('persistAcrossSessions').addEventListener('change', (e) => {
      this.settings.persistAcrossSessions = e.target.checked;
    });

    document.getElementById('showDesktopNotifications').addEventListener('change', (e) => {
      this.settings.showDesktopNotifications = e.target.checked;
    });

    document.getElementById('debugMode').addEventListener('change', (e) => {
      this.settings.debugMode = e.target.checked;
    });

    // Site management
    document.getElementById('addSiteBtn').addEventListener('click', () => {
      this.addSite();
    });

    document.getElementById('newSiteInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addSite();
      }
    });

    // Action buttons
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetToDefaults();
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportSettings();
    });

    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', (e) => {
      this.importSettings(e.target.files[0]);
    });

    document.getElementById('testAlarmBtn').addEventListener('click', () => {
      this.testAlarm();
    });
  }

  populateForm() {
    document.getElementById('alarmDuration').value = this.settings.defaultAlarmDuration;
    document.getElementById('snoozeTime').value = this.settings.defaultSnoozeTime;
    document.getElementById('volume').value = this.settings.volume;
    document.getElementById('volumeValue').textContent = Math.round(this.settings.volume * 100) + '%';
    document.getElementById('alarmSound').value = this.settings.alarmSound;
    document.getElementById('interceptBrowserNotifications').checked = this.settings.interceptBrowserNotifications;
    document.getElementById('detectPageNotifications').checked = this.settings.detectPageNotifications;
    document.getElementById('notificationKeywords').value = this.settings.notificationKeywords.join('\n');
    document.getElementById('maxActiveAlarms').value = this.settings.maxActiveAlarms;
    document.getElementById('persistAcrossSessions').checked = this.settings.persistAcrossSessions;
    document.getElementById('showDesktopNotifications').checked = this.settings.showDesktopNotifications;
    document.getElementById('debugMode').checked = this.settings.debugMode;

    // Show custom sound section if needed
    const customSection = document.getElementById('customSoundSection');
    customSection.style.display = this.settings.alarmSound === 'custom' ? 'block' : 'none';
  }

  renderSites() {
    const container = document.getElementById('sitesList');
    const template = document.getElementById('siteTemplate');
    
    container.innerHTML = '';

    if (this.settings.monitoredSites.length === 0) {
      container.innerHTML = '<div class="no-sites">No sites configured. Add a site above to get started.</div>';
      return;
    }

    this.settings.monitoredSites.forEach(domain => {
      const siteElement = template.content.cloneNode(true);
      
      const siteItem = siteElement.querySelector('.site-item');
      siteItem.dataset.domain = domain;
      
      siteElement.querySelector('.site-domain').textContent = domain;
      
      // Remove button
      siteElement.querySelector('.remove-site-btn').addEventListener('click', () => {
        this.removeSite(domain);
      });

      container.appendChild(siteElement);
    });
  }

  addSite() {
    const input = document.getElementById('newSiteInput');
    const domain = input.value.trim().toLowerCase();

    if (!domain) return;

    if (!this.isValidDomain(domain)) {
      this.showStatus('Please enter a valid domain', 'error');
      return;
    }

    if (this.settings.monitoredSites.includes(domain)) {
      this.showStatus('This site is already being monitored', 'error');
      return;
    }

    this.settings.monitoredSites.push(domain);
    input.value = '';
    this.renderSites();
    this.showStatus(`Added ${domain} to monitored sites`, 'success');
  }

  removeSite(domain) {
    this.settings.monitoredSites = this.settings.monitoredSites.filter(site => site !== domain);
    this.renderSites();
    this.showStatus(`Removed ${domain} from monitored sites`, 'success');
  }

  isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domain);
  }

  resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      this.settings = {
        monitoredSites: [],
        defaultAlarmDuration: 30,
        defaultSnoozeTime: 5,
        alarmSound: 'default',
        volume: 0.8,
        interceptBrowserNotifications: true,
        detectPageNotifications: true,
        notificationKeywords: [],
        maxActiveAlarms: 5,
        persistAcrossSessions: true,
        showDesktopNotifications: true,
        debugMode: false
      };
      this.populateForm();
      this.renderSites();
      this.showStatus('Settings reset to defaults', 'success');
    }
  }

  exportSettings() {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'notification-alarm-settings.json';
    link.click();
    
    this.showStatus('Settings exported successfully', 'success');
  }

  async importSettings(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // Validate imported settings
      if (typeof importedSettings === 'object' && importedSettings !== null) {
        this.settings = { ...this.settings, ...importedSettings };
        this.populateForm();
        this.renderSites();
        this.showStatus('Settings imported successfully', 'success');
      } else {
        throw new Error('Invalid settings file format');
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      this.showStatus('Error importing settings: Invalid file format', 'error');
    }
  }

  testAlarm() {
    // Create a test notification to trigger the alarm system
    browser.runtime.sendMessage({
      type: 'NOTIFICATION_DETECTED',
      data: {
        title: 'Test Alarm',
        message: 'This is a test notification to verify your alarm settings.',
        timestamp: Date.now()
      }
    });
    
    this.showStatus('Test alarm triggered! Check your popup to manage it.', 'success');
  }

  showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = 'block';
    
    setTimeout(() => {
      statusElement.style.display = 'none';
    }, 3000);
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
