/**
 * Comprehensive API Performance Test Suite
 * Tests all major endpoints and reports timing + issues
 */

import http from 'node:http';

const BASE_URL = 'http://localhost:3001';
const VERBOSE = process.argv.includes('--verbose');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const results = {
  passed: [],
  failed: [],
  slow: []
};

async function testEndpoint(name, options) {
  const { method = 'GET', path, headers = {}, body = null, expectedStatus = 200, maxTime = 3000 } = options;
  
  console.log(`\n${colors.cyan}Testing:${colors.reset} ${method} ${path}`);
  const start = Date.now();
  
  try {
    const postData = body ? JSON.stringify(body) : null;
    
    const reqOptions = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (postData) {
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          res.body = data;
          resolve(res);
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      if (postData) {
        req.write(postData);
      }
      req.end();
    });
    
    const elapsed = Date.now() - start;
    
    const statusMatch = Array.isArray(expectedStatus) 
      ? expectedStatus.includes(response.statusCode)
      : response.statusCode === expectedStatus;
    const isSlow = elapsed > maxTime;
    
    let data = null;
    try {
      if (response.body) {
        data = JSON.parse(response.body);
      }
    } catch (e) {
      // Not JSON
    }
    
    if (statusMatch && !isSlow) {
      console.log(`  ${colors.green}✓ PASS${colors.reset} - ${elapsed}ms`);
      results.passed.push({ name, elapsed, path });
    } else if (statusMatch && isSlow) {
      console.log(`  ${colors.yellow}⚠ SLOW${colors.reset} - ${elapsed}ms (max: ${maxTime}ms)`);
      results.slow.push({ name, elapsed, path, maxTime });
    } else {
      console.log(`  ${colors.red}✗ FAIL${colors.reset} - Status: ${response.statusCode} (expected: ${expectedStatus})`);
      results.failed.push({ name, elapsed, path, status: response.statusCode, expectedStatus });
    }
    
    if (VERBOSE && data) {
      console.log(`  ${colors.gray}Response keys: ${Object.keys(data).join(', ')}${colors.reset}`);
      if (data.error) {
        console.log(`  ${colors.red}Error: ${data.error}${colors.reset}`);
      }
    }
    
    return { success: statusMatch, data, elapsed, response };
    
  } catch (error) {
    const elapsed = Date.now() - start;
    console.log(`  ${colors.red}✗ ERROR${colors.reset} - ${error.message}`);
    results.failed.push({ name, elapsed, path, error: error.message });
    return { success: false, error, elapsed };
  }
}

