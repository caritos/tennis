#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateAppIcon() {
  const svgPath = path.join(__dirname, '../assets/images/tennis-icon.svg');
  const outputPath = path.join(__dirname, '../assets/images/icon.png');
  const adaptiveIconPath = path.join(__dirname, '../assets/images/adaptive-icon.png');
  const splashIconPath = path.join(__dirname, '../assets/images/splash-icon.png');

  try {
    // Check if sharp is installed
    try {
      require.resolve('sharp');
    } catch (e) {
      console.log('Installing sharp...');
      require('child_process').execSync('npm install sharp', { stdio: 'inherit' });
    }

    // Read SVG
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate main icon (1024x1024)
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile(outputPath);
    console.log('✅ Generated icon.png (1024x1024)');

    // Generate adaptive icon (1024x1024)
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile(adaptiveIconPath);
    console.log('✅ Generated adaptive-icon.png (1024x1024)');

    // Generate splash icon (smaller for splash screen)
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(splashIconPath);
    console.log('✅ Generated splash-icon.png (512x512)');

    // Also create notification icon
    const notificationIconPath = path.join(__dirname, '../assets/images/notification-icon.png');
    await sharp(svgBuffer)
      .resize(96, 96)
      .png()
      .toFile(notificationIconPath);
    console.log('✅ Generated notification-icon.png (96x96)');

    console.log('\n🎾 All tennis-themed app icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    
    // Fallback: try using ImageMagick if available
    console.log('\nTrying ImageMagick as fallback...');
    try {
      const { execSync } = require('child_process');
      execSync(`convert ${svgPath} -resize 1024x1024 ${outputPath}`);
      execSync(`convert ${svgPath} -resize 1024x1024 ${adaptiveIconPath}`);
      execSync(`convert ${svgPath} -resize 512x512 ${splashIconPath}`);
      execSync(`convert ${svgPath} -resize 96x96 ${path.join(__dirname, '../assets/images/notification-icon.png')}`);
      console.log('✅ Icons generated using ImageMagick');
    } catch (e) {
      console.error('Failed to generate icons. Please install either sharp (npm install sharp) or ImageMagick');
    }
  }
}

generateAppIcon();