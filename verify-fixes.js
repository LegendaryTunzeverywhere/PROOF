/**
 * Verification Script for Socratic Teaching Fixes
 * Run with: node verify-fixes.js
 */

console.log('🔍 Verifying Socratic Teaching System Fixes...\n');

let passCount = 0;
let failCount = 0;

function pass(msg) {
  console.log('✅', msg);
  passCount++;
}

function fail(msg) {
  console.log('❌', msg);
  failCount++;
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  console.log('  ' + title);
  console.log('='.repeat(60) + '\n');
}

// Test 1: Language Keywords
section('TEST 1: Language Detection Keywords');

try {
  const kb = await import('./server/ai/kb.js');
  const languagesConfig = kb.KB.languages;
  
  if (!languagesConfig) {
    fail('Languages config not found in KB');
  } else {
    const keywords = languagesConfig.goalKeywords;
    
    const requiredKeywords = ['german', 'deutsch', 'spanish', 'español', 'mandarin', 'chinese'];
    const hasAllKeywords = requiredKeywords.every(kw => keywords.includes(kw));
    
    if (hasAllKeywords) {
      pass(`Language keywords include: ${requiredKeywords.join(', ')}`);
      pass(`Total language keywords: ${keywords.length}`);
    } else {
      fail('Missing some required language keywords');
      console.log('   Expected:', requiredKeywords);
      console.log('   Found:', keywords.filter(kw => requiredKeywords.includes(kw)));
    }
  }
} catch (err) {
  fail('Failed to load KB module: ' + err.message);
}

// Test 2: Socratic View Navigation
section('TEST 2: Socratic Session Navigation Fix');

try {
  const fs = await import('fs/promises');
  const socraticCode = await fs.readFile('./web/js/views/socratic.js', 'utf-8');
  
  // Check for the fixed navigation pattern
  if (socraticCode.includes('window.location.hash = \'#/socratic\'')) {
    pass('Socratic navigation uses window.location.hash (CORRECT)');
  } else {
    fail('Socratic navigation might be using old pattern');
  }
  
  // Check it's NOT using the broken pattern
  if (socraticCode.includes('screen.innerHTML = renderActiveSession()') 
      && !socraticCode.includes('if (activeSession)')) {
    fail('Found old broken pattern: direct screen.innerHTML assignment');
  } else {
    pass('No broken direct innerHTML assignment in startSocraticSession');
  }
  
  // Verify export
  if (socraticCode.includes('export async function startSocraticSession')) {
    pass('startSocraticSession is properly exported');
  } else {
    fail('startSocraticSession export not found');
  }
  
} catch (err) {
  fail('Failed to read socratic.js: ' + err.message);
}

// Test 3: View Files Exist
section('TEST 3: Required View Files');

try {
  const fs = await import('fs/promises');
  const requiredFiles = [
    'web/js/views/socratic.js',
    'web/js/views/glossary.js',
    'web/js/views/learn.js'
  ];
  
  for (const file of requiredFiles) {
    try {
      await fs.access(file);
      pass(`Found: ${file}`);
    } catch {
      fail(`Missing: ${file}`);
    }
  }
} catch (err) {
  fail('Failed to check files: ' + err.message);
}

// Test 4: Service Files
section('TEST 4: Backend Services');

try {
  const fs = await import('fs/promises');
  const requiredServices = [
    'server/services/socratic-tutor.js'
  ];
  
  for (const file of requiredServices) {
    try {
      await fs.access(file);
      pass(`Found: ${file}`);
      
      // Check for key functions
      const code = await fs.readFile(file, 'utf-8');
      const keyFunctions = ['startSession', 'recordResponse', 'getInsights'];
      
      for (const fn of keyFunctions) {
        if (code.includes(fn)) {
          pass(`  ├─ Has function: ${fn}()`);
        } else {
          fail(`  ├─ Missing function: ${fn}()`);
        }
      }
    } catch {
      fail(`Missing: ${file}`);
    }
  }
} catch (err) {
  fail('Failed to check services: ' + err.message);
}

