"use client";
import React from 'react';
import NhiChart from './NhiChart';

interface NhiSet { gmail: number; yahoo: number; other: number; total: number; }

interface Props {
	campaignId?: number;
	vertical: 'retail' | 'media';
	dataset?: 'regular' | 'triggered';
}

const PanelSkeleton: React.FC<{label:string}> = ({ label }) => (
	<div style={{ border:'1px solid var(--color-mist)', background:'var(--color-shell)', padding:'0.75rem 0.9rem', borderRadius:4, fontSize:12 }}>
		<h3 style={{ margin:'0 0 0.4rem', fontSize:13, fontWeight:600 }}>{label}</h3>
		<p style={{ margin:0 }}>Loading…</p>
	</div>
);

const NhiPanel: React.FC<Props> = ({ campaignId, vertical, dataset }) => {
	const [campaignNhi, setCampaignNhi] = React.useState<NhiSet | null>(null);
	const [benchmarkNhi, setBenchmarkNhi] = React.useState<NhiSet | null>(null);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		let ignore = false;
		async function load() {
			setLoading(true); setError(null);
			try {
				const benchParams = new URLSearchParams();
				benchParams.set('vertical', vertical);
				if (dataset) benchParams.set('type', dataset);
				const benchRes = await fetch(`/api/nhi-aggregate?${benchParams.toString()}`, { cache: 'no-store' });
				const benchJson = await benchRes.json();
				if (!benchRes.ok) throw new Error('Failed to load NHI benchmark');
				if (!ignore) setBenchmarkNhi(benchJson.benchmark);
				if (campaignId) {
					const cParams = new URLSearchParams();
						cParams.set('vertical', vertical);
						cParams.set('campaignId', String(campaignId));
					const cRes = await fetch(`/api/nhi?${cParams.toString()}`, { cache: 'no-store' });
					const cJson = await cRes.json();
					if (!cRes.ok) throw new Error('Failed to load campaign NHI');
					if (!ignore) setCampaignNhi(cJson.campaignNhi);
				} else {
					if (!ignore) setCampaignNhi(null);
				}
			} catch (e:any) {
				if (!ignore) setError(e.message);
			} finally {
				if (!ignore) setLoading(false);
			}
		}
		load();
		return () => { ignore = true; };
	}, [campaignId, vertical, dataset]);

	if (error) return <div style={{ color:'var(--color-negative)', fontSize:12 }}>Error: {error}</div>;
	if (loading || !benchmarkNhi) return <PanelSkeleton label="NHI" />;

	const mine = campaignNhi?.total;
	const peer = benchmarkNhi.total;
	let story: string;
	if (mine == null) {
		story = `Peer NHI is ${peer.toFixed(2)}%. Select a campaign to compare.`;
	} else {
		const ratio = peer === 0 ? 1 : mine / peer;
		if (ratio <= 0.9) story = `Your NHI (${mine.toFixed(2)}%) is lower than peers (${peer.toFixed(2)}%). Good list hygiene.`;
		else if (ratio < 1.15) story = `Your NHI (${mine.toFixed(2)}%) is in line with peers (${peer.toFixed(2)}%).`;
		else if (ratio < 1.5) story = `Your NHI (${mine.toFixed(2)}%) is moderately higher than peers (${peer.toFixed(2)}%). Monitor new acquisition sources.`;
		else story = `Your NHI (${mine.toFixed(2)}%) is significantly higher than peers (${peer.toFixed(2)}%). Review filtering of inactive or suspicious addresses.`;
	}

		// Provider-specific callouts (only when we have a campaign selected)
		let providerCallouts: string[] = [];
		if (campaignNhi) {
			const provs: Array<keyof NhiSet> = ['gmail','yahoo','other'];
			const labels: Record<string,string> = { gmail: 'Gmail', yahoo: 'Yahoo', other: 'Other' };
			const cTotal = campaignNhi.total || 0.0001;
			const bTotal = benchmarkNhi.total || 0.0001;
			// Build share comparisons
			interface ProvInfo { key: keyof NhiSet; shareDiff: number; shareCampaign: number; shareBenchmark: number; };
			const diffs: ProvInfo[] = provs.map(p => ({
				key: p,
				shareDiff: (campaignNhi[p]/cTotal) - (benchmarkNhi[p]/bTotal),
				shareCampaign: campaignNhi[p]/cTotal,
				shareBenchmark: benchmarkNhi[p]/bTotal
			}));
			// Identify primary driver: largest positive shareDiff
			const primary = diffs.sort((a,b)=> b.shareDiff - a.shareDiff)[0];
			const elevated = mine != null && mine > peer * 1.15; // elevated threshold from narrative
			if (elevated && primary.shareDiff > 0.05) {
				providerCallouts.push(`${labels[primary.key]} drives the uplift: ${(primary.shareCampaign*100).toFixed(1)}% of your NHI vs ${(primary.shareBenchmark*100).toFixed(1)}% in peers.`);
			}
			// Additional notable providers (other positive diffs above 7 p.p.) excluding primary
			diffs.filter(d => d.key !== primary.key && d.shareDiff > 0.07).forEach(d => {
				providerCallouts.push(`${labels[d.key]} share is elevated (${(d.shareCampaign*100).toFixed(1)}% vs ${(d.shareBenchmark*100).toFixed(1)}%).`);
			});
			// If no elevated but one provider dominates overall share >60%
			if (!providerCallouts.length) {
				const dominant = diffs.find(d => d.shareCampaign > 0.6);
				if (dominant) providerCallouts.push(`${labels[dominant.key]} represents the majority of NHI activity (${(dominant.shareCampaign*100).toFixed(1)}%).`);
			}
		}

	return (
		<div style={{ display:'grid', gap:'1rem' }}>
			<NhiChart campaign={campaignNhi || undefined} benchmark={benchmarkNhi} />
			<div style={{ border:'1px solid var(--color-mist)', background:'var(--color-shell)', padding:'0.75rem 0.9rem', borderRadius:4, fontSize:12, lineHeight:1.4 }}>
				<h3 style={{ margin:'0 0 0.4rem', fontSize:13, fontWeight:600 }}>Story</h3>
						<p style={{ margin:'0 0 0.4rem' }}>{story}</p>
						{providerCallouts.length > 0 && (
							<ul style={{ margin:0, padding:'0 0 0 1.1rem', display:'flex', flexDirection:'column', gap:2 }}>
								{providerCallouts.map((c,i)=>(<li key={i}>{c}</li>))}
							</ul>
						)}
			</div>
		</div>
	);
};

export default NhiPanel;

