import { aggregateNhi } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vertical = (searchParams.get('vertical') || '').toLowerCase();
  const type = (searchParams.get('type') || '').toLowerCase();
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  if (!vertical || !start || !end) {
    return Response.json({ error: 'vertical, start, end required' }, { status: 400 });
  }
  const agg = aggregateNhi(vertical, start, end, (type === 'regular' || type === 'triggered') ? type : 'all');
  return Response.json({ aggregate: agg });
}
