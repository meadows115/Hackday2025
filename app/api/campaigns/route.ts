import { listCampaigns } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const campaigns = listCampaigns();
  return Response.json({ campaigns });
}
