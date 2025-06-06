# Setup Guide for Notification Alarm Extension

## Quick Start

1. **Generate Icons** (Required)
   - Open `create-icons.html` in your browser
   - Download the generated icon files
   - Move them to the `icons/` directory

2. **Add Sound Files** (Optional but Recommended)
   - Add audio files to the `sounds/` directory:
     - `default-alarm.mp3`
     - `beep.mp3` 
     - `siren.mp3`
     - `bell.mp3`
   - See `sounds/README.md` for requirements and resources

3. **Load Extension in Firefox**
   - Open Firefox
   - Navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select `manifest.json` from this directory

## Testing the Extension

### 1. Basic Setup Test
1. Load the extension (see step 3 above)
2. Click the extension icon in the toolbar
3. Verify the popup opens without errors

### 2. Add a Test Website
1. In the popup, add a test domain (e.g., `example.com`)
2. Go to the settings page (click ⚙️ button)
3. Verify the site appears in the monitored list

### 3. Test Alarm Functionality
1. In the settings page, click "🔊 Test Alarm"
2. Check that an alarm appears in the popup
3. Test snooze and dismiss functionality

### 4. Test Notification Detection
1. Visit a website that shows notifications (e.g., Gmail, Slack, Discord)
2. Add that domain to your monitored sites
3. Trigger a notification on that site
4. Verify it gets converted to an alarm

## Common Issues and Solutions

### Extension Won't Load
- **Check manifest.json**: Ensure no syntax errors
- **Verify file paths**: All referenced files must exist
- **Check Firefox version**: Requires Firefox 57+
- **Console errors**: Check browser console for error messages

### Icons Not Showing
- Generate icons using `create-icons.html`
- Ensure icon files are in `icons/` directory
- Check file names match manifest.json exactly

### Sounds Not Playing
- Add audio files to `sounds/` directory
- Check audio file formats (MP3, WAV, OGG supported)
- Verify browser audio permissions
- Test with `create-test-sounds.html`

### Notifications Not Detected
- Ensure website is added to monitored sites
- Check that the website actually sends notifications
- Enable debug mode in settings for detailed logging
- Some sites may use custom notification systems

## Development Setup

### File Structure Check
Ensure you have all required files:
```
notification-alarm/
├── manifest.json ✓
├── background.js ✓
├── content.js ✓
├── popup.html ✓
├── popup.js ✓
├── popup.css ✓
├── options.html ✓
├── options.js ✓
├── options.css ✓
├── icons/
│   ├── icon-16.png (generate with create-icons.html)
│   ├── icon-48.png (generate with create-icons.html)
│   └── icon-128.png (generate with create-icons.html)
├── sounds/
│   ├── default-alarm.mp3 (optional)
│   ├── beep.mp3 (optional)
│   ├── siren.mp3 (optional)
│   └── bell.mp3 (optional)
└── README.md ✓
```

### Debug Mode
1. Open extension settings
2. Enable "Debug Mode"
3. Check browser console for detailed logs
4. Monitor background script activity

### Testing Different Websites
Good test sites for notifications:
- **Gmail**: Email notifications
- **Slack**: Message notifications  
- **Discord**: Chat notifications
- **GitHub**: Activity notifications
- **Twitter**: Tweet notifications

## Advanced Configuration

### Custom Notification Selectors
Edit `content.js` to add custom selectors for specific websites:
```javascript
const notificationSelectors = [
  '.notification',
  '.toast',
  '.alert',
  '.your-custom-selector' // Add your own
];
```

### Custom Sound Integration
1. Add your audio file to `sounds/` directory
2. Update the dropdown in `options.html`
3. Modify sound loading in `content.js`

### Manifest V3 Migration (Future)
For Chrome compatibility, the extension will need updates:
- Convert to service worker
- Update API calls
- Modify permissions structure

## Troubleshooting Commands

### Check Extension Status
```javascript
// In browser console
browser.runtime.sendMessage({type: 'GET_SETTINGS'})
  .then(response => console.log('Settings:', response));
```

### Test Notification Detection
```javascript
// In website console
new Notification('Test', {body: 'This is a test notification'});
```

### Clear Extension Data
```javascript
// In browser console
browser.storage.sync.clear();
```

## Support

If you encounter issues:
1. Check this setup guide
2. Enable debug mode
3. Check browser console for errors
4. Verify all files are present and correctly named
5. Test with a fresh Firefox profile

For development questions, refer to:
- [Firefox Extension Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Web APIs Documentation](https://developer.mozilla.org/en-US/docs/Web/API)
- Browser console error messages
