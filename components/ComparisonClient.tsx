'use client';
import React from 'react';
import CampaignSelector from '@/components/selectors/CampaignSelector';
import VerticalSelector from '@/components/selectors/VerticalSelector';
import MetricsChart from '@/components/MetricsChart';
import StoryPanel from '@/components/StoryPanel';
import Recommendations from '@/components/Recommendations';

interface Props {
  initialCampaignId?: number;
  initialVertical?: string;
}

const ComparisonClient: React.FC<Props> = ({ initialCampaignId, initialVertical }) => {
  const [campaignId, setCampaignId] = React.useState<number | undefined>(initialCampaignId);
  const [vertical, setVertical] = React.useState<string | undefined>(initialVertical);
  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!campaignId || !vertical) return;
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

  return (
    <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>Campaign
          <CampaignSelector value={campaignId} onChange={setCampaignId} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12 }}>Vertical
          <VerticalSelector value={vertical} onChange={setVertical} />
        </label>
      </div>
      {loading && <p>Loading comparison...</p>}
      {error && <p style={{ color: 'var(--color-negative)' }}>{error}</p>}
      {!loading && !error && data && (
        <>
          <MetricsChart campaign={data.campaign} benchmark={data.benchmark} />
          <StoryPanel campaign={data.campaign} benchmark={data.benchmark} deltas={data.deltas} />
          <Recommendations deltas={data.deltas} />
        </>
      )}
      {!loading && !error && (!campaignId || !vertical) && <p>Select a campaign and vertical.</p>}
    </div>
  );
};

export default ComparisonClient;