// Test 5: Seed Data
section('TEST 5: Seed Data');

try {
  const fs = await import('fs/promises');
  const seedCode = await fs.readFile('./server/seed.js', 'utf-8');
  
  if (seedCode.includes('socratic_sessions')) {
    pass('Seed includes Socratic sessions');
  } else {
    fail('Seed missing Socratic sessions');
  }
  
  if (seedCode.includes('user_glossary')) {
    pass('Seed includes glossary terms');
  } else {
    fail('Seed missing glossary terms');
  }
  
  if (seedCode.includes('createSession')) {
    pass('Seed has createSession helper');
  } else {
    fail('Seed missing createSession helper');
  }
  
  if (seedCode.includes('createGlossaryTerm')) {
    pass('Seed has createGlossaryTerm helper');
  } else {
    fail('Seed missing createGlossaryTerm helper');
  }
  
} catch (err) {
  fail('Failed to check seed: ' + err.message);
}

// Test 6: Database Migration
section('TEST 6: Database Schema');

try {
  const fs = await import('fs/promises');
  const migrationCode = await fs.readFile('./prisma/migrations/add_socratic_teaching.sql', 'utf-8');
  
  const requiredTables = [
    'socratic_sessions',
    'socratic_responses',
    'user_glossary'
  ];
  
  for (const table of requiredTables) {
    if (migrationCode.includes(`CREATE TABLE ${table}`)) {
      pass(`Schema includes table: ${table}`);
    } else {
      fail(`Schema missing table: ${table}`);
    }
  }
  
} catch (err) {
  fail('Failed to check migration: ' + err.message);
}

// Test 7: Learn View Integration
section('TEST 7: Learn View Integration Points');

try {
  const fs = await import('fs/promises');
  const learnCode = await fs.readFile('./web/js/views/learn.js', 'utf-8');
  
  const integrationPoints = [
    { name: 'Pre-lesson prompt', pattern: 'showPreLessonPrompt' },
    { name: 'Checkpoint rendering', pattern: 'renderCheckpoint' },
    { name: 'Post-lesson reflection', pattern: 'showPostLessonReflection' },
    { name: 'Wait what button', pattern: 'Wait, what?' }
  ];
  
  for (const point of integrationPoints) {
    if (learnCode.includes(point.pattern)) {
      pass(`Learn view has: ${point.name}`);
    } else {
      fail(`Learn view missing: ${point.name}`);
    }
  }
  
} catch (err) {
  fail('Failed to check learn view: ' + err.message);
}

// Test 8: API Endpoints
section('TEST 8: API Endpoints');

try {
  const fs = await import('fs/promises');
  const serverCode = await fs.readFile('./server/index.js', 'utf-8');
  
  const requiredEndpoints = [
    { method: 'POST', path: '/api/socratic/start' },
    { method: 'GET', path: '/api/socratic/sessions' },
    { method: 'POST', path: '/api/socratic/:sessionId/respond' },
    { method: 'GET', path: '/api/socratic/:sessionId/insights' },
    { method: 'GET', path: '/api/glossary' },
    { method: 'POST', path: '/api/glossary' }
  ];
  
  for (const endpoint of requiredEndpoints) {
    // Simple check for endpoint pattern
    const pattern = endpoint.path.replace(':sessionId', ':[a-zA-Z]+');
    if (serverCode.includes(endpoint.path) || serverCode.includes(pattern)) {
      pass(`API has: ${endpoint.method} ${endpoint.path}`);
    } else {
      fail(`API missing: ${endpoint.method} ${endpoint.path}`);
    }
  }
  
} catch (err) {
  fail('Failed to check API endpoints: ' + err.message);
}

// Summary
section('VERIFICATION SUMMARY');

const total = passCount + failCount;
const percentage = total > 0 ? Math.round((passCount / total) * 100) : 0;

console.log(`Total Tests: ${total}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`Success Rate: ${percentage}%\n`);

if (failCount === 0) {
  console.log('🎉 All verifications passed! System is ready for testing.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some verifications failed. Review the output above.\n');
  process.exit(1);
}
