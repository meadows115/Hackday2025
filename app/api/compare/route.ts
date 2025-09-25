import { getCampaignById, getBenchmarkByVertical, getCampaignNhi, getNhiBenchmark } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = Number(searchParams.get('campaignId'));
  const vertical = (searchParams.get('vertical') || '').toLowerCase();

  if (!campaignId || !vertical) {
    return Response.json({ error: 'campaignId and vertical are required' }, { status: 400 });
  }

  const campaign = getCampaignById(campaignId);
  if (!campaign) {
    return Response.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const benchmark = getBenchmarkByVertical(vertical);
  if (!benchmark) {
    return Response.json({ error: 'Benchmark not found' }, { status: 404 });
  }

  // Base deltas
  const deltas = {
    openDiff: campaign.projectedOpen - benchmark.projectedOpen,
    ctrDiff: campaign.ctr - benchmark.ctr,
    rpmDiff: campaign.rpm - benchmark.rpm
  };

  // NHI context (optional, do not fail if missing)
  const nhi = getCampaignNhi(campaignId);
  const nhiBench = getNhiBenchmark(vertical);
  let adjusted = null as null | { projectedOpen: number; ctr: number; rpm: number; openAdj: number; ctrAdj: number; integrity: 'good' | 'watch' | 'inflated'; nhiTotal?: number; nhiBenchTotal?: number };
  let opportunityScore: number | null = null;

  if (nhi && nhiBench) {
    // Adjust opens & CTR downward by removing NHI proportion (simple model: treat NHI as non-engaged opens that inflate open denominator)
    const inflationFactor = (nhi.total || 0) / Math.max(0.0001, nhiBench.total);
    const openAdj = +(campaign.projectedOpen * (1 - (nhi.total/100))).toFixed(2);
    // CTR adjustment: if opens shrink, CTR relative to opens may rise; we present CTRAdj as CTR * (1 - NHI%) simplistically for conservative view.
    const ctrAdj = +(campaign.ctr * (1 - (nhi.total/100))).toFixed(2);
    const integrity: 'good' | 'watch' | 'inflated' = (nhi.total <= nhiBench.total * 1.15) ? 'good' : (nhi.total <= nhiBench.total * 1.6 ? 'watch' : 'inflated');
    adjusted = { projectedOpen: campaign.projectedOpen, ctr: campaign.ctr, rpm: campaign.rpm, openAdj, ctrAdj, integrity, nhiTotal: nhi.total, nhiBenchTotal: nhiBench.total };

    // Opportunity Score: weighted shortfalls with NHI inflation scaling
    const wOpen = 0.4, wCtr = 0.3, wRpm = 0.3;
    const shortOpen = Math.max(0, benchmark.projectedOpen - openAdj); // use adjusted
    const shortCtr = Math.max(0, benchmark.ctr - ctrAdj);
    const shortRpm = Math.max(0, benchmark.rpm - campaign.rpm);
    const base = wOpen*shortOpen + wCtr*shortCtr + wRpm*shortRpm; // raw points
    const inflationMultiplier = 1 + Math.max(0, (nhi.total - nhiBench.total) / Math.max(1, nhiBench.total)) * 0.5; // amplify if inflated
    opportunityScore = Math.min(100, +(base * inflationMultiplier).toFixed(2));
  }

  return Response.json({
    campaign: {
      projectedOpen: campaign.projectedOpen,
      ctr: campaign.ctr,
      rpm: campaign.rpm,
      type: campaign.type,
      windowDays: campaign.windowDays ?? null
    },
    benchmark: {
      projectedOpen: benchmark.projectedOpen,
      ctr: benchmark.ctr,
      rpm: benchmark.rpm
    },
    deltas,
    adjusted,
    opportunityScore
  });
}
