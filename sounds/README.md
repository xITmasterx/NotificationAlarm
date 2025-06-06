# Alarm Sounds

This directory contains the alarm sound files for the Notification Alarm extension.

## Required Sound Files

To complete the extension setup, you need to add the following sound files:

- `default-alarm.mp3` - Default alarm sound
- `beep.mp3` - Simple beep sound
- `siren.mp3` - Siren alarm sound
- `bell.mp3` - Bell alarm sound

## Sound Requirements

- **Format**: MP3, WAV, or OGG
- **Duration**: 2-10 seconds (will loop automatically)
- **Quality**: 44.1kHz, 16-bit recommended
- **Size**: Keep under 1MB per file for performance

## Adding Custom Sounds

1. Place your audio files in this directory
2. Update the sound selection in `options.html`
3. Modify the sound loading logic in `content.js` if needed

## Free Sound Resources

You can find free alarm sounds at:
- Freesound.org
- Zapsplat.com
- Adobe Audition (built-in sounds)
- YouTube Audio Library

## Creating Simple Sounds

For testing, you can create simple beep sounds using:
- Audacity (free audio editor)
- Online tone generators
- Browser Web Audio API (see create-test-sounds.html)

## Note

The extension will fall back to a system beep if sound files are missing or fail to load.
