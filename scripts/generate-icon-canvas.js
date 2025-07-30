#!/usr/bin/env node

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Check if canvas is installed
try {
  require.resolve('canvas');
} catch (e) {
  console.log('Canvas not installed. Please run: npm install canvas');
  process.exit(1);
}

function generateTennisIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background with rounded corners
  const radius = size * 0.22; // ~22% corner radius
  ctx.fillStyle = '#007AFF';
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // Tennis ball
  const centerX = size / 2;
  const centerY = size / 2;
  const ballRadius = size * 0.23;

  // Ball shadow
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(centerX + ballRadius * 0.08, centerY + ballRadius * 1.2, ballRadius * 0.8, ballRadius * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Main ball
  ctx.fillStyle = '#CCFF00';
  ctx.strokeStyle = '#B8E600';
  ctx.lineWidth = size * 0.008;
  ctx.beginPath();
  ctx.arc(centerX, centerY, ballRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tennis ball seams
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = size * 0.016;
  ctx.lineCap = 'round';

  // Left seam
  ctx.beginPath();
  ctx.moveTo(centerX - ballRadius, centerY);
  ctx.bezierCurveTo(
    centerX - ballRadius * 0.5, centerY - ballRadius * 0.5,
    centerX + ballRadius * 0.5, centerY - ballRadius * 0.5,
    centerX + ballRadius, centerY
  );
  ctx.stroke();

  // Right seam
  ctx.beginPath();
  ctx.moveTo(centerX - ballRadius, centerY);
  ctx.bezierCurveTo(
    centerX - ballRadius * 0.5, centerY + ballRadius * 0.5,
    centerX + ballRadius * 0.5, centerY + ballRadius * 0.5,
    centerX + ballRadius, centerY
  );
  ctx.stroke();

  // Highlight
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.ellipse(centerX - ballRadius * 0.3, centerY - ballRadius * 0.4, ballRadius * 0.4, ballRadius * 0.6, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Generated ${path.basename(outputPath)} (${size}x${size})`);
}

// Generate all required icons
const assetsPath = path.join(__dirname, '../assets/images');

generateTennisIcon(1024, path.join(assetsPath, 'icon.png'));
generateTennisIcon(1024, path.join(assetsPath, 'adaptive-icon.png'));
generateTennisIcon(512, path.join(assetsPath, 'splash-icon.png'));
generateTennisIcon(96, path.join(assetsPath, 'notification-icon.png'));

console.log('\n🎾 All tennis-themed app icons generated successfully!');