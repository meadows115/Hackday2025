'use client';
import React from 'react';
import ComparisonClient from '@/components/ComparisonClient';

interface TabsProps { retailFirstId?: number; mediaFirstId?: number; }

const Tabs: React.FC<TabsProps> = ({ retailFirstId, mediaFirstId }) => {
  const [tab, setTab] = React.useState<'retail' | 'media'>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get('v');
      if (v === 'retail' || v === 'media') return v;
    }
    return 'retail';
  });
  const [dataset, setDataset] = React.useState<'all' | 'regular' | 'triggered'>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
  const ds = sp.get('ds');
  if (ds === 'all' || ds === 'regular' || ds === 'triggered') return ds;
  if (ds === 'campaigns') return 'regular';
    }
    return 'all';
  });
  const [mounted, setMounted] = React.useState(false);
  const [range, setRange] = React.useState<{start: string; end: string} | null>(null);
  React.useEffect(() => {
    const now = new Date();
    const start = new Date(now.getTime() - 7*24*60*60*1000);
    const r = { start: start.toISOString().slice(0,10), end: now.toISOString().slice(0,10) };
    setRange(r); setMounted(true);
  }, []);

  // keep state in URL
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    sp.set('v', tab);
  sp.set('ds', dataset === 'regular' ? 'campaigns' : dataset);
  if (range) { sp.set('start', range.start); sp.set('end', range.end); }
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [tab, dataset, range]);
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['retail','media'] as const).map(v => (
          <button
            key={v}
            onClick={()=> setTab(v)}
            style={{
              padding: '0.5rem 0.9rem',
              border: '1px solid var(--color-mist)',
              background: tab === v ? 'var(--color-evergreen)' : 'var(--color-shell)',
              color: tab === v ? 'var(--color-shell)' : 'var(--color-onyx)',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >{v.charAt(0).toUpperCase()+v.slice(1)}</button>
        ))}
        <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
          {(['all','regular','triggered'] as const).map(ds => (
            <label key={ds} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
              <input type="radio" name="dataset" value={ds} checked={dataset===ds} onChange={()=> setDataset(ds)} />
              {ds === 'all' ? 'All Emails' : ds === 'regular' ? 'Campaigns' : 'Triggered'}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', fontSize: 12 }}>
          <span>Date:</span>
          <input type="date" value={range?.start || ''} onChange={e=> setRange(r=> ({...(r||{start:e.target.value,end:e.target.value}), start: e.target.value}))} />
          <span>to</span>
          <input type="date" value={range?.end || ''} onChange={e=> setRange(r=> ({...(r||{start:e.target.value,end:e.target.value}), end: e.target.value}))} />
        </div>
      </div>
      {range && tab === 'retail' && <ComparisonClient vertical="retail" initialCampaignId={retailFirstId} dataset={dataset === 'all' ? undefined : dataset} dateRange={range} />}
      {range && tab === 'media' && <ComparisonClient vertical="media" initialCampaignId={mediaFirstId} dataset={dataset === 'all' ? undefined : dataset} dateRange={range} />}
    </div>
  );
};

export default Tabs;