async function runTests() {
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  PROOF API Performance Test Suite${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  let sessionCookie = null;
  let userId = null;
  
  // ==================== AUTHENTICATION ====================
  console.log(`\n${colors.blue}▶ Authentication Tests${colors.reset}`);
  
  // 1. Demo wallet creation
  const demoWallet = await testEndpoint('Create Demo Wallet', {
    method: 'POST',
    path: '/api/wallet/demo',
    maxTime: 1000
  });
  
  let publicKey, privateKey;
  if (demoWallet.success && demoWallet.data) {
    publicKey = demoWallet.data.publicKey;
    privateKey = demoWallet.data.privateKey;
  }
  
  // 2. Get nonce
  const nonceResult = await testEndpoint('Request Nonce', {
    method: 'POST',
    path: '/api/auth/nonce',
    body: { subject: 'demo' },
    maxTime: 1000
  });
  
  let nonce, message;
  if (nonceResult.success && nonceResult.data) {
    nonce = nonceResult.data.nonce;
    message = nonceResult.data.message;
  }
  
  // 3. Sign message
  if (privateKey && message) {
    const signResult = await testEndpoint('Sign Message', {
      method: 'POST',
      path: '/api/wallet/demo/sign',
      body: { privateKey, message },
      maxTime: 500
    });
    
    // 4. Verify and login
    if (signResult.success && signResult.data) {
      const verifyResult = await testEndpoint('Verify & Login', {
        method: 'POST',
        path: '/api/auth/verify',
        body: {
          mode: 'demo',
          nonce,
          publicKey,
          signature: signResult.data.signature,
          address: 'demo'
        },
        maxTime: 2000
      });
      
      if (verifyResult.success) {
        const setCookie = verifyResult.response.headers['set-cookie'];
        if (setCookie) {
          const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
          const match = cookieStr.match(/proof_session=([^;]+)/);
          if (match) {
            sessionCookie = match[1];
            if (verifyResult.data && verifyResult.data.user) {
              userId = verifyResult.data.user.id;
            }
            console.log(`  ${colors.green}Session established${colors.reset}`);
          }
        }
      }
    }
  }
  
  if (!sessionCookie) {
    console.log(`\n${colors.red}⚠ Authentication failed - some tests will be skipped${colors.reset}`);
  }
  
  const authHeaders = sessionCookie ? { Cookie: `proof_session=${sessionCookie}` } : {};
  
  // ==================== USER ENDPOINTS ====================
  console.log(`\n${colors.blue}▶ User Endpoints${colors.reset}`);
  
  await testEndpoint('Get Current User (/api/me)', {
    path: '/api/me',
    headers: authHeaders,
    maxTime: 1000
  });
  
  // ==================== HOME PAGE ====================
  console.log(`\n${colors.blue}▶ Home Page Endpoint${colors.reset}`);
  
  await testEndpoint('Home Page Data (/api/home)', {
    path: '/api/home',
    headers: authHeaders,
    maxTime: 2000  // Should be under 2s with our fixes
  });
  
  // ==================== SKILLS ====================
  console.log(`\n${colors.blue}▶ Skills Endpoints${colors.reset}`);
  
  await testEndpoint('Skills Catalog', {
    path: '/api/skills',
    headers: authHeaders,
    maxTime: 1000
  });
  
  await testEndpoint('Skill Tree', {
    path: '/api/skills/tree',
    headers: authHeaders,
    maxTime: 1500
  });
  
  await testEndpoint('Skill Detail (web-development)', {
    path: '/api/skills/web-development',
    headers: authHeaders,
    maxTime: 1000
  });
  
  // ==================== CHALLENGES ====================
  console.log(`\n${colors.blue}▶ Challenge Endpoints${colors.reset}`);
  
  await testEndpoint('Daily Challenge', {
    path: '/api/daily',
    headers: authHeaders,
    maxTime: 1000
  });
  
  await testEndpoint('Challenge Categories', {
    path: '/api/challenges',
    headers: authHeaders,
    maxTime: 1500
  });
  
  // ==================== MARKETPLACE ====================
  console.log(`\n${colors.blue}▶ Marketplace Endpoints${colors.reset}`);
  
  await testEndpoint('All Marketplace Tasks', {
    path: '/api/market/tasks',
    headers: authHeaders,
    maxTime: 1500
  });
  
  await testEndpoint('Qualified Tasks Only', {
    path: '/api/market/tasks?qualified=1',
    headers: authHeaders,
    maxTime: 1500
  });
  
  await testEndpoint('My Tasks', {
    path: '/api/market/my',
    headers: authHeaders,
    maxTime: 1500
  });
  
  // ==================== TEACHING ====================
  console.log(`\n${colors.blue}▶ Teaching Endpoints${colors.reset}`);
  
  await testEndpoint('Teaching Sessions', {
    path: '/api/teach/sessions',
    headers: authHeaders,
    maxTime: 1500
  });
  
  // ==================== LEARNING ====================
  console.log(`\n${colors.blue}▶ Learning Endpoints${colors.reset}`);
  
  await testEndpoint('My Paths', {
    path: '/api/paths',
    headers: authHeaders,
    maxTime: 1500
  });
  
  await testEndpoint('Lesson Content (sample)', {
    path: '/api/lesson/web-development/html-basics',
    headers: authHeaders,
    maxTime: 2000,
    expectedStatus: [200, 404]  // May not exist
  });
  
  // ==================== WALLET & ECONOMY ====================
  console.log(`\n${colors.blue}▶ Wallet & Economy Endpoints${colors.reset}`);
  
  await testEndpoint('Wallet Info', {
    path: '/api/wallet',
    headers: authHeaders,
    maxTime: 1000
  });
  
  await testEndpoint('Rewards History', {
    path: '/api/rewards',
    headers: authHeaders,
    maxTime: 1000
  });
  
  // ==================== NOTIFICATIONS ====================
  console.log(`\n${colors.blue}▶ Notification Endpoints${colors.reset}`);
  
  await testEndpoint('Notifications', {
    path: '/api/notifications',
    headers: authHeaders,
    maxTime: 1000
  });
  
  // ==================== SPACED REPETITION ====================
  console.log(`\n${colors.blue}▶ Spaced Repetition Endpoints${colors.reset}`);
  
  await testEndpoint('Review Schedule', {
    path: '/api/review',
    headers: authHeaders,
    maxTime: 1500
  });
  
  // ==================== LEADERBOARD ====================
  console.log(`\n${colors.blue}▶ Leaderboard Endpoints${colors.reset}`);
  
  await testEndpoint('Leaderboard', {
    path: '/api/leaderboard',
    headers: authHeaders,
    maxTime: 1500
  });
  
  // ==================== RESULTS SUMMARY ====================
  console.log(`\n\n${colors.blue}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}  Test Results Summary${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════${colors.reset}\n`);
  
  const total = results.passed.length + results.failed.length + results.slow.length;
  
  console.log(`${colors.green}✓ Passed:${colors.reset} ${results.passed.length}/${total}`);
  console.log(`${colors.yellow}⚠ Slow:${colors.reset}   ${results.slow.length}/${total}`);
  console.log(`${colors.red}✗ Failed:${colors.reset} ${results.failed.length}/${total}`);
  
  if (results.slow.length > 0) {
    console.log(`\n${colors.yellow}Slow Endpoints (>max time):${colors.reset}`);
    results.slow.forEach(r => {
      console.log(`  ${r.name}: ${r.elapsed}ms (max: ${r.maxTime}ms)`);
      console.log(`    ${colors.gray}${r.path}${colors.reset}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log(`\n${colors.red}Failed Endpoints:${colors.reset}`);
    results.failed.forEach(r => {
      console.log(`  ${r.name}: ${r.error || `Status ${r.status} (expected ${r.expectedStatus})`}`);
      console.log(`    ${colors.gray}${r.path}${colors.reset}`);
    });
  }
  
  // Performance statistics
  const allTimes = [...results.passed, ...results.slow].map(r => r.elapsed);
  if (allTimes.length > 0) {
    const avg = allTimes.reduce((a, b) => a + b, 0) / allTimes.length;
    const max = Math.max(...allTimes);
    const min = Math.min(...allTimes);
    
    console.log(`\n${colors.blue}Performance Statistics:${colors.reset}`);
    console.log(`  Average: ${Math.round(avg)}ms`);
    console.log(`  Min: ${min}ms`);
    console.log(`  Max: ${max}ms`);
  }
  
  // Overall assessment
  console.log(`\n${colors.blue}Overall Assessment:${colors.reset}`);
  if (results.failed.length === 0 && results.slow.length === 0) {
    console.log(`  ${colors.green}🎉 All tests passed with good performance!${colors.reset}`);
  } else if (results.failed.length === 0) {
    console.log(`  ${colors.yellow}⚠️  All tests passed but some are slow${colors.reset}`);
  } else {
    console.log(`  ${colors.red}❌ Some tests failed or encountered errors${colors.reset}`);
  }
  
  console.log(`\n${colors.gray}Run with --verbose for detailed response data${colors.reset}\n`);
  
  // Exit code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(err => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});
