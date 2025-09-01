/**
 * Static Analysis Tool for React Hook Dependency Issues
 * 
 * This script detects:
 * 1. Circular dependencies in useCallback/useEffect
 * 2. Stale closures from missing dependencies
 * 3. Active polling patterns that should use realtime
 * 4. Memory leaks from missing cleanup
 */

const fs = require('fs');
const path = require('path');

// Patterns to detect problematic code
const PATTERNS = {
  // Circular dependency: function in its own dependency array
  CIRCULAR_DEPENDENCY: /(\w+)\s*=\s*useCallback.*\[.*\1.*\]|(\w+)\s*=\s*useMemo.*\[.*\2.*\]/g,
  
  // useEffect with function in dependency array that's defined in same component
  STALE_CLOSURE: /useEffect\([\s\S]*?\}, \[[\s\S]*?(\w+)[\s\S]*?\]\);[\s\S]*?const \1 = useCallback/g,
  
  // Active polling patterns
  ACTIVE_POLLING: /setInterval\(.*?\d+.*?\)|setTimeout.*refresh|poll.*\d+/gi,
  
  // Missing cleanup for subscriptions
  MISSING_CLEANUP: /\.subscribe\(|\.on\(/g,
  
  // Functions in dependency arrays
  FUNCTION_IN_DEPS: /}, \[.*?(\w+).*?\].*\);.*const \1 = /gs,
};

// Approved polling patterns (these are okay)
const APPROVED_POLLING = [
  'test', 'mock', 'retry', 'timeout', 'delay', 'debounce'
];

class DependencyAnalyzer {
  constructor() {
    this.issues = [];
    this.fileCount = 0;
    this.scannedFiles = [];
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    this.fileCount++;
    this.scannedFiles.push(relativePath);
    
    // Check for circular dependencies
    this.checkCircularDependencies(content, relativePath);
    
    // Check for stale closures
    this.checkStaleClosures(content, relativePath);
    
    // Check for active polling
    this.checkActivePolling(content, relativePath);
    
    // Check for missing cleanup
    this.checkMissingCleanup(content, relativePath);
  }

  checkCircularDependencies(content, filePath) {
    const lines = content.split('\n');
    
    // Look for useCallback/useMemo with function name in its own deps
    lines.forEach((line, index) => {
      const callbackMatch = line.match(/const\s+(\w+)\s*=\s*useCallback/);
      if (callbackMatch) {
        const functionName = callbackMatch[1];
        
        // Look for dependency array in next few lines
        for (let i = index; i < Math.min(index + 10, lines.length); i++) {
          const depLine = lines[i];
          if (depLine.includes(`[`) && depLine.includes(`]`)) {
            if (depLine.includes(functionName)) {
              this.addIssue({
                type: 'CIRCULAR_DEPENDENCY',
                file: filePath,
                line: i + 1,
                message: `Function '${functionName}' is in its own dependency array`,
                code: depLine.trim(),
                severity: 'error'
              });
            }
            break;
          }
        }
      }
    });
  }

  checkStaleClosures(content, filePath) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Look for useEffect with dependency array
      if (line.includes('useEffect') && line.includes('},')) {
        const nextLine = lines[index + 1];
        if (nextLine && nextLine.includes('[') && nextLine.includes(']')) {
          // Extract dependencies
          const depsMatch = nextLine.match(/\[(.*?)\]/);
          if (depsMatch) {
            const deps = depsMatch[1].split(',').map(d => d.trim().replace(/['"]/g, ''));
            
            // Check if any dependency is a function defined later
            deps.forEach(dep => {
              if (dep && dep.match(/^\w+$/)) { // Simple identifier
                for (let i = index + 2; i < Math.min(index + 50, lines.length); i++) {
                  if (lines[i].includes(`const ${dep} = useCallback`) || 
                      lines[i].includes(`const ${dep} = useMemo`)) {
                    this.addIssue({
                      type: 'STALE_CLOSURE',
                      file: filePath,
                      line: index + 2,
                      message: `Function '${dep}' in dependency array may create stale closure`,
                      code: nextLine.trim(),
                      severity: 'warning'
                    });
                  }
                }
              }
            });
          }
        }
      }
    });
  }

