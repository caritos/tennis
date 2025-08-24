#!/usr/bin/env node

/**
 * Automated Testing Environment Setup
 * 
 * This script sets up a comprehensive automated testing environment that:
 * 1. Runs unit tests for contact sharing functionality
 * 2. Starts iOS simulator with development build
 * 3. Executes E2E tests for contact sharing system
 * 4. Monitors for changes and re-runs tests
 * 5. Generates test reports
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutomatedTestingEnvironment {
  constructor() {
    this.processes = [];
    this.testResults = {
      unit: null,
      e2e: null,
      contactSharing: null
    };
    this.isRunning = false;
  }

  log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
  }

  error(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.error(`[${timestamp}] ❌ ${message}`);
  }

  success(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ✅ ${message}`);
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'pipe',
        ...options
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
        if (options.logOutput) {
          console.log(data.toString().trim());
        }
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
        if (options.logOutput) {
          console.error(data.toString().trim());
        }
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      if (options.keepAlive) {
        this.processes.push(process);
      }
    });
  }

  async setupSimulator() {
    this.log('Setting up iOS Simulator...');
    
    try {
      // Check if simulator is already running
      const { stdout } = await this.runCommand('xcrun', ['simctl', 'list', 'devices', 'booted']);
      
      if (stdout.includes('iPhone')) {
        this.success('iOS Simulator already running');
        return;
      }

      // Boot iPhone 15 Pro simulator
      this.log('Booting iPhone 15 Pro simulator...');
      await this.runCommand('xcrun', ['simctl', 'boot', 'iPhone 15 Pro']);
      
      // Wait for simulator to be ready
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      this.success('iOS Simulator ready');
    } catch (error) {
      this.error(`Failed to setup simulator: ${error.message}`);
      throw error;
    }
  }

  async buildDevelopmentApp() {
    this.log('Building development app for iOS...');
    
    try {
      await this.runCommand('npx', ['expo', 'run:ios', '--device'], {
        logOutput: true,
        cwd: process.cwd()
      });
      
      this.success('Development build completed');
    } catch (error) {
      this.error(`Failed to build development app: ${error.message}`);
      throw error;
    }
  }

  async runUnitTests() {
    this.log('Running unit tests...');
    
    try {
      const result = await this.runCommand('npm', ['run', 'test:unit', '--', '--coverage'], {
        logOutput: true
      });
      
      this.testResults.unit = {
        passed: true,
        output: result.stdout,
        timestamp: new Date()
      };
      
      this.success('Unit tests passed');
      return true;
    } catch (error) {
      this.testResults.unit = {
        passed: false,
        error: error.message,
        timestamp: new Date()
      };
      
      this.error(`Unit tests failed: ${error.message}`);
      return false;
    }
  }

  async runContactSharingE2ETest() {
    this.log('Running contact sharing E2E test...');
    
    try {
      const result = await this.runCommand('maestro', ['test', 'tests/integration/flows/14-contact-sharing-system.yaml'], {
        logOutput: true
      });
      
      this.testResults.contactSharing = {
        passed: true,
        output: result.stdout,
        timestamp: new Date()
      };
      
      this.success('Contact sharing E2E test passed');
      return true;
    } catch (error) {
      this.testResults.contactSharing = {
        passed: false,
        error: error.message,
        timestamp: new Date()
      };
      
      this.error(`Contact sharing E2E test failed: ${error.message}`);
      return false;
    }
  }

  async runAllE2ETests() {
    this.log('Running all E2E tests...');
    
    try {
      const result = await this.runCommand('npm', ['run', 'e2e'], {
        logOutput: true
      });
      
      this.testResults.e2e = {
        passed: true,
        output: result.stdout,
        timestamp: new Date()
      };
      
      this.success('All E2E tests passed');
      return true;
    } catch (error) {
      this.testResults.e2e = {
        passed: false,
        error: error.message,
        timestamp: new Date()
      };
      
      this.error(`E2E tests failed: ${error.message}`);
      return false;
    }
  }

  generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        unit: this.testResults.unit?.passed || false,
        e2e: this.testResults.e2e?.passed || false,
        contactSharing: this.testResults.contactSharing?.passed || false
      },
      details: this.testResults
    };

    const reportPath = path.join(__dirname, '../tests/reports/automated-test-report.json');
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Test report generated: ${reportPath}`);
    return report;
  }

  async watchForChanges() {
    this.log('Setting up file watcher for automatic test re-runs...');
    
    const chokidar = require('chokidar');
    
    const watcher = chokidar.watch([
      'services/**/*.ts',
      'components/**/*.tsx', 
      'contexts/**/*.tsx',
      'tests/**/*.ts'
    ], {
      ignored: /node_modules/,
      persistent: true
    });

    let debounceTimeout;

    watcher.on('change', (filePath) => {
      this.log(`File changed: ${filePath}`);
      
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(async () => {
        if (filePath.includes('services/challengeService') || 
            filePath.includes('ContactSharingNotification')) {
          this.log('Contact sharing related file changed, running focused tests...');
          await this.runContactSharingTests();
        } else {
          this.log('Running quick unit tests...');
          await this.runUnitTests();
        }
      }, 2000);
    });

    this.log('File watcher active');
  }

  async runContactSharingTests() {
    this.log('Running focused contact sharing tests...');
    
    // Run specific unit tests
    await this.runCommand('npm', ['run', 'test:unit', '--', 'contactSharingService'], {
      logOutput: true
    });
    
    // Run contact sharing E2E test
    await this.runContactSharingE2ETest();
    
    this.generateTestReport();
  }

  async cleanup() {
    this.log('Cleaning up processes...');
    
    this.processes.forEach(process => {
      if (!process.killed) {
        process.kill();
      }
    });

    this.processes = [];
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      this.log('Testing environment already running');
      return;
    }

    this.isRunning = true;
    this.log('Starting automated testing environment...');

    try {
      // 1. Setup simulator
      await this.setupSimulator();
      
      // 2. Build development app
      this.log('Skipping build (assuming app is already built)...');
      
      // 3. Run initial test suite
      this.log('Running initial test suite...');
      
      const unitTestsPass = await this.runUnitTests();
      
      if (unitTestsPass) {
        // 4. Run contact sharing specific tests
        await this.runContactSharingE2ETest();
        
        // 5. Run full E2E suite if contact sharing passes
        if (this.testResults.contactSharing?.passed) {
          await this.runAllE2ETests();
        }
      }
      
      // 6. Generate initial report
      const report = this.generateTestReport();
      
      // 7. Setup file watcher for continuous testing
      await this.watchForChanges();
      
      this.success('Automated testing environment is ready!');
      this.log('Summary:');
      this.log(`  Unit Tests: ${report.summary.unit ? '✅' : '❌'}`);
      this.log(`  Contact Sharing: ${report.summary.contactSharing ? '✅' : '❌'}`);
      this.log(`  E2E Tests: ${report.summary.e2e ? '✅' : '❌'}`);
      
      // Keep process alive
      process.on('SIGINT', async () => {
        await this.cleanup();
        process.exit(0);
      });
      
    } catch (error) {
      this.error(`Failed to start testing environment: ${error.message}`);
      await this.cleanup();
      throw error;
    }
  }

  // Quick test command for specific functionality
  async testContactSharing() {
    this.log('Testing contact sharing functionality only...');
    
    await this.runUnitTests();
    await this.runContactSharingE2ETest();
    
    const report = this.generateTestReport();
    
    console.log('\n=== CONTACT SHARING TEST RESULTS ===');
    console.log(`Unit Tests: ${report.summary.unit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`E2E Tests: ${report.summary.contactSharing ? '✅ PASS' : '❌ FAIL'}`);
    
    if (report.summary.unit && report.summary.contactSharing) {
      console.log('\n🎉 Contact sharing system is working correctly!');
    } else {
      console.log('\n⚠️  Contact sharing system needs attention.');
      console.log('Check the test report for details.');
    }
  }
}

// CLI Interface
if (require.main === module) {
  const testEnv = new AutomatedTestingEnvironment();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      testEnv.start().catch(console.error);
      break;
      
    case 'contact-sharing':
      testEnv.testContactSharing().catch(console.error);
      break;
      
    case 'report':
      const reportPath = path.join(__dirname, '../tests/reports/automated-test-report.json');
      if (fs.existsSync(reportPath)) {
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        console.log(JSON.stringify(report, null, 2));
      } else {
        console.log('No test report found');
      }
      break;
      
    default:
      console.log('Usage:');
      console.log('  node scripts/automated-testing.js start          # Start full testing environment');
      console.log('  node scripts/automated-testing.js contact-sharing # Test contact sharing only');
      console.log('  node scripts/automated-testing.js report          # Show latest test report');
  }
}

module.exports = AutomatedTestingEnvironment;