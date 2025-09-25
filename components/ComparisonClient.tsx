'use client';
import React from 'react';
import CampaignSelector from '@/components/selectors/CampaignSelector';
import MetricsChart from '@/components/MetricsChart';
import StoryPanel from '@/components/StoryPanel';
import Recommendations from '@/components/Recommendations';
import NhiPanel from '@/components/NhiPanel';
import AnomaliesPanel from '@/components/AnomaliesPanel';

interface Props {
  vertical: 'retail' | 'media';
  initialCampaignId?: number;
  dataset?: 'regular' | 'triggered'; // undefined => all
}

const ComparisonClient: React.FC<Props> = ({ initialCampaignId, vertical, dataset }) => {
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
  const [view, setView] = React.useState<'performance' | 'nhi'>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get('view');
      if (v === 'nhi') return 'nhi';
    }
    return 'performance';
  });
  const [showAdjusted, setShowAdjusted] = React.useState(false);
  const [start, setStart] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get('start');
      if (s) return s;
    }
    // default: 30 days ago
    const d = new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10);
  });
  const [end, setEnd] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const e = sp.get('end');
      if (e) return e;
    }
    return new Date().toISOString().slice(0,10);
  });

  React.useEffect(() => {
    if (!campaignId || view !== 'performance') return;
    let ignore = false;
    async function run() {
      setLoading(true); setError(null);
      try {
        const res = await fetch(`/api/compare?campaignId=${campaignId}&vertical=${vertical}`, { cache: 'no-store' });
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
  }, [campaignId, vertical, view]);

  React.useEffect(() => {
    let ignore = false;
    if (view !== 'performance') { setAggregate(null); return; }
    async function run() {
      const params = new URLSearchParams();
      params.set('vertical', vertical);
      if (dataset) params.set('type', dataset);
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const res = await fetch(`/api/campaigns?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!ignore) setAggregate(json.aggregate || null);
    }
    run();
    return () => { ignore = true; };
  }, [vertical, dataset, view, start, end]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    sp.set('view', view);
    if (campaignId) sp.set('cid', String(campaignId)); else sp.delete('cid');
    if (start) sp.set('start', start);
    if (end) sp.set('end', end);
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [view, campaignId, start, end]);

  const integrityColors: Record<string,string> = { good: 'var(--color-evergreen)', watch: 'var(--color-sun)', inflated: 'var(--color-negative)' };

  const performanceContent = !loading && !error && data && campaignId && (
    <>
      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', fontSize:12 }}>
        {data.adjusted && (
          <div style={{ background:'var(--color-shell)', border:'1px solid var(--color-mist)', padding:'0.4rem 0.6rem', borderRadius:4, display:'flex', alignItems:'center', gap:6 }}>
            <label style={{ display:'flex', gap:4, alignItems:'center', cursor:'pointer' }}>
              <input type="checkbox" checked={showAdjusted} onChange={()=> setShowAdjusted(v=> !v)} /> Adjusted Metrics
            </label>
            <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
              Integrity <span style={{ padding:'0 6px', borderRadius:12, background: integrityColors[data.adjusted.integrity], color:'white', fontSize:10 }}>{data.adjusted.integrity.toUpperCase()}</span>
            </span>
          </div>
        )}
      </div>
      <MetricsChart
        campaign={data.campaign}
        benchmark={data.benchmark}
        adjustedMeta={data.adjusted ? { openAdj: data.adjusted.openAdj, ctrAdj: data.adjusted.ctrAdj, nhiTotal: data.adjusted.nhiTotal, nhiBenchTotal: data.adjusted.nhiBenchTotal } : null}
        showAdjusted={showAdjusted}
      />
      <StoryPanel campaign={data.campaign} benchmark={data.benchmark} deltas={data.deltas} />
      <AnomaliesPanel deltas={data.deltas} benchmark={data.benchmark} adjusted={data.adjusted ? { openAdj: data.adjusted.openAdj, ctrAdj: data.adjusted.ctrAdj, nhiTotal: data.adjusted.nhiTotal, nhiBenchTotal: data.adjusted.nhiBenchTotal, integrity: data.adjusted.integrity } : null} />
      <Recommendations deltas={data.deltas} />
    </>
  );

  return (
    <div style={{ marginTop: '1rem', display: 'grid', gap: '0.9rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: 12, minWidth:250 }}>Campaign
          <CampaignSelector value={campaignId} onChange={setCampaignId} filterVertical={vertical} filterType={dataset} start={start} end={end} />
        </label>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, fontSize: 12, alignItems: 'center' }}>
          <span>View:</span>
          <select value={view} onChange={e=> setView(e.target.value as any)} style={{ fontSize: 12 }}>
            <option value="performance">Campaign Performance</option>
            <option value="nhi">NHI</option>
          </select>
        </div>
      </div>
      <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
        <div style={{ display:'flex', flexDirection:'column', fontSize:12 }}>
          <span style={{ marginBottom:4 }}>Start</span>
          <input type="date" value={start} max={end} onChange={e=> setStart(e.target.value)} style={{ fontSize:12 }} />
        </div>
        <div style={{ display:'flex', flexDirection:'column', fontSize:12 }}>
          <span style={{ marginBottom:4 }}>End</span>
          <input type="date" value={end} min={start} onChange={e=> setEnd(e.target.value)} style={{ fontSize:12 }} />
        </div>
      </div>
      {view === 'performance' && aggregate && (
        <div style={{ fontSize: 12, background: 'var(--color-shell)', border: '1px solid var(--color-mist)', padding: '0.5rem 0.75rem', borderRadius: 4, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span><strong>Aggregate ({aggregate.count})</strong></span>
          <span>Open: {aggregate.projectedOpen.toFixed(2)}%</span>
          <span>CTR: {aggregate.ctr.toFixed(2)}%</span>
          <span>RPM: {aggregate.rpm.toFixed(2)}</span>
        </div>
      )}
      {loading && view === 'performance' && <p>Loading comparison...</p>}
      {error && <p style={{ color: 'var(--color-negative)' }}>{error}</p>}
      {view === 'performance' && performanceContent}
      {view === 'performance' && !loading && !error && !campaignId && <p>Select a campaign to view metrics and narrative.</p>}
      {view === 'nhi' && <NhiPanel campaignId={campaignId} vertical={vertical} dataset={dataset} />}
    </div>
  );
};

export default ComparisonClient;