  checkActivePolling(content, filePath) {
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (PATTERNS.ACTIVE_POLLING.test(line)) {
        // Check if it's an approved pattern
        const isApproved = APPROVED_POLLING.some(pattern => 
          line.toLowerCase().includes(pattern)
        );
        
        if (!isApproved) {
          this.addIssue({
            type: 'ACTIVE_POLLING',
            file: filePath,
            line: index + 1,
            message: 'Active polling detected - consider using realtime subscriptions',
            code: line.trim(),
            severity: 'warning'
          });
        }
      }
    });
  }

  checkMissingCleanup(content, filePath) {
    // Only check React component files
    if (!filePath.match(/\.(tsx|jsx)$/) || 
        !content.includes('useEffect') ||
        filePath.includes('test') || 
        filePath.includes('script')) {
      return;
    }
    
    const lines = content.split('\n');
    let hasReactSubscription = false;
    let hasCleanup = false;
    let inUseEffect = false;
    
    lines.forEach((line, index) => {
      // Track if we're inside a useEffect
      if (line.includes('useEffect(')) {
        inUseEffect = true;
      }
      if (inUseEffect && line.includes('}')) {
        inUseEffect = false;
      }
      
      // Only look for subscriptions in useEffect
      if (inUseEffect && (line.includes('.subscribe(') || line.includes('supabase'))) {
        hasReactSubscription = true;
      }
      if (line.includes('unsubscribe()') || line.includes('removeChannel') || 
          line.includes('clearInterval') || line.includes('clearTimeout') ||
          line.includes('return () =>')) {
        hasCleanup = true;
      }
    });
    
    if (hasReactSubscription && !hasCleanup) {
      this.addIssue({
        type: 'MISSING_CLEANUP',
        file: filePath,
        line: 0,
        message: 'React subscription found but no cleanup detected in useEffect return',
        code: '',
        severity: 'warning'
      });
    }
  }

  addIssue(issue) {
    this.issues.push(issue);
  }

  generateReport() {
    console.log('🔍 DEPENDENCY ANALYSIS REPORT');
    console.log('============================');
    console.log(`📁 Files scanned: ${this.fileCount}`);
    console.log(`⚠️  Issues found: ${this.issues.length}\n`);

    if (this.issues.length === 0) {
      console.log('✅ No dependency issues found!');
      return true;
    }

    // Group issues by type
    const issuesByType = this.issues.reduce((acc, issue) => {
      if (!acc[issue.type]) acc[issue.type] = [];
      acc[issue.type].push(issue);
      return acc;
    }, {});

    Object.keys(issuesByType).forEach(type => {
      const issues = issuesByType[type];
      const icon = issues[0].severity === 'error' ? '❌' : '⚠️';
      
      console.log(`${icon} ${type.replace(/_/g, ' ')} (${issues.length})`);
      console.log('─'.repeat(50));
      
      issues.forEach(issue => {
        console.log(`📍 ${issue.file}:${issue.line}`);
        console.log(`   ${issue.message}`);
        if (issue.code) {
          console.log(`   Code: ${issue.code}`);
        }
        console.log('');
      });
    });

    // Return false if any errors found
    return !this.issues.some(issue => issue.severity === 'error');
  }
}

function scanDirectory(dir, analyzer) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .git, dist, build directories
      if (!['node_modules', '.git', 'dist', 'build', '.expo'].includes(file)) {
        scanDirectory(filePath, analyzer);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/) && !file.includes('.test.') && !file.includes('.spec.')) {
      analyzer.analyzeFile(filePath);
    }
  });
}

function main() {
  const analyzer = new DependencyAnalyzer();
  
  console.log('🚀 Starting dependency analysis...\n');
  
  // Scan all TypeScript/JavaScript files
  scanDirectory('.', analyzer);
  
  const success = analyzer.generateReport();
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('───────────────────');
  console.log('• Run this check in pre-commit hooks');
  console.log('• Add ESLint rules for automatic detection');
  console.log('• Use realtime subscriptions instead of polling');
  console.log('• Always clean up subscriptions in useEffect return\n');
  
  // Exit with error code if issues found
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { DependencyAnalyzer };