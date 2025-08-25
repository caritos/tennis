#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const INTERVAL = 5 * 60 * 1000; // Run every 5 minutes
const LOG_FILE = path.join(process.cwd(), 'logs', 'test-monitor.log');
const RESULTS_FILE = path.join(process.cwd(), 'logs', 'test-results.json');

// Ensure logs directory exists
if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

function saveResults(results) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
}

async function runCommand(command, args = []) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const child = spawn(command, args, { 
      shell: true,
      stdio: 'pipe'
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      resolve({
        command: `${command} ${args.join(' ')}`,
        code,
        stdout,
        stderr,
        duration,
        success: code === 0,
        timestamp: new Date().toISOString()
      });
    });
  });
}

async function runTestSuite() {
  log('Starting test suite run...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: []
    }
  };

  // Run lint check
  log('Running ESLint...');
  const lintResult = await runCommand('npm', ['run', 'lint']);
  results.tests.lint = {
    success: lintResult.success,
    duration: lintResult.duration,
    errors: lintResult.success ? [] : lintResult.stdout.match(/error/gi) || []
  };
  results.summary.total++;
  if (lintResult.success) {
    results.summary.passed++;
    log('✅ Lint check passed');
  } else {
    results.summary.failed++;
    log(`❌ Lint check failed with ${results.tests.lint.errors.length} errors`);
    results.summary.warnings.push('Lint errors detected - code quality issues present');
  }

  // Run type checking
  log('Running TypeScript type check...');
  const typeResult = await runCommand('npm', ['run', 'type-check']);
  results.tests.typeCheck = {
    success: typeResult.success,
    duration: typeResult.duration,
    errors: typeResult.success ? [] : typeResult.stdout.match(/error TS\d+/gi) || []
  };
  results.summary.total++;
  if (typeResult.success) {
    results.summary.passed++;
    log('✅ Type check passed');
  } else {
    results.summary.failed++;
    log(`❌ Type check failed with ${results.tests.typeCheck.errors.length} errors`);
    results.summary.warnings.push('TypeScript errors detected - type safety compromised');
  }

  // Run unit tests
  log('Running unit tests...');
  const testResult = await runCommand('npm', ['run', 'test:unit', '--', '--silent']);
  const testMatches = testResult.stdout.match(/Tests:\s+(\d+)\s+passed.*?(\d+)\s+total/);
  if (testMatches) {
    const passed = parseInt(testMatches[1]);
    const total = parseInt(testMatches[2]);
    results.tests.unit = {
      success: testResult.success,
      duration: testResult.duration,
      passed,
      total,
      failed: total - passed
    };
  } else {
    results.tests.unit = {
      success: testResult.success,
      duration: testResult.duration,
      error: 'Could not parse test results'
    };
  }
  results.summary.total++;
  if (testResult.success) {
    results.summary.passed++;
    log(`✅ Unit tests passed (${results.tests.unit.passed}/${results.tests.unit.total})`);
  } else {
    results.summary.failed++;
    log(`❌ Unit tests failed`);
    results.summary.warnings.push('Unit test failures detected - functionality may be broken');
  }

  // Check for common issues
  log('Checking for common issues...');
  
  // Check if package-lock.json is in sync
  const packageLockCheck = await runCommand('npm', ['ls', '--depth=0']);
  if (!packageLockCheck.success) {
    results.summary.warnings.push('package-lock.json may be out of sync - run npm install');
  }

  // Save results
  saveResults(results);
  
  // Generate summary
  const statusEmoji = results.summary.failed === 0 ? '✅' : '❌';
  log(`${statusEmoji} Test run complete: ${results.summary.passed}/${results.summary.total} passed`);
  
  if (results.summary.warnings.length > 0) {
    log('⚠️  Warnings:');
    results.summary.warnings.forEach(warning => log(`  - ${warning}`));
  }
  
  return results;
}

async function monitor() {
  log('🚀 Test monitor started');
  log(`Will run tests every ${INTERVAL / 1000 / 60} minutes`);
  log(`Logs: ${LOG_FILE}`);
  log(`Results: ${RESULTS_FILE}`);
  
  // Run initial test
  await runTestSuite();
  
  // Schedule regular runs
  setInterval(async () => {
    log('---');
    await runTestSuite();
  }, INTERVAL);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('Test monitor shutting down...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('Test monitor shutting down...');
    process.exit(0);
  });
}

// Start monitoring
monitor().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});