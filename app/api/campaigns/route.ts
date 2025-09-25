import { NextResponse } from 'next/server';

interface Campaign {
	id: number;
	name: string;
	projectedOpen: number; // percent
	ctr: number; // percent
	rpm: number; // revenue per thousand
	vertical: 'retail' | 'media';
	type: 'regular' | 'triggered';
	windowDays?: number;
	sentAt: string; // ISO date
}

// In-memory synthetic dataset (persist across hot reloads while module lives)
let DATASET: Campaign[] | null = null;

function seedData() {
	if (DATASET) return;
	const campaigns: Campaign[] = [];
	const now = new Date();
	const dayMs = 86400000;
	let id = 1;
	const verticals: Array<'retail'|'media'> = ['retail','media'];
	for (let d = 0; d < 90; d++) { // last 90 days
		const date = new Date(now.getTime() - d * dayMs);
		verticals.forEach(v => {
			// 1-2 regular + possible triggered per day per vertical
			const regularCount = 1 + ((d + (v==='media'?1:0)) % 2); // alternate 1/2
			for (let r=0;r<regularCount;r++) {
				campaigns.push(genCampaign(id++, v, 'regular', date));
			}
			if ((d % 3) === 0) { // triggered every 3rd day
				campaigns.push(genCampaign(id++, v, 'triggered', date));
			}
		});
	}
	DATASET = campaigns;
}

function genCampaign(id:number, vertical:'retail'|'media', type:'regular'|'triggered', date:Date): Campaign {
	const baseOpen = vertical==='retail'? 18 : 16; // percent
	const openVar = (hash(id)*4) - 2; // -2..+2
	const projectedOpen = +(baseOpen + openVar + (type==='triggered'? 6:0)).toFixed(2);
	const baseCtr = vertical==='retail'? 2.4 : 2.1;
	const ctrVar = (hash(id+17)*0.8)-0.4;
	const ctr = +(baseCtr + ctrVar + (type==='triggered'? 0.6:0)).toFixed(2);
	const baseRpm = vertical==='retail'? 42 : 38;
	const rpmVar = (hash(id+53)*10)-5;
	const rpm = +(baseRpm + rpmVar + (type==='triggered'? 8:0)).toFixed(2);
	const windowDays = type==='triggered'? (3 + Math.floor(hash(id+91)*5)) : undefined;
	return {
		id,
		name: `${vertical === 'retail' ? 'Retail' : 'Media'} ${type==='triggered'?'Flow':'Campaign'} ${id}`,
		projectedOpen,
		ctr,
		rpm,
		vertical,
		type,
		windowDays,
		sentAt: date.toISOString().slice(0,10)
	};
}

function hash(n:number) { // deterministic 0..1
	const x = Math.sin(n * 9999) * 10000;
	return x - Math.floor(x);
}

export const runtime = 'nodejs';

export async function GET(req: Request) {
	seedData();
	const { searchParams } = new URL(req.url);
	const vertical = (searchParams.get('vertical') || '').toLowerCase() as 'retail'|'media'|'';
	const type = (searchParams.get('type') || 'all') as 'regular'|'triggered'|'all';
	const start = searchParams.get('start');
	const end = searchParams.get('end');

	if (!vertical) return NextResponse.json({ error: 'vertical required' }, { status:400 });

	let list = (DATASET as Campaign[]).filter(c => c.vertical === vertical);
	if (type !== 'all') list = list.filter(c => c.type === type);

	// Date filtering (inclusive)
	if (start) list = list.filter(c => c.sentAt >= start);
	if (end) list = list.filter(c => c.sentAt <= end);

	// Sort newest first
	list.sort((a,b)=> (a.sentAt < b.sentAt ? 1 : (a.sentAt > b.sentAt ? -1 : 0)));

	// Aggregate metrics (simple average)
	const aggregate = list.length ? {
		count: list.length,
		projectedOpen: list.reduce((s,c)=> s + c.projectedOpen,0) / list.length,
		ctr: list.reduce((s,c)=> s + c.ctr,0) / list.length,
		rpm: list.reduce((s,c)=> s + c.rpm,0) / list.length
	} : { count:0, projectedOpen:0, ctr:0, rpm:0 };

	return NextResponse.json({ campaigns: list, aggregate });
}

