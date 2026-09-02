/**
 * Quick performance test for /api/home endpoint
 * Tests the N+1 query fix for marketplace tasks
 */

console.log('🧪 Testing /api/home performance...\n');

const BASE_URL = 'http://localhost:3001';

async function testHomePerformance() {
  // First, we need to authenticate
  const onboardRes = await fetch(`${BASE_URL}/api/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goal: 'Test performance',
      level: 'beginner',
      minutesPerDay: 30
    })
  });
  
  if (!onboardRes.ok) {
    console.error('❌ Failed to onboard:', onboardRes.status);
    return;
  }
  
  // Extract session cookie
  const setCookie = onboardRes.headers.get('set-cookie');
  const sessionMatch = setCookie?.match(/proof_session=([^;]+)/);
  
  if (!sessionMatch) {
    console.error('❌ No session cookie received');
    return;
  }
  
  console.log('✅ User onboarded, session created\n');
  
  // Now test /api/home performance
  console.log('📊 Testing /api/home endpoint...');
  const start = Date.now();
  
  const homeRes = await fetch(`${BASE_URL}/api/home`, {
    headers: {
      'Cookie': `proof_session=${sessionMatch[1]}`
    }
  });
  
  const elapsed = Date.now() - start;
  
  if (!homeRes.ok) {
    console.error('❌ /api/home failed:', homeRes.status);
    return;
  }
  
  const data = await homeRes.json();
  
  console.log('\n📈 Results:');
  console.log(`   Response time: ${elapsed}ms`);
  console.log(`   Recommended tasks: ${data.recommendedTasks?.length || 0}`);
  console.log(`   Trending skills: ${data.trending?.length || 0}`);
  console.log(`   Discovery tasks: ${data.discovery?.newTasks?.length || 0}`);
  
  if (elapsed < 1000) {
    console.log('\n✅ PASS - Response time under 1 second');
  } else if (elapsed < 3000) {
    console.log('\n⚠️  SLOW - Response time over 1 second but under 3 seconds');
  } else {
    console.log('\n❌ FAIL - Response time over 3 seconds');
  }
  
  return elapsed;
}

testHomePerformance().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
