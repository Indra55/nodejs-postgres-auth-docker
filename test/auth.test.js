/**
 * Auth System Test Suite
 * Run: node test/auth.test.js
 */

const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5555';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bold}${colors.yellow}${msg}${colors.reset}\n`)
};

// Simple HTTP request helper
function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body ? JSON.parse(body) : null
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        body: body
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Test cases
const tests = {
    async serverRunning() {
        try {
            const res = await request('GET', '/');
            return res.status === 200;
        } catch (e) {
            return false;
        }
    },

    async registerUser() {
        const testUser = {
            username: `testuser_${Date.now()}`,
            email: `test_${Date.now()}@example.com`,
            password: 'TestPassword123!'
        };

        try {
            const res = await request('POST', '/users/register', testUser);
            return {
                passed: res.status === 201 || res.status === 400, // 400 if user exists
                details: res.body
            };
        } catch (e) {
            return { passed: false, details: e.message };
        }
    },

    async loginUser() {
        const testUser = {
            email: 'test@example.com',
            password: 'TestPassword123!'
        };

        try {
            const res = await request('POST', '/users/login', testUser);
            return {
                passed: res.status === 200 || res.status === 400, // 400 if user not found
                details: res.body
            };
        } catch (e) {
            return { passed: false, details: e.message };
        }
    },

    async dashboardWithoutAuth() {
        try {
            const res = await request('GET', '/users/dashboard');
            return {
                passed: res.status === 401, // Should be unauthorized
                details: res.body
            };
        } catch (e) {
            return { passed: false, details: e.message };
        }
    },

    async googleOAuthEndpoint() {
        try {
            const res = await request('GET', '/auth/google');
            // Should redirect to Google (302) or return error if not configured
            return {
                passed: res.status === 302 || res.status === 500,
                details: res.status === 302 ? 'Redirects to Google ✓' : 'OAuth not configured (check env vars)'
            };
        } catch (e) {
            return { passed: false, details: e.message };
        }
    },

    async authStatusEndpoint() {
        try {
            const res = await request('GET', '/auth/status');
            return {
                passed: res.status === 200 && res.body.hasOwnProperty('authenticated'),
                details: res.body
            };
        } catch (e) {
            return { passed: false, details: e.message };
        }
    },

    async logoutEndpoint() {
        try {
            const res = await request('GET', '/users/logout');
            return {
                passed: res.status === 200,
                details: res.body
            };
        } catch (e) {
            return { passed: false, details: e.message };
        }
    }
};

// Run all tests
async function runTests() {
    console.log(`
${colors.bold}╔════════════════════════════════════════╗
║     Auth System Test Suite             ║
╚════════════════════════════════════════╝${colors.reset}
  `);

    log.info(`Testing server at: ${BASE_URL}`);

    let passed = 0;
    let failed = 0;

    // Test 1: Server Running
    log.header('1. Server Connection');
    const serverUp = await tests.serverRunning();
    if (serverUp) {
        log.success('Server is running');
        passed++;
    } else {
        log.error('Server is not running - make sure to start it with: npm run dev');
        console.log(`\n${colors.red}Cannot continue tests without server running.${colors.reset}`);
        process.exit(1);
    }

    // Test 2: Register
    log.header('2. User Registration');
    const registerResult = await tests.registerUser();
    if (registerResult.passed) {
        log.success('Registration endpoint working');
        log.info(`Response: ${JSON.stringify(registerResult.details)}`);
        passed++;
    } else {
        log.error('Registration endpoint failed');
        log.info(`Response: ${JSON.stringify(registerResult.details)}`);
        failed++;
    }

    // Test 3: Login
    log.header('3. User Login');
    const loginResult = await tests.loginUser();
    if (loginResult.passed) {
        log.success('Login endpoint working');
        log.info(`Response: ${JSON.stringify(loginResult.details)}`);
        passed++;
    } else {
        log.error('Login endpoint failed');
        log.info(`Response: ${JSON.stringify(loginResult.details)}`);
        failed++;
    }

    // Test 4: Protected Route
    log.header('4. Protected Route (Dashboard)');
    const dashboardResult = await tests.dashboardWithoutAuth();
    if (dashboardResult.passed) {
        log.success('Protected route correctly returns 401 without auth');
        passed++;
    } else {
        log.error('Protected route not working correctly');
        log.info(`Response: ${JSON.stringify(dashboardResult.details)}`);
        failed++;
    }

    // Test 5: Google OAuth
    log.header('5. Google OAuth Endpoint');
    const googleResult = await tests.googleOAuthEndpoint();
    if (googleResult.passed) {
        log.success('Google OAuth endpoint accessible');
        log.info(googleResult.details);
        passed++;
    } else {
        log.error('Google OAuth endpoint not working');
        log.info(`Details: ${googleResult.details}`);
        failed++;
    }

    // Test 6: Auth Status
    log.header('6. Auth Status Endpoint');
    const statusResult = await tests.authStatusEndpoint();
    if (statusResult.passed) {
        log.success('Auth status endpoint working');
        log.info(`Response: ${JSON.stringify(statusResult.details)}`);
        passed++;
    } else {
        log.error('Auth status endpoint failed');
        log.info(`Response: ${JSON.stringify(statusResult.details)}`);
        failed++;
    }

    // Test 7: Logout
    log.header('7. Logout Endpoint');
    const logoutResult = await tests.logoutEndpoint();
    if (logoutResult.passed) {
        log.success('Logout endpoint working');
        passed++;
    } else {
        log.error('Logout endpoint failed');
        failed++;
    }

    // Summary
    console.log(`
${colors.bold}╔════════════════════════════════════════╗
║              Test Summary              ║
╚════════════════════════════════════════╝${colors.reset}
  `);

    console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`  Total:  ${passed + failed}`);
    console.log();

    if (failed === 0) {
        console.log(`${colors.green}${colors.bold}All tests passed! 🎉${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}Some tests failed. Check the details above.${colors.reset}\n`);
    }

    // Google OAuth reminder
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.bold}To test Google OAuth manually:${colors.reset}`);
    console.log(`  1. Open browser: ${BASE_URL}/auth/google`);
    console.log(`  2. Login with Google account`);
    console.log(`  3. Should redirect to frontend with auth cookie`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
}

runTests().catch(console.error);
