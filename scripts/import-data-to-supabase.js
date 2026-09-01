/**
 * Import existing data from JSON store to Supabase
 * Reads data/ folder and uploads all users, proofs, and attempts
 * 
 * Usage: node scripts/import-data-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📦 Starting data import to Supabase...\n');

async function importData() {
  try {
    // Read main proof.json
    const dataDir = path.join(__dirname, '..', 'data');
    const proofFile = path.join(dataDir, 'proof.json');

    if (!fs.existsSync(proofFile)) {
      console.log('⚠️  No proof.json found, checking individual proof files...');
      await importProofFiles(dataDir);
      return;
    }

    const jsonData = JSON.parse(fs.readFileSync(proofFile, 'utf8'));
    console.log('📊 Found proof.json with tables:', Object.keys(jsonData).join(', '));

    // Import Users
    if (jsonData.users && Object.keys(jsonData.users).length > 0) {
      console.log(`\n👥 Importing ${Object.keys(jsonData.users).length} users...`);
      let imported = 0;
      let skipped = 0;

      for (const user of Object.values(jsonData.users)) {
        // Skip demo users or users without wallets if you want only real users
        // if (user.isDemo || !user.walletAddress) {
        //   skipped++;
        //   continue;
        // }

        const { error } = await supabase
          .from('User')
          .upsert({
            id: user.id,
            walletAddress: user.walletAddress,
            walletMode: user.walletMode,
            publicKey: user.publicKey,
            username: user.username,
            avatar: user.avatar || '🙂',
            level: user.level || 1,
            xp: user.xp || 0,
            reputation: user.reputation || 50,
            balanceLuna: user.balanceLuna || 0,
            earnedLuna: user.earnedLuna || 0,
            proofsPassed: user.proofsPassed || 0,
            isDemo: user.isDemo || false,
            prefs: user.prefs || {},
            createdAt: user.createdAt || new Date().toISOString(),
            updatedAt: user.updatedAt || new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (error) {
          console.error(`   ❌ Failed to import user ${user.username}:`, error.message);
          skipped++;
        } else {
          imported++;
          if (user.walletAddress) {
            console.log(`   ✅ ${user.username} (${user.walletAddress.substring(0, 15)}...)`);
          }
        }
      }

      console.log(`\n   Summary: ${imported} imported, ${skipped} skipped`);
    }

    // Import Skills
    if (jsonData.skills && Object.keys(jsonData.skills).length > 0) {
      console.log(`\n🎯 Importing ${Object.keys(jsonData.skills).length} skills...`);
      let imported = 0;

      for (const skill of Object.values(jsonData.skills)) {
        const { error } = await supabase
          .from('Skill')
          .upsert({
            id: skill.id,
            slug: skill.slug,
            name: skill.name,
            category: skill.category,
            emoji: skill.emoji || '📚',
            blurb: skill.blurb || '',
            popularity: skill.popularity || 0
          }, {
            onConflict: 'slug'
          });

        if (error) {
          console.error(`   ❌ Failed to import skill ${skill.name}:`, error.message);
        } else {
          imported++;
          console.log(`   ✅ ${skill.emoji} ${skill.name}`);
        }
      }

      console.log(`\n   Summary: ${imported} skills imported`);
    }

    // Import Skill Proofs
    if (jsonData.skill_proofs && Object.keys(jsonData.skill_proofs).length > 0) {
      console.log(`\n🏆 Importing ${Object.keys(jsonData.skill_proofs).length} skill proofs...`);
      let imported = 0;

      for (const proof of Object.values(jsonData.skill_proofs)) {
        const { error } = await supabase
          .from('SkillProof')
          .upsert({
            id: proof.id,
            publicId: proof.publicId,
            userId: proof.userId,
            skillSlug: proof.skillSlug,
            challengeId: proof.challengeId,
            challengeTitle: proof.challengeTitle,
            kind: proof.kind,
            score: proof.score,
            passed: proof.passed,
            completedAt: proof.completedAt || new Date().toISOString()
          }, {
            onConflict: 'publicId'
          });

        if (!error) {
          imported++;
        }
      }

      console.log(`   Summary: ${imported} proofs imported`);
    }

    // Import Rewards
    if (jsonData.rewards && Object.keys(jsonData.rewards).length > 0) {
      console.log(`\n💰 Importing ${Object.keys(jsonData.rewards).length} rewards...`);
      let imported = 0;

      for (const reward of Object.values(jsonData.rewards)) {
        const { error } = await supabase
          .from('Reward')
          .upsert({
            id: reward.id,
            key: reward.key,
            userId: reward.userId,
            challengeId: reward.challengeId,
            sourceKind: reward.sourceKind,
            amountLuna: reward.amountLuna,
            currency: reward.currency || 'NIM',
            status: reward.status || 'credited',
            transactionId: reward.transactionId,
            createdAt: reward.createdAt || new Date().toISOString()
          }, {
            onConflict: 'key'
          });

        if (!error) {
          imported++;
        }
      }

      console.log(`   Summary: ${imported} rewards imported`);
    }

    // Import Wallet Transactions
    if (jsonData.wallet_transactions && Object.keys(jsonData.wallet_transactions).length > 0) {
      console.log(`\n💳 Importing ${Object.keys(jsonData.wallet_transactions).length} transactions...`);
      let imported = 0;

      for (const tx of Object.values(jsonData.wallet_transactions)) {
        const { error } = await supabase
          .from('WalletTransaction')
          .upsert({
            id: tx.id,
            userId: tx.userId,
            kind: tx.kind,
            direction: tx.direction,
            amountLuna: tx.amountLuna,
            status: tx.status || 'pending',
            network: tx.network || 'demo-ledger',
            ref: tx.ref,
            note: tx.note,
            meta: tx.meta || {},
            createdAt: tx.createdAt || new Date().toISOString(),
            confirmedAt: tx.confirmedAt
          }, {
            onConflict: 'id'
          });

        if (!error) {
          imported++;
        }
      }

      console.log(`   Summary: ${imported} transactions imported`);
    }

    console.log('\n✅ Data import completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify data in Supabase dashboard');
    console.log('2. Update DB_MODE=supabase in .env');
    console.log('3. Restart server: npm start\n');

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Import individual proof files from data/ subdirectories
async function importProofFiles(dataDir) {
  console.log('📁 Scanning proof files in data/ subdirectories...');
  
  const subdirs = fs.readdirSync(dataDir).filter(item => {
    const fullPath = path.join(dataDir, item);
    return fs.statSync(fullPath).isDirectory();
  });

  console.log(`   Found ${subdirs.length} proof directories`);

  let totalProofs = 0;
  let importedProofs = 0;

  for (const subdir of subdirs) {
    const proofPath = path.join(dataDir, subdir, 'proof.json');
    if (!fs.existsSync(proofPath)) continue;

    totalProofs++;
    
    try {
      const proofData = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
      
      // Extract wallet address from proof data or directory name
      const walletAddress = proofData.walletAddress || proofData.user?.walletAddress;
      
      if (!walletAddress) {
        console.log(`   ⚠️  Skipping ${subdir}: no wallet address`);
        continue;
      }

      // Check if user exists or create
      let { data: user } = await supabase
        .from('User')
        .select('id')
        .eq('walletAddress', walletAddress)
        .single();

      if (!user) {
        // Create user from proof data
        const { data: newUser, error } = await supabase
          .from('User')
          .insert({
            walletAddress: walletAddress,
            walletMode: 'nimiqpay',
            username: proofData.username || `user_${walletAddress.substring(0, 8)}`,
            isDemo: false,
            createdAt: proofData.submittedAt || new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error(`   ❌ Failed to create user for ${walletAddress}:`, error.message);
          continue;
        }

        user = newUser;
        console.log(`   ✅ Created user ${user.username} (${walletAddress.substring(0, 15)}...)`);
      }

      // Import proof
      if (proofData.skillSlug && proofData.score !== undefined) {
        const { error } = await supabase
          .from('SkillProof')
          .upsert({
            publicId: subdir,
            userId: user.id,
            skillSlug: proofData.skillSlug,
            challengeId: proofData.challengeId || 'unknown',
            challengeTitle: proofData.challengeTitle || 'Challenge',
            kind: proofData.kind || 'checkpoint',
            score: proofData.score,
            passed: proofData.passed || proofData.score >= 70,
            completedAt: proofData.submittedAt || new Date().toISOString()
          }, {
            onConflict: 'publicId'
          });

        if (!error) {
          importedProofs++;
        }
      }

    } catch (err) {
      console.error(`   ❌ Error processing ${subdir}:`, err.message);
    }
  }

  console.log(`\n   Summary: ${importedProofs}/${totalProofs} proofs imported`);
}

importData();
