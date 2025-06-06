// Simple icon generator for the extension
const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#dc3545';
    ctx.fillRect(0, 0, size, size);
    
    // Alarm icon (simplified)
    ctx.fillStyle = '#ffffff';
    ctx.font = `${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚨', size / 2, size / 2);
    
    return canvas.toBuffer('image/png');
}

// Create icons directory if it doesn't exist
if (!fs.existsSync('icons')) {
    fs.mkdirSync('icons');
}

// Generate icons
const sizes = [16, 48, 128];
sizes.forEach(size => {
    const buffer = createIcon(size);
    fs.writeFileSync(`icons/icon-${size}.png`, buffer);
    console.log(`Created icon-${size}.png`);
});

console.log('Icons created successfully!');
