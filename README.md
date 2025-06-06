# Notification Alarm Firefox Extension

A Firefox extension that converts website notifications into persistent alarms with snooze functionality.

## Features

- **Website Notification Interception**: Monitor notifications from specific websites
- **Persistent Alarms**: Convert notifications to continuous alarms that ring until dismissed or snoozed
- **Custom/Default Sounds**: Choose from built-in alarm sounds or upload your own
- **Snooze Functionality**: Configurable snooze duration (1-60 minutes)
- **Website Management**: Add/remove websites to monitor
- **Alarm Duration Control**: Set how long alarms ring before auto-dismissing

## Installation

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from this directory

## Usage

### Adding Monitored Websites

1. Click the extension icon in the toolbar
2. In the "Monitored Sites" section, enter a domain (e.g., `example.com`)
3. Click "Add Site"

### Managing Active Alarms

1. Click the extension icon to open the popup
2. View active alarms in the "Active Alarms" section
3. Use the snooze (😴) or dismiss (✖️) buttons for individual alarms
4. Use "Dismiss All" or "Snooze All" for bulk actions

### Configuring Settings

1. Click the settings (⚙️) button in the popup, or
2. Go to Firefox Add-ons Manager → Notification Alarm → Preferences

#### Available Settings:

- **Alarm Duration**: How long alarms ring (5-300 seconds)
- **Snooze Time**: Default snooze duration (1-60 minutes)
- **Alarm Volume**: Volume level for alarm sounds
- **Alarm Sound**: Choose from default sounds or upload custom audio
- **Notification Detection**: Configure what types of notifications to intercept
- **Advanced Options**: Maximum active alarms, persistence settings, debug mode

## How It Works

1. **Detection**: The extension monitors websites you've added to the monitored list
2. **Interception**: When a notification is detected from a monitored site, it's intercepted
3. **Conversion**: The notification is converted into a persistent alarm
4. **Alert**: The alarm plays continuously until you snooze or dismiss it
5. **Management**: Use the popup interface to manage active alarms

## File Structure

```
notification-alarm/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── content.js            # Content script for notification detection
├── popup.html            # Main popup interface
├── popup.js              # Popup functionality
├── popup.css             # Popup styling
├── options.html          # Settings page
├── options.js            # Settings functionality
├── options.css           # Settings styling
├── icons/                # Extension icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── sounds/               # Alarm sound files
│   ├── default-alarm.mp3
│   ├── beep.mp3
│   ├── siren.mp3
│   └── bell.mp3
└── README.md
```

## Technical Details

### APIs Used

- `notifications`: For creating and managing browser notifications
- `storage`: For saving user preferences and settings
- `alarms`: For scheduling snooze functionality
- `tabs`: For monitoring website activity
- `activeTab`: For accessing current tab information

### Browser Compatibility

- Firefox 57+ (Manifest V2)
- Chrome/Edge (with minor modifications for Manifest V3)

## Development

### Adding New Alarm Sounds

1. Add audio files (MP3, WAV, OGG) to the `sounds/` directory
2. Update the sound selection dropdown in `options.html`
3. Modify the sound loading logic in `content.js`

### Customizing Notification Detection

The extension detects notifications through:

1. **Browser Notification API**: Intercepts `new Notification()` calls
2. **DOM Monitoring**: Watches for notification elements with common selectors:
   - `.notification`, `.toast`, `.alert`
   - `.popup-notification`, `[role="alert"]`
   - `.snackbar`

### Debugging

Enable debug mode in settings to see detailed console logs for:
- Notification detection events
- Alarm creation and management
- Settings changes
- Error conditions

## Troubleshooting

### Alarms Not Playing
- Check browser audio permissions
- Verify alarm volume settings
- Test with different alarm sounds
- Check if site is in monitored list

### Notifications Not Detected
- Ensure the website is added to monitored sites
- Check if notification detection is enabled in settings
- Verify the website actually sends notifications
- Enable debug mode for detailed logging

### Extension Not Loading
- Check Firefox version compatibility (57+)
- Verify all files are present
- Check browser console for error messages
- Try reloading the extension

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. See the repository for license details.

## Support

For issues, feature requests, or questions, please use the GitHub issue tracker.
