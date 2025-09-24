// Minimal test harness: open sqlite directly and compute a diff.
const Database = require('better-sqlite3');

function assert(cond, msg) { if (!cond) throw new Error('Assertion failed: ' + msg); }

(function run() {
  const db = new Database('benchmark.db');
  // Ensure schema exists by touching tables (they should have been created via app usage; if not, fail gracefully)
  const hasBench = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='benchmarks'").get();
  const hasCamp = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='campaigns'").get();
  assert(hasBench && hasCamp, 'Expected benchmarks and campaigns tables');
  const campaign = db.prepare('SELECT * FROM campaigns ORDER BY id ASC LIMIT 1').get();
  assert(campaign, 'At least one campaign present');
  const benchmark = db.prepare('SELECT * FROM benchmarks WHERE vertical = ?').get(campaign.vertical);
  assert(benchmark, 'Benchmark present for campaign vertical');
  const openDiff = (campaign.projectedOpen - benchmark.projectedOpen).toFixed(2);
  console.log('[sanity] vertical:', campaign.vertical);
  console.log('[sanity] open diff:', openDiff);
  console.log('Test PASS');
})();
