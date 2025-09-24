import { getCampaignById, getBenchmarkByVertical } from '@/lib/db';

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

  const deltas = {
    openDiff: campaign.projectedOpen - benchmark.projectedOpen,
    ctrDiff: campaign.ctr - benchmark.ctr,
    rpmDiff: campaign.rpm - benchmark.rpm
  };

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
    deltas
  });
}
