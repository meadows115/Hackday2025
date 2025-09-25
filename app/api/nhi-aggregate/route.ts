import { NextResponse } from 'next/server';

function syntheticBenchmark(vertical: string, type?: string) {
	// vary slightly by type to simulate triggered flows being cleaner
	const base = vertical === 'media' ? 0.11 : 0.085; // 11% vs 8.5%
	const adj = type === 'triggered' ? base * 0.85 : base;
	return { gmail: adj * 0.55 * 100, yahoo: adj * 0.2 * 100, other: adj * 0.25 * 100, total: adj * 100 };
}

export const runtime = 'nodejs';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const vertical = (searchParams.get('vertical') || '').toLowerCase();
	const type = searchParams.get('type') || undefined;
	if (!vertical) return NextResponse.json({ error: 'vertical required' }, { status: 400 });
	const benchmark = syntheticBenchmark(vertical, type);
	return NextResponse.json({ benchmark });
}

