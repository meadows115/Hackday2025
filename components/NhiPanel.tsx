'use client';
import React from 'react';
import NhiChart from '@/components/NhiChart';
import InfoTooltip from '@/components/InfoTooltip';

interface Props {
  campaignId?: number;
  vertical: 'retail' | 'media';
  dataset?: 'regular' | 'triggered';
  dateRange?: { start: string; end: string };
}

const NhiPanel: React.FC<Props> = ({ campaignId, vertical, dataset, dateRange }) => {
  const [campaignData, setCampaignData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [aggregate, setAggregate] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (!campaignId) return;
    let ignore = false; setLoading(true); setError(null);
    fetch(`/api/nhi?campaignId=${campaignId}&vertical=${vertical}`, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('Failed fetch'); return r.json(); })
      .then(j => { if (!ignore) setCampaignData(j); })
      .catch(e => { if (!ignore) setError(e.message); })
      .finally(()=> { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [campaignId, vertical]);

  React.useEffect(() => {
    if (!dateRange) { setAggregate(null); return; }
    let ignore = false;
    const p = new URLSearchParams();
    p.set('vertical', vertical);
    p.set('start', dateRange.start);
    p.set('end', dateRange.end);
    if (dataset) p.set('type', dataset);
    fetch(`/api/nhi-aggregate?${p.toString()}`, { cache: 'no-store' })
      .then(r=> r.json())
      .then(j=> { if(!ignore) setAggregate(j.aggregate || null); });
    return () => { ignore = true; };
  }, [vertical, dataset, dateRange?.start, dateRange?.end]);

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {aggregate && (
        <div style={{ fontSize: 12, background: 'var(--color-shell)', border: '1px solid var(--color-mist)', padding: '0.5rem 0.75rem', borderRadius: 4, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ display:'flex', alignItems:'center', gap:4 }}><strong>Aggregate NHI ({aggregate.count})</strong><InfoTooltip label="Aggregate NHI">Average domain-level NHI across all matching campaigns in the selected period.</InfoTooltip></span>
          <span>Gmail: {aggregate.gmail.toFixed(2)}% <InfoTooltip label="Gmail NHI">Estimated automated activity attributed to Gmail infrastructure (image proxy preloads, security scans).</InfoTooltip></span>
          <span>Yahoo: {aggregate.yahoo.toFixed(2)}% <InfoTooltip label="Yahoo NHI">Automated opens from Yahoo / AOL related security or proxy systems.</InfoTooltip></span>
          <span>Other: {aggregate.other.toFixed(2)}% <InfoTooltip label="Other NHI">All remaining domains / filters (including corporate gateways) not classified as Gmail or Yahoo.</InfoTooltip></span>
          <span>Total: {aggregate.total.toFixed(2)}% <InfoTooltip label="Total NHI">Sum of domain buckets. When elevated, real engagement KPIs (open/CTR) may be overstated.</InfoTooltip></span>
        </div>
      )}
      {loading && <p>Loading NHI...</p>}
      {error && <p style={{ color: 'var(--color-negative)' }}>{error}</p>}
      {!loading && !error && campaignId && campaignData && (
        <>
          <NhiChart campaign={campaignData.campaign} benchmark={campaignData.benchmark} />
          <div style={{ fontSize: 12, background: 'var(--color-shell)', border: '1px solid var(--color-mist)', padding: '0.75rem', borderRadius: 4 }}>
            <strong style={{ display:'flex', alignItems:'center', gap:4 }}>Story<InfoTooltip label="Story">Contextual interpretation of campaign NHI versus vertical benchmark.</InfoTooltip></strong>
            <p style={{ margin: '0.5rem 0 0' }}>
              Total NHI is {campaignData.campaign.total.toFixed(2)}% vs benchmark {campaignData.benchmark.total.toFixed(2)}% ({(campaignData.deltas.totalDiff>=0?'+':'')+campaignData.deltas.totalDiff.toFixed(2)} pts). Gmail delta {campaignData.deltas.gmailDiff.toFixed(2)} pts; Yahoo delta {campaignData.deltas.yahooDiff.toFixed(2)} pts; Other delta {campaignData.deltas.otherDiff.toFixed(2)} pts.
              {campaignData.deltas.totalDiff > 0.5 && ' This campaign shows materially higher automated activity—consider isolating real-user engagement using click data or tightening bot filtering.'}
              {campaignData.deltas.gmailDiff > 0.4 && ' Spike driven largely by Gmail—often caused by image proxy prefetch; evaluate if you rely on open-triggered journeys.'}
              {campaignData.deltas.otherDiff > 0.6 && ' High “Other” bucket suggests broad security gateway scanning (common for B2B audiences).'}
            </p>
          </div>
        </>
      )}
      {!loading && !error && !campaignId && <p>Select a campaign to view NHI details.</p>}
    </div>
  );
};
export default NhiPanel;
