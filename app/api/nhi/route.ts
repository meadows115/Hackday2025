import { NextResponse } from 'next/server';

// Placeholder in-memory store (since original db implementation is missing in current snapshot)
// In a real scenario this would query SQLite. We provide deterministic pseudo-values for now.
function syntheticBenchmark(vertical: string) {
	const seed = vertical === 'media' ? 0.11 : 0.085;
	return { gmail: seed * 0.55 * 100, yahoo: seed * 0.2 * 100, other: seed * 0.25 * 100, total: seed * 100 };
}

function syntheticCampaign(id: number, vertical: string) {
	const base = syntheticBenchmark(vertical);
	// add slight variation using id hash
	const mod = ((id * 9301 + 49297) % 233280) / 233280; // 0..1
	const inflate = 0.75 + mod * 1.1; // 0.75 .. 1.85
	const total = Math.min(base.total * inflate, 30); // cap 30%
	const gmail = total * 0.6;
	const yahoo = total * 0.18;
	const other = total - gmail - yahoo;
	return { gmail, yahoo, other, total };
}

export const runtime = 'nodejs';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const campaignId = Number(searchParams.get('campaignId'));
	const vertical = (searchParams.get('vertical') || '').toLowerCase();
	if (!campaignId || !vertical) {
		return NextResponse.json({ error: 'campaignId and vertical are required' }, { status: 400 });
	}
	const benchmark = syntheticBenchmark(vertical);
	const campaignNhi = syntheticCampaign(campaignId, vertical);
	return NextResponse.json({ benchmark, campaignNhi });
}

