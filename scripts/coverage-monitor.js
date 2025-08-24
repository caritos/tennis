#!/usr/bin/env node

/**
 * Comprehensive Test Coverage Monitor
 * 
 * This advanced coverage monitoring system:
 * 1. Tracks test coverage in real-time
 * 2. Monitors coverage trends and regressions
 * 3. Generates detailed coverage reports with visualizations
 * 4. Identifies untested code paths and suggests improvements
 * 5. Integrates with CI/CD for coverage gates
 * 6. Provides coverage-based test recommendations
 * 7. Monitors coverage quality metrics (not just quantity)
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const chokidar = require('chokidar');

class CoverageMonitor {
  constructor() {
    this.coverageData = {
      current: null,
      history: [],
      baseline: null,
      trends: {},
      quality: {}
    };
    
    this.thresholds = {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
      regression: 2 // Max allowed regression percentage
    };
    
    this.coverageFiles = [
      'coverage/coverage-final.json',
      'coverage/lcov-report/index.html',
      'coverage/clover.xml'
    ];
    
    this.isMonitoring = false;
    this.watchers = [];
    
    this.setupCoverageTracking();
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [COVERAGE] [${level}] ${message}`;
    console.log(logEntry);
  }

  success(message) {
    this.log(`✅ ${message}`, 'SUCCESS');
  }

  error(message) {
    this.log(`❌ ${message}`, 'ERROR');
  }

  warning(message) {
    this.log(`⚠️ ${message}`, 'WARNING');
  }

  setupCoverageTracking() {
    // Load historical coverage data if available
    this.loadCoverageHistory();
    
    // Set up baseline if not exists
    if (!this.coverageData.baseline) {
      this.setBaseline();
    }
  }

  loadCoverageHistory() {
    const historyPath = path.join(__dirname, '../tests/reports/coverage-history.json');
    
    if (fs.existsSync(historyPath)) {
      try {
        const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        this.coverageData.history = historyData.history || [];
        this.coverageData.baseline = historyData.baseline;
        this.log(`Loaded ${this.coverageData.history.length} historical coverage records`);
      } catch (error) {
        this.warning(`Failed to load coverage history: ${error.message}`);
      }
    }
  }

  saveCoverageHistory() {
    const historyPath = path.join(__dirname, '../tests/reports/coverage-history.json');
    const historyData = {
      baseline: this.coverageData.baseline,
      history: this.coverageData.history.slice(-100), // Keep last 100 records
      lastUpdated: new Date().toISOString()
    };
    
    // Ensure directory exists
    const dir = path.dirname(historyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(historyPath, JSON.stringify(historyData, null, 2));
  }

  async setBaseline() {
    this.log('Setting coverage baseline...');
    
    try {
      const coverage = await this.getCurrentCoverage();
      if (coverage) {
        this.coverageData.baseline = {
          ...coverage,
          timestamp: new Date().toISOString(),
          commit: await this.getCurrentCommit()
        };
        this.success('Coverage baseline set');
      }
    } catch (error) {
      this.warning(`Failed to set baseline: ${error.message}`);
    }
  }

  async getCurrentCommit() {
    try {
      const result = await this.runCommand('git', ['rev-parse', 'HEAD']);
      return result.stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => stdout += data);
      process.stderr.on('data', (data) => stderr += data);
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(stderr || `Command failed with code ${code}`));
        }
      });
    });
  }

  async runCoverageAnalysis() {
    this.log('🔍 Running comprehensive coverage analysis...');
    
    try {
      // Run tests with coverage
      const result = await this.runCommand('npm', ['test', '--', '--coverage', '--silent']);
      
      // Get current coverage data
      const coverage = await this.getCurrentCoverage();
      
      if (coverage) {
        this.coverageData.current = {
          ...coverage,
          timestamp: new Date().toISOString(),
          commit: await this.getCurrentCommit()
        };
        
        // Add to history
        this.coverageData.history.push(this.coverageData.current);
        
        // Analyze coverage
        await this.analyzeCoverage();
        
        // Generate reports
        await this.generateCoverageReports();
        
        // Save history
        this.saveCoverageHistory();
        
        this.success('Coverage analysis completed');
        return this.coverageData.current;
      }
    } catch (error) {
      this.error(`Coverage analysis failed: ${error.message}`);
      throw error;
    }
  }

  async getCurrentCoverage() {
    const coveragePath = path.join(process.cwd(), 'coverage/coverage-final.json');
    
    if (!fs.existsSync(coveragePath)) {
      this.warning('Coverage file not found, running tests first...');
      return null;
    }
    
    try {
      const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      
      // Calculate overall coverage metrics
      const totals = {
        statements: { covered: 0, total: 0 },
        branches: { covered: 0, total: 0 },
        functions: { covered: 0, total: 0 },
        lines: { covered: 0, total: 0 }
      };
      
      const fileDetails = {};
      
      for (const [filePath, fileData] of Object.entries(coverageData)) {
        // Skip test files and node_modules
        if (filePath.includes('node_modules') || filePath.includes('.test.') || filePath.includes('.spec.')) {
          continue;
        }
        
        const fileStats = this.calculateFileStats(fileData);
        fileDetails[filePath] = fileStats;
        
        // Add to totals
        Object.keys(totals).forEach(metric => {
          totals[metric].covered += fileStats[metric].covered;
          totals[metric].total += fileStats[metric].total;
        });
      }
      
      // Calculate percentages
      const percentages = {};
      Object.keys(totals).forEach(metric => {
        percentages[metric] = totals[metric].total > 0 
          ? (totals[metric].covered / totals[metric].total * 100) 
          : 100;
      });
      
      return {
        totals,
        percentages,
        fileDetails,
        summary: {
          totalFiles: Object.keys(fileDetails).length,
          averageCoverage: Object.values(percentages).reduce((a, b) => a + b) / 4
        }
      };
    } catch (error) {
      this.error(`Failed to parse coverage data: ${error.message}`);
      return null;
    }
  }

  calculateFileStats(fileData) {
    const stats = {
      statements: { covered: 0, total: 0 },
      branches: { covered: 0, total: 0 },
      functions: { covered: 0, total: 0 },
      lines: { covered: 0, total: 0 }
    };
    
    // Count statements
    if (fileData.s) {
      Object.values(fileData.s).forEach(count => {
        stats.statements.total++;
        if (count > 0) stats.statements.covered++;
      });
    }
    
    // Count branches
    if (fileData.b) {
      Object.values(fileData.b).forEach(branches => {
        branches.forEach(count => {
          stats.branches.total++;
          if (count > 0) stats.branches.covered++;
        });
      });
    }
    
    // Count functions
    if (fileData.f) {
      Object.values(fileData.f).forEach(count => {
        stats.functions.total++;
        if (count > 0) stats.functions.covered++;
      });
    }
    
    // Count lines (from statement map)
    if (fileData.statementMap) {
      const lines = new Set();
      Object.values(fileData.statementMap).forEach(stmt => {
        lines.add(stmt.start.line);
      });
      stats.lines.total = lines.size;
      
      const coveredLines = new Set();
      Object.entries(fileData.s || {}).forEach(([stmtId, count]) => {
        if (count > 0 && fileData.statementMap[stmtId]) {
          coveredLines.add(fileData.statementMap[stmtId].start.line);
        }
      });
      stats.lines.covered = coveredLines.size;
    }
    
    return stats;
  }

  async analyzeCoverage() {
    this.log('📊 Analyzing coverage data...');
    
    const current = this.coverageData.current;
    const baseline = this.coverageData.baseline;
    
    if (!current) {
      this.warning('No current coverage data to analyze');
      return;
    }
    
    // Analyze against thresholds
    const thresholdAnalysis = this.analyzeThresholds(current);
    
    // Analyze trends
    const trendAnalysis = this.analyzeTrends();
    
    // Analyze regressions
    const regressionAnalysis = baseline ? this.analyzeRegressions(current, baseline) : null;
    
    // Identify problem areas
    const problemAreas = this.identifyProblemAreas(current);
    
    // Quality analysis
    const qualityAnalysis = this.analyzeQuality(current);
    
    this.coverageData.analysis = {
      thresholds: thresholdAnalysis,
      trends: trendAnalysis,
      regressions: regressionAnalysis,
      problemAreas,
      quality: qualityAnalysis,
      timestamp: new Date().toISOString()
    };
    
    this.logAnalysisResults();
  }

  analyzeThresholds(coverage) {
    const results = {};
    
    Object.keys(this.thresholds).forEach(metric => {
      if (metric === 'regression') return;
      
      const actual = coverage.percentages[metric];
      const threshold = this.thresholds[metric];
      
      results[metric] = {
        actual: actual.toFixed(2),
        threshold,
        passed: actual >= threshold,
        gap: Math.max(0, threshold - actual).toFixed(2)
      };
    });
    
    return results;
  }

  analyzeTrends() {
    if (this.coverageData.history.length < 2) {
      return { insufficient_data: true };
    }
    
    const recent = this.coverageData.history.slice(-10); // Last 10 records
    const trends = {};
    
    ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
      const values = recent.map(record => record.percentages[metric]);
      
      // Calculate trend (simple linear regression)
      const trend = this.calculateTrend(values);
      
      trends[metric] = {
        direction: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
        rate: trend.toFixed(3),
        currentValue: values[values.length - 1].toFixed(2),
        previousValue: values[0].toFixed(2),
        change: (values[values.length - 1] - values[0]).toFixed(2)
      };
    });
    
    return trends;
  }

  calculateTrend(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  analyzeRegressions(current, baseline) {
    const regressions = {};
    
    ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
      const currentValue = current.percentages[metric];
      const baselineValue = baseline.percentages[metric];
      const change = currentValue - baselineValue;
      
      regressions[metric] = {
        current: currentValue.toFixed(2),
        baseline: baselineValue.toFixed(2),
        change: change.toFixed(2),
        isRegression: change < -this.thresholds.regression,
        severity: change < -5 ? 'critical' : change < -2 ? 'major' : change < 0 ? 'minor' : 'none'
      };
    });
    
    return regressions;
  }

  identifyProblemAreas(coverage) {
    const problems = [];
    
    // Find files with low coverage
    Object.entries(coverage.fileDetails).forEach(([filePath, stats]) => {
      const filePercentages = {};
      Object.keys(stats).forEach(metric => {
        filePercentages[metric] = stats[metric].total > 0 
          ? (stats[metric].covered / stats[metric].total * 100) 
          : 100;
      });
      
      const avgCoverage = Object.values(filePercentages).reduce((a, b) => a + b) / 4;
      
      if (avgCoverage < 80) {
        problems.push({
          type: 'low_coverage',
          file: filePath.replace(process.cwd(), ''),
          coverage: avgCoverage.toFixed(2),
          severity: avgCoverage < 50 ? 'critical' : avgCoverage < 70 ? 'major' : 'minor',
          details: filePercentages
        });
      }
      
      // Check for specific metric problems
      Object.entries(filePercentages).forEach(([metric, percentage]) => {
        if (percentage < 70 && stats[metric].total > 5) { // Only flag significant files
          problems.push({
            type: 'metric_specific',
            file: filePath.replace(process.cwd(), ''),
            metric,
            coverage: percentage.toFixed(2),
            severity: percentage < 30 ? 'critical' : percentage < 50 ? 'major' : 'minor'
          });
        }
      });
    });
    
    return problems.sort((a, b) => {
      const severityOrder = { critical: 3, major: 2, minor: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  analyzeQuality(coverage) {
    const quality = {
      score: 0,
      factors: {},
      recommendations: []
    };
    
    // Factor 1: Overall coverage level
    const avgCoverage = coverage.summary.averageCoverage;
    quality.factors.coverage_level = {
      score: Math.min(100, avgCoverage),
      weight: 0.4
    };
    
    // Factor 2: Coverage consistency across files
    const coverageVariances = Object.values(coverage.fileDetails).map(stats => {
      const percentages = Object.keys(stats).map(metric => 
        stats[metric].total > 0 ? (stats[metric].covered / stats[metric].total * 100) : 100
      );
      return percentages.reduce((a, b) => a + b) / 4;
    });
    
    const variance = this.calculateVariance(coverageVariances);
    const consistencyScore = Math.max(0, 100 - variance);
    
    quality.factors.consistency = {
      score: consistencyScore,
      weight: 0.2,
      variance: variance.toFixed(2)
    };
    
    // Factor 3: Branch coverage quality (most important for quality)
    const branchCoverage = coverage.percentages.branches;
    quality.factors.branch_coverage = {
      score: branchCoverage,
      weight: 0.3
    };
    
    // Factor 4: Test distribution (files with tests vs without)
    const filesWithTests = Object.values(coverage.fileDetails).filter(stats => 
      Object.values(stats).some(metric => metric.covered > 0)
    ).length;
    
    const distributionScore = (filesWithTests / coverage.summary.totalFiles) * 100;
    quality.factors.test_distribution = {
      score: distributionScore,
      weight: 0.1
    };
    
    // Calculate weighted quality score
    quality.score = Object.values(quality.factors).reduce((total, factor) => 
      total + (factor.score * factor.weight), 0
    );
    
    // Generate recommendations based on quality analysis
    if (quality.score < 70) {
      quality.recommendations.push('Overall test quality needs improvement');
    }
    
    if (quality.factors.branch_coverage.score < 85) {
      quality.recommendations.push('Focus on improving branch coverage - add tests for conditional logic');
    }
    
    if (quality.factors.consistency.score < 70) {
      quality.recommendations.push('Coverage is inconsistent across files - identify and test neglected areas');
    }
    
    if (quality.factors.test_distribution.score < 90) {
      quality.recommendations.push('Some files have no test coverage - ensure all modules are tested');
    }
    
    return quality;
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  logAnalysisResults() {
    const analysis = this.coverageData.analysis;
    
    this.log('📈 Coverage Analysis Results:');
    
    // Threshold results
    console.log('\n🎯 Threshold Analysis:');
    Object.entries(analysis.thresholds).forEach(([metric, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`  ${metric}: ${status} ${result.actual}% (threshold: ${result.threshold}%)`);
    });
    
    // Quality score
    console.log(`\n⭐ Quality Score: ${analysis.quality.score.toFixed(1)}/100`);
    
    // Regressions
    if (analysis.regressions) {
      console.log('\n📉 Regression Analysis:');
      Object.entries(analysis.regressions).forEach(([metric, regression]) => {
        if (regression.isRegression) {
          console.log(`  ❌ ${metric}: ${regression.change}% regression (${regression.severity})`);
        }
      });
    }
    
    // Problem areas
    if (analysis.problemAreas.length > 0) {
      console.log(`\n⚠️  Problem Areas (${analysis.problemAreas.length} found):`);
      analysis.problemAreas.slice(0, 5).forEach(problem => {
        console.log(`  ${problem.severity.toUpperCase()}: ${problem.file} (${problem.coverage}%)`);
      });
    }
    
    // Recommendations
    if (analysis.quality.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      analysis.quality.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }
  }

  async generateCoverageReports() {
    this.log('📋 Generating coverage reports...');
    
    const reportsDir = path.join(__dirname, '../tests/reports/coverage');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate JSON report
    await this.generateJSONReport(reportsDir);
    
    // Generate HTML report
    await this.generateHTMLReport(reportsDir);
    
    // Generate Markdown report
    await this.generateMarkdownReport(reportsDir);
    
    // Generate trend chart data
    await this.generateTrendData(reportsDir);
    
    this.success('Coverage reports generated');
  }

  async generateJSONReport(reportsDir) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        ...this.coverageData.current.summary,
        qualityScore: this.coverageData.analysis.quality.score
      },
      coverage: this.coverageData.current.percentages,
      analysis: this.coverageData.analysis,
      thresholds: this.thresholds,
      files: this.coverageData.current.fileDetails
    };
    
    const reportPath = path.join(reportsDir, 'coverage-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  }

  async generateHTMLReport(reportsDir) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metric { display: inline-block; margin: 10px; padding: 10px; border-radius: 5px; min-width: 120px; text-align: center; }
        .metric.good { background: #d4edda; color: #155724; }
        .metric.warning { background: #fff3cd; color: #856404; }
        .metric.danger { background: #f8d7da; color: #721c24; }
        .quality-score { font-size: 2em; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .problem-critical { color: #dc3545; font-weight: bold; }
        .problem-major { color: #fd7e14; }
        .problem-minor { color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Coverage Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <div class="quality-score">Quality Score: ${this.coverageData.analysis.quality.score.toFixed(1)}/100</div>
    </div>

    <h2>Coverage Metrics</h2>
    <div>
        ${Object.entries(this.coverageData.current.percentages).map(([metric, value]) => {
          const threshold = this.thresholds[metric];
          const cssClass = value >= threshold ? 'good' : value >= threshold - 5 ? 'warning' : 'danger';
          return `<div class="metric ${cssClass}">
            <div><strong>${metric.toUpperCase()}</strong></div>
            <div>${value.toFixed(1)}%</div>
            <div>Target: ${threshold}%</div>
          </div>`;
        }).join('')}
    </div>

    ${this.coverageData.analysis.problemAreas.length > 0 ? `
    <h2>Problem Areas</h2>
    <table>
        <tr><th>File</th><th>Type</th><th>Coverage</th><th>Severity</th></tr>
        ${this.coverageData.analysis.problemAreas.slice(0, 10).map(problem => `
        <tr>
            <td>${problem.file}</td>
            <td>${problem.type.replace('_', ' ')}</td>
            <td>${problem.coverage}%</td>
            <td class="problem-${problem.severity}">${problem.severity.toUpperCase()}</td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    <h2>Recommendations</h2>
    <ul>
        ${this.coverageData.analysis.quality.recommendations.map(rec => `<li>${rec}</li>`).join('')}
    </ul>
</body>
</html>
    `;
    
    const reportPath = path.join(reportsDir, 'coverage-report.html');
    fs.writeFileSync(reportPath, html);
  }

  async generateMarkdownReport(reportsDir) {
    let markdown = `# Test Coverage Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
    markdown += `**Quality Score:** ${this.coverageData.analysis.quality.score.toFixed(1)}/100\n\n`;
    
    // Coverage metrics table
    markdown += `## Coverage Metrics\n\n`;
    markdown += `| Metric | Coverage | Threshold | Status |\n`;
    markdown += `|--------|----------|-----------|--------|\n`;
    
    Object.entries(this.coverageData.analysis.thresholds).forEach(([metric, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      markdown += `| ${metric} | ${result.actual}% | ${result.threshold}% | ${status} |\n`;
    });
    
    // Problem areas
    if (this.coverageData.analysis.problemAreas.length > 0) {
      markdown += `\n## Problem Areas\n\n`;
      this.coverageData.analysis.problemAreas.slice(0, 10).forEach(problem => {
        const emoji = problem.severity === 'critical' ? '🔴' : problem.severity === 'major' ? '🟡' : '🟠';
        markdown += `${emoji} **${problem.file}** - ${problem.coverage}% coverage (${problem.type.replace('_', ' ')})\n`;
      });
    }
    
    // Recommendations
    if (this.coverageData.analysis.quality.recommendations.length > 0) {
      markdown += `\n## Recommendations\n\n`;
      this.coverageData.analysis.quality.recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
    }
    
    // Trends (if available)
    if (this.coverageData.analysis.trends && !this.coverageData.analysis.trends.insufficient_data) {
      markdown += `\n## Trends\n\n`;
      Object.entries(this.coverageData.analysis.trends).forEach(([metric, trend]) => {
        const arrow = trend.direction === 'increasing' ? '📈' : trend.direction === 'decreasing' ? '📉' : '➡️';
        markdown += `${arrow} **${metric}:** ${trend.direction} (${trend.change}% change)\n`;
      });
    }
    
    const reportPath = path.join(reportsDir, 'coverage-report.md');
    fs.writeFileSync(reportPath, markdown);
  }

  async generateTrendData(reportsDir) {
    if (this.coverageData.history.length < 2) return;
    
    const trendData = {
      timestamps: this.coverageData.history.map(record => record.timestamp),
      datasets: {}
    };
    
    ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
      trendData.datasets[metric] = this.coverageData.history.map(record => 
        record.percentages[metric]
      );
    });
    
    const trendPath = path.join(reportsDir, 'coverage-trends.json');
    fs.writeFileSync(trendPath, JSON.stringify(trendData, null, 2));
  }

  startMonitoring() {
    if (this.isMonitoring) {
      this.warning('Coverage monitoring already active');
      return;
    }
    
    this.isMonitoring = true;
    this.log('🚀 Starting coverage monitoring...');
    
    // Watch coverage files
    const coverageWatcher = chokidar.watch(this.coverageFiles, {
      ignored: /node_modules/,
      persistent: true
    });
    
    coverageWatcher.on('change', async (filePath) => {
      this.log(`Coverage file changed: ${path.basename(filePath)}`);
      
      // Wait a moment for file to be fully written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        await this.runCoverageAnalysis();
      } catch (error) {
        this.error(`Auto-analysis failed: ${error.message}`);
      }
    });
    
    this.watchers.push(coverageWatcher);
    
    // Watch source files for changes
    const sourceWatcher = chokidar.watch([
      'components/**/*.{ts,tsx}',
      'services/**/*.{ts,tsx}',
      'hooks/**/*.{ts,tsx}',
      'contexts/**/*.{ts,tsx}'
    ], {
      ignored: /node_modules/,
      persistent: true
    });
    
    let changeTimeout;
    sourceWatcher.on('change', (filePath) => {
      this.log(`Source file changed: ${path.basename(filePath)}`);
      
      // Debounce changes
      clearTimeout(changeTimeout);
      changeTimeout = setTimeout(async () => {
        this.log('Triggering coverage update due to source changes...');
        try {
          await this.runCoverageAnalysis();
        } catch (error) {
          this.error(`Coverage update failed: ${error.message}`);
        }
      }, 5000);
    });
    
    this.watchers.push(sourceWatcher);
    
    // Periodic quality checks
    const qualityInterval = setInterval(async () => {
      try {
        await this.runQualityCheck();
      } catch (error) {
        this.error(`Quality check failed: ${error.message}`);
      }
    }, 300000); // Every 5 minutes
    
    this.qualityInterval = qualityInterval;
    
    this.success('Coverage monitoring active');
  }

  async runQualityCheck() {
    this.log('🔍 Running periodic quality check...');
    
    if (!this.coverageData.current) {
      this.log('No current coverage data, running analysis...');
      await this.runCoverageAnalysis();
      return;
    }
    
    // Check for regressions
    if (this.coverageData.baseline && this.coverageData.analysis.regressions) {
      const regressions = Object.values(this.coverageData.analysis.regressions)
        .filter(r => r.isRegression);
      
      if (regressions.length > 0) {
        this.warning(`Coverage regression detected in ${regressions.length} metric(s)`);
        
        // Generate alert report
        await this.generateRegressionAlert(regressions);
      }
    }
    
    // Check quality score
    const qualityScore = this.coverageData.analysis.quality.score;
    if (qualityScore < 70) {
      this.warning(`Low coverage quality score: ${qualityScore.toFixed(1)}/100`);
    }
  }

  async generateRegressionAlert(regressions) {
    const alert = {
      timestamp: new Date().toISOString(),
      type: 'COVERAGE_REGRESSION',
      severity: 'HIGH',
      message: `Coverage regression detected in ${regressions.length} metric(s)`,
      details: regressions,
      recommendations: [
        'Review recent changes that may have reduced test coverage',
        'Add tests for any new or modified code paths',
        'Consider reverting changes if regression is significant'
      ]
    };
    
    const alertPath = path.join(__dirname, '../tests/reports/coverage-alerts.json');
    
    let alerts = [];
    if (fs.existsSync(alertPath)) {
      try {
        alerts = JSON.parse(fs.readFileSync(alertPath, 'utf8'));
      } catch (error) {
        // Ignore parse errors, start fresh
      }
    }
    
    alerts.push(alert);
    alerts = alerts.slice(-50); // Keep last 50 alerts
    
    fs.writeFileSync(alertPath, JSON.stringify(alerts, null, 2));
    
    this.error('Coverage regression alert generated');
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      this.log('Coverage monitoring not active');
      return;
    }
    
    this.log('🛑 Stopping coverage monitoring...');
    
    // Close watchers
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
    
    // Clear interval
    if (this.qualityInterval) {
      clearInterval(this.qualityInterval);
    }
    
    this.isMonitoring = false;
    this.success('Coverage monitoring stopped');
  }

  async generateGatewayReport() {
    this.log('🚪 Generating CI/CD gateway report...');
    
    if (!this.coverageData.analysis) {
      throw new Error('No coverage analysis available');
    }
    
    const thresholds = this.coverageData.analysis.thresholds;
    const qualityScore = this.coverageData.analysis.quality.score;
    
    // Check if coverage meets gateway requirements
    const meetsThresholds = Object.values(thresholds).every(result => result.passed);
    const meetsQuality = qualityScore >= 75; // Quality gate threshold
    const hasRegressions = this.coverageData.analysis.regressions ?
      Object.values(this.coverageData.analysis.regressions).some(r => r.isRegression) : false;
    
    const gateway = {
      passed: meetsThresholds && meetsQuality && !hasRegressions,
      details: {
        thresholds: {
          passed: meetsThresholds,
          results: thresholds
        },
        quality: {
          passed: meetsQuality,
          score: qualityScore,
          threshold: 75
        },
        regressions: {
          detected: hasRegressions,
          details: this.coverageData.analysis.regressions
        }
      },
      recommendations: meetsThresholds && meetsQuality && !hasRegressions ? 
        ['All coverage gates passed - ready for deployment'] :
        this.coverageData.analysis.quality.recommendations
    };
    
    const gatewayPath = path.join(__dirname, '../tests/reports/coverage-gateway.json');
    fs.writeFileSync(gatewayPath, JSON.stringify(gateway, null, 2));
    
    this.log(`Gateway report generated: ${gateway.passed ? 'PASSED' : 'FAILED'}`);
    
    return gateway;
  }
}

// CLI Interface
if (require.main === module) {
  const monitor = new CoverageMonitor();
  
  const command = process.argv[2] || 'analyze';
  
  async function main() {
    try {
      switch (command) {
        case 'analyze':
          await monitor.runCoverageAnalysis();
          break;
          
        case 'monitor':
          monitor.startMonitoring();
          // Keep process alive
          process.on('SIGINT', () => {
            monitor.stopMonitoring();
            process.exit(0);
          });
          break;
          
        case 'gateway':
          const gateway = await monitor.generateGatewayReport();
          process.exit(gateway.passed ? 0 : 1);
          break;
          
        case 'baseline':
          await monitor.setBaseline();
          break;
          
        default:
          console.log('Coverage Monitor');
          console.log('Usage:');
          console.log('  node scripts/coverage-monitor.js analyze   # Run coverage analysis');
          console.log('  node scripts/coverage-monitor.js monitor   # Start real-time monitoring');
          console.log('  node scripts/coverage-monitor.js gateway   # Generate CI/CD gateway report');
          console.log('  node scripts/coverage-monitor.js baseline  # Set coverage baseline');
      }
    } catch (error) {
      console.error('Coverage monitoring failed:', error.message);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = CoverageMonitor;