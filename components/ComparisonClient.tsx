'use client';
import React from 'react';
import CampaignSelector from '@/components/selectors/CampaignSelector';
import MetricsChart from '@/components/MetricsChart';
import StoryPanel from '@/components/StoryPanel';
import Recommendations from '@/components/Recommendations';

interface Props {
  vertical: 'retail' | 'media';
  initialCampaignId?: number;
  dataset?: 'regular' | 'triggered'; // undefined => all
  dateRange?: { start: string; end: string };
}

const ComparisonClient: React.FC<Props> = ({ initialCampaignId, vertical, dataset, dateRange }) => {
  const [campaignId, setCampaignId] = React.useState<number | undefined>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const cid = sp.get('cid');
      if (cid) return Number(cid);
    }
    return initialCampaignId;
  });
  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [aggregate, setAggregate] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (!campaignId) return;
    let ignore = false;
    async function run() {
      setLoading(true); setError(null);
      try {
  const res = await fetch(`/api/compare?campaignId=${campaignId}&vertical=${vertical}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch comparison');
        const json = await res.json();
        if (!ignore) setData(json);
      } catch (e: any) {
        if (!ignore) setError(e.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    run();
    return () => { ignore = true; };
  }, [campaignId, vertical]);

  // Fetch aggregate when vertical / dataset / dateRange changes
  React.useEffect(() => {
    if (!dateRange) { setAggregate(null); return; }
    let ignore = false;
    async function run() {
      const params = new URLSearchParams();
      params.set('vertical', vertical);
  params.set('start', dateRange!.start);
  params.set('end', dateRange!.end);
      if (dataset) params.set('type', dataset);
      const res = await fetch(`/api/campaigns?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!ignore) setAggregate(json.aggregate || null);
    }
    run();
    return () => { ignore = true; };
  }, [vertical, dataset, dateRange?.start, dateRange?.end]);

  return (
    <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
      {aggregate && (
        <div style={{ fontSize: 12, background: 'var(--color-shell)', border: '1px solid var(--color-mist)', padding: '0.5rem 0.75rem', borderRadius: 4, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span><strong>Aggregate ({aggregate.count})</strong></span>
          <span>Open: {aggregate.projectedOpen.toFixed(2)}%</span>
          <span>CTR: {aggregate.ctr.toFixed(2)}%</span>
          <span>RPM: {aggregate.rpm.toFixed(2)}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: aggregate ? '0.75rem' : undefined }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>Campaign
          <CampaignSelector value={campaignId} onChange={setCampaignId} filterVertical={vertical} filterType={dataset} dateRange={dateRange} />
        </label>
  <div style={{ fontSize: 12, padding: '0.5rem 0' }}>Vertical: <strong>{vertical}</strong></div>
  {dateRange ? <div style={{ fontSize: 12, padding: '0.5rem 0' }}>Range: {dateRange.start} → {dateRange.end}</div> : <div style={{ fontSize: 12, padding: '0.5rem 0', visibility:'hidden' }}>Range:</div>}
  {dataset ? <div style={{ fontSize: 12, padding: '0.5rem 0' }}>Dataset: <strong>{dataset}</strong></div> : <div style={{ fontSize: 12, padding: '0.5rem 0', visibility:'hidden' }}>Dataset:</div>}
      </div>
      {loading && <p>Loading comparison...</p>}
      {error && <p style={{ color: 'var(--color-negative)' }}>{error}</p>}
  {!loading && !error && data && campaignId && (
        <>
          <MetricsChart campaign={data.campaign} benchmark={data.benchmark} />
          <StoryPanel campaign={data.campaign} benchmark={data.benchmark} deltas={data.deltas} />
          <Recommendations deltas={data.deltas} />
        </>
      )}
  {!loading && !error && !campaignId && <p>Select a campaign to view metrics and narrative.</p>}
    </div>
  );
};

export default ComparisonClient;
