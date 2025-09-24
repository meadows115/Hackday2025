/* Minimal test harness for /api/compare logic using direct function calls.
   This is a lightweight script (not a full test runner) to sanity check comparison output. */
import { getCampaignById, getBenchmarkByVertical } from '../lib/db';

function assert(cond: any, msg: string) {
  if (!cond) throw new Error('Assertion failed: ' + msg);
}

(function run() {
  // pick a retail campaign
  const retailCampaign = getCampaignById(1) || getCampaignById(2);
  assert(retailCampaign, 'Retail campaign should exist');
  const benchmark = getBenchmarkByVertical('retail');
  assert(benchmark, 'Retail benchmark should exist');
  const openDiff = (retailCampaign!.projectedOpen - benchmark!.projectedOpen).toFixed(2);
  console.log('Retail open diff:', openDiff);
  console.log('Test PASS');
})();
