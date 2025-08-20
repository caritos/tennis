#!/usr/bin/env node
/**
 * Generate Wiki FAQ Markdown from shared FAQ data
 * This script converts the structured FAQ JSON into markdown format for the GitHub wiki
 */

const fs = require('fs');
const path = require('path');

// Load the shared FAQ data
const faqDataPath = path.join(__dirname, '../data/faq.json');
const faqData = JSON.parse(fs.readFileSync(faqDataPath, 'utf8'));

// Generate markdown content
function generateWikiFAQ(data) {
  let markdown = `# ${data.title}\n\n`;
  
  if (data.description) {
    markdown += `${data.description}\n\n`;
  }
  
  // Add table of contents
  markdown += `## Table of Contents\n\n`;
  data.categories.forEach((category, index) => {
    const anchor = category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    markdown += `${index + 1}. [${category.name}](#${anchor})\n`;
  });
  markdown += '\n';
  
  // Add each category
  data.categories.forEach((category) => {
    const anchor = category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    markdown += `## ${category.name}\n\n`;
    
    category.questions.forEach((item) => {
      markdown += `### ${item.question}\n\n`;
      // Convert newlines and bullet points for better markdown formatting
      const formattedAnswer = item.answer
        .replace(/\n•/g, '\n-') // Convert • to markdown bullets
        .replace(/\n\*/g, '\n-') // Convert * to markdown bullets  
        .replace(/\*\*(.*?)\*\*/g, '**$1**') // Ensure bold formatting
        .replace(/\n/g, '\n\n'); // Add spacing between paragraphs
      
      markdown += `${formattedAnswer}\n\n`;
    });
  });
  
  // Add footer
  markdown += `---\n\n`;
  markdown += `*For additional help, contact support@caritos.com or visit our [GitHub Issues](https://github.com/caritos/tennis/issues)*\n`;
  
  return markdown;
}

// Generate the FAQ markdown
const wikiMarkdown = generateWikiFAQ(faqData);

// Write to the wiki directory
const outputPath = path.join(__dirname, '../docs/wiki/FAQ.md');
fs.writeFileSync(outputPath, wikiMarkdown, 'utf8');

console.log('✅ Wiki FAQ generated successfully at:', outputPath);
console.log('📊 Generated content:');
console.log(`   - ${faqData.categories.length} categories`);

const totalQuestions = faqData.categories.reduce((sum, category) => sum + category.questions.length, 0);
console.log(`   - ${totalQuestions} questions`);
console.log(`   - ${Math.round(wikiMarkdown.length / 1024)}KB of content`);