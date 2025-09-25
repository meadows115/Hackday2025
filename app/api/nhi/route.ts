import { getCampaignNhi, getNhiBenchmark } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaignId = Number(searchParams.get('campaignId'));
  const vertical = (searchParams.get('vertical') || '').toLowerCase();
  if (!campaignId || !vertical) {
    return Response.json({ error: 'campaignId and vertical are required' }, { status: 400 });
  }
  const nhi = getCampaignNhi(campaignId);
  if (!nhi) return Response.json({ error: 'NHI not found' }, { status: 404 });
  const bench = getNhiBenchmark(vertical);
  if (!bench) return Response.json({ error: 'Benchmark not found' }, { status: 404 });
  const deltas = {
    gmailDiff: nhi.gmail - bench.gmail,
    yahooDiff: nhi.yahoo - bench.yahoo,
    otherDiff: nhi.other - bench.other,
    totalDiff: nhi.total - bench.total
  };
  return Response.json({ campaign: nhi, benchmark: bench, deltas });
}
