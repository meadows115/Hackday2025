import { listCampaigns, aggregateCampaignMetrics } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vertical = (searchParams.get('vertical') || '').toLowerCase();
  const type = (searchParams.get('type') || '').toLowerCase(); // regular|triggered
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  let campaigns = listCampaigns();
  if (vertical) campaigns = campaigns.filter(c => c.vertical === vertical);
  if (type === 'regular' || type === 'triggered') campaigns = campaigns.filter(c => (c.type || 'regular') === type);
  if (start && end) campaigns = campaigns.filter(c => c.sentAt && c.sentAt >= start && c.sentAt <= end + 'T23:59:59');

  let aggregate: any = null;
  if (vertical && start && end) {
    aggregate = aggregateCampaignMetrics(vertical, start, end, (type === 'regular' || type === 'triggered') ? type : 'all');
  }
  return Response.json({ campaigns, aggregate });
}
