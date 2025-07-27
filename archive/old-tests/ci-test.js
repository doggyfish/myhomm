// Continuous Integration Test Runner for Node.js
// Run with: node ci-test.js

const puppeteer = require('puppeteer');
const path = require('path');

class CITestRunner {
    constructor() {
        this.browser = null;
        this.page = null;
    }
    
    async setup() {
        console.log('🚀 Starting automated test suite...');
        
        this.browser = await puppeteer.launch({
            headless: true, // Set to false to see browser window
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Listen for console logs from the page
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Browser Error:', msg.text());
            }
        });
        
        // Navigate to test page
        const testPath = `file://${path.resolve(__dirname, 'test.html')}`;
        await this.page.goto(testPath);
        
        // Wait for page to load
        await this.page.waitForSelector('#testResults');
        console.log('✅ Test page loaded');
    }
    
    async runTests() {
        console.log('🧪 Running all automated tests...');
        
        // Click "Run All Tests" button
        await this.page.click('button[onclick="runAllTests()"]');
        
        // Wait for tests to complete (check for test summary)
        await this.page.waitForFunction(() => {
            const summary = document.getElementById('testSummary');
            return summary && summary.innerHTML.includes('Total');
        }, { timeout: 30000 });
        
        // Get test results
        const results = await this.page.evaluate(() => {
            const summary = document.getElementById('testSummary').innerHTML;
            const results = Array.from(document.querySelectorAll('.test-result')).map(el => ({
                passed: el.classList.contains('test-pass'),
                message: el.textContent.trim()
            }));
            
            return { summary, results };
        });
        
        return results;
    }
    
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
    
    displayResults(results) {
        console.log('\n📊 Test Results:');
        console.log('=' .repeat(50));
        console.log(results.summary.replace(/(<([^>]+)>)/gi, "")); // Strip HTML
        console.log('=' .repeat(50));
        
        let passed = 0;
        let failed = 0;
        
        results.results.forEach(result => {
            const icon = result.passed ? '✅' : '❌';
            console.log(`${icon} ${result.message}`);
            
            if (result.passed) passed++;
            else failed++;
        });
        
        console.log('=' .repeat(50));
        console.log(`Final Result: ${passed} passed, ${failed} failed`);
        
        return failed === 0;
    }
}

// Performance benchmark runner
class PerformanceBenchmark {
    constructor(page) {
        this.page = page;
    }
    
    async runBenchmarks() {
        console.log('\n⚡ Running performance benchmarks...');
        
        // Run performance tests
        await this.page.click('button[onclick="runPerformanceTests()"]');
        
        await this.page.waitForFunction(() => {
            const summary = document.getElementById('testSummary');
            return summary && summary.innerHTML.includes('Total');
        }, { timeout: 10000 });
        
        // Get performance metrics
        const metrics = await this.page.evaluate(() => {
            const performanceEntries = performance.getEntriesByType('measure');
            return performanceEntries.map(entry => ({
                name: entry.name,
                duration: entry.duration
            }));
        });
        
        console.log('Performance Metrics:');
        metrics.forEach(metric => {
            console.log(`  ${metric.name}: ${metric.duration.toFixed(2)}ms`);
        });
        
        return metrics;
    }
}

// Cross-browser testing
class CrossBrowserTest {
    static async runOnMultipleBrowsers() {
        const browsers = [
            { name: 'Chromium', product: 'chrome' },
            { name: 'Firefox', product: 'firefox' }
        ];
        
        const results = {};
        
        for (const browserConfig of browsers) {
            console.log(`\n🌐 Testing on ${browserConfig.name}...`);
            
            try {
                const browser = await puppeteer.launch({
                    product: browserConfig.product,
                    headless: true
                });
                
                const page = await browser.newPage();
                const testPath = `file://${path.resolve(__dirname, 'test.html')}`;
                await page.goto(testPath);
                await page.waitForSelector('#testResults');
                
                // Run quick test
                await page.click('button[onclick="runUnitTests()"]');
                await page.waitForFunction(() => {
                    const summary = document.getElementById('testSummary');
                    return summary && summary.innerHTML.includes('Total');
                });
                
                const testResults = await page.evaluate(() => {
                    const summary = document.getElementById('testSummary').innerHTML;
                    const failedTests = document.querySelectorAll('.test-fail').length;
                    return { summary, failedTests };
                });
                
                results[browserConfig.name] = {
                    success: testResults.failedTests === 0,
                    summary: testResults.summary
                };
                
                await browser.close();
                console.log(`✅ ${browserConfig.name} testing complete`);
                
            } catch (error) {
                console.log(`❌ ${browserConfig.name} testing failed:`, error.message);
                results[browserConfig.name] = { success: false, error: error.message };
            }
        }
        
        return results;
    }
}

// Main execution
async function main() {
    const runner = new CITestRunner();
    let exitCode = 0;
    
    try {
        await runner.setup();
        
        // Run main test suite
        const results = await runner.runTests();
        const allPassed = runner.displayResults(results);
        
        if (!allPassed) {
            exitCode = 1;
        }
        
        // Run performance benchmarks
        const benchmark = new PerformanceBenchmark(runner.page);
        await benchmark.runBenchmarks();
        
        // Run cross-browser tests (optional)
        if (process.argv.includes('--cross-browser')) {
            console.log('\n🔄 Running cross-browser tests...');
            const crossBrowserResults = await CrossBrowserTest.runOnMultipleBrowsers();
            
            Object.entries(crossBrowserResults).forEach(([browser, result]) => {
                const status = result.success ? '✅' : '❌';
                console.log(`${status} ${browser}: ${result.success ? 'PASS' : 'FAIL'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        exitCode = 1;
    } finally {
        await runner.cleanup();
    }
    
    console.log(`\n🏁 Testing complete. Exit code: ${exitCode}`);
    process.exit(exitCode);
}

// Handle command line arguments
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { CITestRunner, PerformanceBenchmark, CrossBrowserTest };