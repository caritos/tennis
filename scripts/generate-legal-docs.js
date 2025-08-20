#!/usr/bin/env node
/**
 * Generate Legal Document Markdowns from structured data
 * This script converts privacy policy and terms of service JSON into markdown format
 */

const fs = require('fs');
const path = require('path');

// Generate markdown from structured legal document data
function generateMarkdown(data) {
  let markdown = `# ${data.title}\n\n`;
  markdown += `**Effective Date: ${data.effectiveDate}**\n\n`;
  
  // Add sections
  data.sections.forEach(section => {
    markdown += `## ${section.title}\n\n`;
    
    if (section.content) {
      markdown += `${section.content}\n\n`;
    }
    
    // Add items if present
    if (section.items) {
      section.items.forEach(item => {
        // Check if item starts with ** for bold formatting
        if (item.includes('**') && item.includes(':')) {
          markdown += `- ${item}\n`;
        } else {
          markdown += `- ${item}\n`;
        }
      });
      markdown += '\n';
    }
    
    // Add subsections if present
    if (section.subsections) {
      section.subsections.forEach(subsection => {
        markdown += `### ${subsection.title}\n\n`;
        
        if (subsection.content) {
          markdown += `${subsection.content}\n\n`;
        }
        
        if (subsection.items) {
          subsection.items.forEach(item => {
            markdown += `- ${item}\n`;
          });
          markdown += '\n';
        }
        
        if (subsection.note) {
          markdown += `*${subsection.note}*\n\n`;
        }
      });
    }
    
    if (section.note) {
      markdown += `*${section.note}*\n\n`;
    }
  });
  
  // Add footer
  markdown += `---\n\n`;
  markdown += `*This ${data.title} is effective as of the date listed above and applies to all users of the ${data.appName} application.*\n`;
  
  return markdown;
}

// Generate HTML version for privacy policy (for App Store)
function generateHTML(data) {
  if (data.title !== 'Privacy Policy') return null;
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - ${data.appName}: Tennis Community</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #2c5aa0;
            border-bottom: 2px solid #2c5aa0;
            padding-bottom: 10px;
        }
        h2 {
            color: #2c5aa0;
            margin-top: 30px;
        }
        h3 {
            color: #4a4a4a;
        }
        .effective-date {
            background: #f5f5f5;
            padding: 10px 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
        }
        ul {
            padding-left: 25px;
        }
        li {
            margin-bottom: 8px;
        }
        strong {
            color: #2c5aa0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-style: italic;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>${data.title}</h1>
    
    <div class="effective-date">
        Effective Date: ${data.effectiveDate}
    </div>
`;

  // Add sections
  data.sections.forEach(section => {
    html += `    <h2>${section.title}</h2>\n`;
    
    if (section.content) {
      html += `    <p>${section.content}</p>\n`;
    }
    
    if (section.items) {
      html += `    <ul>\n`;
      section.items.forEach(item => {
        // Convert markdown bold to HTML
        const htmlItem = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html += `        <li>${htmlItem}</li>\n`;
      });
      html += `    </ul>\n`;
    }
    
    if (section.subsections) {
      section.subsections.forEach(subsection => {
        html += `    <h3>${subsection.title}</h3>\n`;
        
        if (subsection.content) {
          html += `    <p>${subsection.content}</p>\n`;
        }
        
        if (subsection.items) {
          html += `    <ul>\n`;
          subsection.items.forEach(item => {
            const htmlItem = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html += `        <li>${htmlItem}</li>\n`;
          });
          html += `    </ul>\n`;
        }
        
        if (subsection.note) {
          html += `    <p><em>${subsection.note}</em></p>\n`;
        }
      });
    }
    
    if (section.note) {
      html += `    <p><em>${section.note}</em></p>\n`;
    }
    
    html += `\n`;
  });
  
  html += `    <div class="footer">
        <p>This ${data.title} is effective as of the date listed above and applies to all users of the ${data.appName} application.</p>
    </div>
</body>
</html>`;

  return html;
}

// Process Privacy Policy
console.log('📋 Generating Privacy Policy...');
const privacyDataPath = path.join(__dirname, '../data/privacy-policy.json');
const privacyData = JSON.parse(fs.readFileSync(privacyDataPath, 'utf8'));

const privacyMarkdown = generateMarkdown(privacyData);
fs.writeFileSync(path.join(__dirname, '../docs/wiki/Privacy-Policy.md'), privacyMarkdown, 'utf8');

const privacyHTML = generateHTML(privacyData);
if (privacyHTML) {
  fs.writeFileSync(path.join(__dirname, '../docs/privacy-policy.html'), privacyHTML, 'utf8');
}

// Process Terms of Service
console.log('📋 Generating Terms of Service...');
const termsDataPath = path.join(__dirname, '../data/terms-of-service.json');
const termsData = JSON.parse(fs.readFileSync(termsDataPath, 'utf8'));

const termsMarkdown = generateMarkdown(termsData);
fs.writeFileSync(path.join(__dirname, '../docs/wiki/Terms-of-Service.md'), termsMarkdown, 'utf8');
fs.writeFileSync(path.join(__dirname, '../docs/terms-of-service.md'), termsMarkdown, 'utf8');

console.log('✅ Legal documents generated successfully!');
console.log('📊 Generated files:');
console.log('   - docs/wiki/Privacy-Policy.md (wiki)');
console.log('   - docs/privacy-policy.html (HTML for App Store)');
console.log('   - docs/wiki/Terms-of-Service.md (wiki)');
console.log('   - docs/terms-of-service.md (root for sync)');

const privacyStats = {
  sections: privacyData.sections.length,
  size: Math.round(privacyMarkdown.length / 1024)
};

const termsStats = {
  sections: termsData.sections.length,
  size: Math.round(termsMarkdown.length / 1024)
};

console.log(`📈 Privacy Policy: ${privacyStats.sections} sections, ${privacyStats.size}KB`);
console.log(`📈 Terms of Service: ${termsStats.sections} sections, ${termsStats.size}KB`);