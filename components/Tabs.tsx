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

  // keep state in URL
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    sp.set('v', tab);
  sp.set('ds', dataset === 'regular' ? 'campaigns' : dataset);
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [tab, dataset]);
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
        <div style={{ marginLeft:'auto' }} />
      </div>
      {tab === 'retail' && <ComparisonClient vertical="retail" initialCampaignId={retailFirstId} dataset={dataset === 'all' ? undefined : dataset} />}
      {tab === 'media' && <ComparisonClient vertical="media" initialCampaignId={mediaFirstId} dataset={dataset === 'all' ? undefined : dataset} />}
    </div>
  );
};

export default Tabs;
