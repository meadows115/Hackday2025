'use client';
import React, { useEffect, useState } from 'react';

interface Campaign { id: number; name: string; vertical: string; type?: 'regular' | 'triggered'; windowDays?: number; }

interface Props {
  onChange: (campaignId: number) => void;
  value?: number;
  filterVertical?: 'retail' | 'media';
  filterType?: 'regular' | 'triggered' | 'all';
  dateRange?: { start: string; end: string };
}

const CampaignSelector: React.FC<Props> = ({ onChange, value, filterVertical, filterType = 'all', dateRange }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterVertical) params.set('vertical', filterVertical);
      if (filterType !== 'all') params.set('type', filterType);
      if (dateRange) { params.set('start', dateRange.start); params.set('end', dateRange.end); }
      const res = await fetch(`/api/campaigns?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!ignore) {
  let list: Campaign[] = json.campaigns || [];
  // server filtered already; keep fallback in case
  if (filterVertical) list = list.filter(c => c.vertical === filterVertical);
  if (filterType !== 'all') list = list.filter(c => (c.type || 'regular') === filterType);
  setCampaigns(list);
        setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [filterVertical, filterType, dateRange?.start, dateRange?.end]);

  if (loading) return <p>Loading campaigns...</p>;
  if (!campaigns.length) return <p>No campaigns available.</p>;

  return (
    <select
      value={value || ''}
      onChange={(e) => { const id = Number(e.target.value); onChange(id); const sp = new URLSearchParams(window.location.search); sp.set('cid', String(id)); window.history.replaceState(null,'',`${window.location.pathname}?${sp.toString()}`); }}
      style={{ padding: '0.4rem', border: '1px solid var(--color-mist)', borderRadius: 4 }}
    >
      <option value='' disabled>Select campaign</option>
      {campaigns.map(c => {
        const labelType = (c.type === 'triggered') ? '⚡' : '•';
        const windowInfo = c.type === 'triggered' && c.windowDays ? ` ${c.windowDays}d` : '';
        return <option key={c.id} value={c.id}>{c.id}: {labelType} {c.name}{windowInfo} ({c.vertical})</option>;
      })}
    </select>
  );
};

export default CampaignSelector;
