import Papa from 'papaparse';
import { insertCampaigns, Campaign } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
  return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    if (parsed.errors.length) {
  return Response.json({ error: 'CSV parse error', details: parsed.errors }, { status: 400 });
    }

    // Map CSV header fields to Campaign structure.
    // Assuming CSV columns: name, subject, projectedOpen, ctr, rpm, vertical OR similar "Email Summary" format.
    const campaigns: Campaign[] = [];
    for (const row of parsed.data) {
      if (!row.name) continue;
      const c: Campaign = {
        name: row.name,
        subject: row.subject || row.Subject || 'N/A',
        projectedOpen: Number(row.projectedOpen || row.open || row.Open || row["Projected Open"] || 0),
        ctr: Number(row.ctr || row.CTR || row["CTR"] || 0),
        rpm: Number(row.rpm || row.RPM || row["RPM"] || 0),
        vertical: (row.vertical || row.Vertical || 'retail').toLowerCase()
      };
      // Basic validation
      if (isNaN(c.projectedOpen) || isNaN(c.ctr) || isNaN(c.rpm)) continue;
      campaigns.push(c);
    }

    const inserted = insertCampaigns(campaigns);
    return Response.json({ inserted });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
