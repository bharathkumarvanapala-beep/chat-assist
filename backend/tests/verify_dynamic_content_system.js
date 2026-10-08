/**
 * Test Suite: Dynamic Database-Driven Vocabulary & Phrasebook System
 * 
 * Tests:
 * 1. Health & version endpoints
 * 2. Unauthenticated access blocked on admin endpoints (401)
 * 3. Authenticated admin CRUD for Vocabulary, Phrases, and Categories
 * 4. Section 27 Workflow: Webmaster changes "Are you free now?" Hindi translation
 * 5. Synchronization diff generation
 * 6. Bulk CSV import validation and execution
 */

import http from 'http';

const BASE_URL = 'http://localhost:5000/api/v1';
const ADMIN_KEY = 'admin_secret_key_2026';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqHeaders = {
      'Accept': 'application/json',
      ...headers
    };
    if (body) {
      reqHeaders['Content-Type'] = 'application/json';
    }

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log(' RUNNING DYNAMIC VOCABULARY & PHRASEBOOK TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  // 1. Version Endpoint
  const ver = await request('GET', '/content/version');
  assert(ver.status === 200 && ver.data.success, 'GET /content/version returns 200 OK with version');
  assert(ver.data.counts.vocabulary >= 10, 'Vocabulary seed loaded into database');
  assert(ver.data.counts.phrases >= 10, 'Phrases seed loaded into database');
  assert(ver.data.counts.categories >= 8, 'Categories seed loaded into database');

  // 2. Categories Endpoint
  const cats = await request('GET', '/categories');
  assert(cats.status === 200 && cats.data.data.length >= 8, 'GET /categories returns active categories');

  // 3. Search Vocabulary (English, Hindi, Telugu)
  const searchEn = await request('GET', '/vocabulary/search?q=actually');
  assert(searchEn.data.data.some(v => v.english.toLowerCase() === 'actually'), 'Search vocabulary by English ("actually") works');

  const searchHi = await request('GET', '/vocabulary/search?q=%E0%A4%85%E0%A4%B8%E0%A4%B2'); // असल
  assert(searchHi.data.data.length > 0, 'Search vocabulary by Hindi ("असल") works');

  // 4. Security Check: Normal user cannot write without admin key (401 Unauthorized)
  const unauthVocab = await request('POST', '/vocabulary', { english: 'Hacker', hindi: 'हैकर' });
  assert(unauthVocab.status === 401, 'Unauthorized POST /vocabulary returns 401 Unauthorized');

  const unauthPhrase = await request('POST', '/phrases', { english: 'Hacker', hindi: 'हैकर' });
  assert(unauthPhrase.status === 401, 'Unauthorized POST /phrases returns 401 Unauthorized');

  const unauthCat = await request('POST', '/categories', { name: 'Hacker' });
  assert(unauthCat.status === 401, 'Unauthorized POST /categories returns 401 Unauthorized');

  // 5. Admin Authorization Verify
  const authVerify = await request('POST', '/content/admin/verify', {}, { 'x-admin-key': ADMIN_KEY });
  assert(authVerify.status === 200 && authVerify.data.success, 'POST /content/admin/verify succeeds with admin key');

  // 6. Admin Add Vocabulary
  const newVocab = await request('POST', '/vocabulary', {
    english: 'collaborate',
    hindi: 'सहयोग करना',
    telugu: 'సహకరించు',
    transliteration: 'sahyog karna',
    category: 'Work',
    categoryId: 'cat-work',
    definition: 'To work jointly on an activity or project.',
    exampleEnglish: 'Let us collaborate on this task.',
    exampleHindi: 'आइए इस काम पर मिलकर काम करें।'
  }, { 'x-admin-key': ADMIN_KEY });
  assert(newVocab.status === 201 && newVocab.data.data.id, 'Admin can create new vocabulary word');
  const vocabId = newVocab.data.data.id;

  // 7. Admin Edit Vocabulary
  const updatedVocab = await request('PUT', `/vocabulary/${vocabId}`, {
    definition: 'To work together productively on a shared goal.'
  }, { 'x-admin-key': ADMIN_KEY });
  assert(updatedVocab.status === 200 && updatedVocab.data.data.definition.includes('productively'), 'Admin can update vocabulary word');

  // 8. Admin Soft Delete Vocabulary (Deactivate)
  const deleteVocab = await request('DELETE', `/vocabulary/${vocabId}`, null, { 'x-admin-key': ADMIN_KEY });
  assert(deleteVocab.status === 200, 'Admin can soft-delete vocabulary word');

  const verifyDeactivated = await request('GET', `/vocabulary/${vocabId}`);
  assert(verifyDeactivated.data.data.isActive === false, 'Vocabulary word is marked isActive = false for sync deletion');

  // 9. SECTION 27 WORKFLOW: Webmaster changes phrase "Are you free now?"
  console.log('\n--- Testing Section 27 Webmaster Change Workflow ---');
  // First, check phrase-2 exists
  const initialPhrase = await request('GET', '/phrases/phrase-2');
  assert(initialPhrase.data.data.english === 'Are you free now?', 'Found initial phrase "Are you free now?"');

  // Webmaster updates Hindi from "क्या तुम अभी फ्री हो?" to "क्या तुम अभी खाली हो?"
  const webmasterUpdate = await request('PUT', '/phrases/phrase-2', {
    hindi: 'क्या तुम अभी खाली हो?'
  }, { 'x-admin-key': ADMIN_KEY });
  assert(webmasterUpdate.status === 200 && webmasterUpdate.data.data.hindi === 'क्या तुम अभी खाली हो?', 'Webmaster edits Hindi translation to "क्या तुम अभी खाली हो?"');

  // Check sync diff returns updated phrase
  const syncDiff = await request('GET', '/content/sync?since=2026-10-01T00:00:00.000Z');
  assert(syncDiff.status === 200 && syncDiff.data.phrases.updated.some(p => p.id === 'phrase-2' && p.hindi === 'क्या तुम अभी खाली हो?'), 'Sync diff returns updated Hindi phrase for client IndexedDB update');

  // Revert back so database has original natural phrase
  await request('PUT', '/phrases/phrase-2', {
    hindi: 'क्या तुम अभी फ्री हो?'
  }, { 'x-admin-key': ADMIN_KEY });
  console.log('✓ Section 27 Workflow verified and reverted successfully.');

  // 10. Bulk Import Validation & Execution
  console.log('\n--- Testing Bulk CSV Import ---');
  const csvData = `english,hindi,telugu,category,note
Good morning,शुभ प्रभात,శుభోదయం,Greetings,Traditional morning greeting
See you later,बाद में मिलते हैं,తర్వాత కలుద్దాం,Greetings,Casual parting phrase`;

  const bulkImport = await request('POST', '/content/admin/import', {
    type: 'phrases',
    csvContent: csvData
  }, { 'x-admin-key': ADMIN_KEY });

  assert(bulkImport.status === 200 && bulkImport.data.result.imported === 2, 'Bulk CSV import processed and inserted 2 phrases successfully');

  // Cleanup imported test items
  const cleanupPhrases = await request('GET', '/phrases/search?q=Good%20morning');
  for (const item of cleanupPhrases.data.data) {
    if (item.english === 'Good morning') {
      await request('DELETE', `/phrases/${item.id}?hard=true`, null, { 'x-admin-key': ADMIN_KEY });
    }
  }
  const cleanupParting = await request('GET', '/phrases/search?q=See%20you%20later');
  for (const item of cleanupParting.data.data) {
    if (item.english === 'See you later') {
      await request('DELETE', `/phrases/${item.id}?hard=true`, null, { 'x-admin-key': ADMIN_KEY });
    }
  }

  // Cleanup vocabId
  await request('DELETE', `/vocabulary/${vocabId}?hard=true`, null, { 'x-admin-key': ADMIN_KEY });

  console.log(`\n========================================================`);
  console.log(` ALL TESTS PASSED: ${passed}/${total} assertions successful!`);
  console.log(`========================================================\n`);
}

runTests().catch(err => {
  console.error('\nTest suite execution failed:', err);
  process.exit(1);
});
