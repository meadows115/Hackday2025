'use client';
import React, { useEffect, useState } from 'react';

interface Campaign { id: number; name: string; vertical: string; type?: 'regular' | 'triggered'; windowDays?: number; sentAt?: string; }

interface Props {
  onChange: (campaignId: number) => void;
  value?: number;
  filterVertical?: 'retail' | 'media';
  filterType?: 'regular' | 'triggered' | 'all';
  start?: string;
  end?: string;
}

const CampaignSelector: React.FC<Props> = ({ onChange, value, filterVertical, filterType = 'all', start, end }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterVertical) params.set('vertical', filterVertical);
      if (filterType && filterType !== 'all') params.set('type', filterType);
      if (start) params.set('start', start);
      if (end) params.set('end', end);
      const res = await fetch(`/api/campaigns?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!ignore) {
        let list: Campaign[] = json.campaigns || [];
        if (filterVertical) list = list.filter(c => c.vertical === filterVertical);
        if (filterType !== 'all') list = list.filter(c => (c.type || 'regular') === filterType);
        setCampaigns(list);
        setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [filterVertical, filterType, start, end]);

  const filtered = campaigns.filter(c => !query.trim() || c.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { setHighlight(0); }, [query, filtered.length]);

  function commit(id: number) {
    onChange(id);
    const sp = new URLSearchParams(window.location.search);
    sp.set('cid', String(id));
    window.history.replaceState(null,'',`${window.location.pathname}?${sp.toString()}`);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && ['ArrowDown','Enter'].includes(e.key)) { setOpen(true); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(filtered.length-1, h+1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(0, h-1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const f = filtered[highlight]; if (f) commit(f.id); }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  if (loading) return <p>Loading campaigns...</p>;
  if (!campaigns.length) return <p>No campaigns in range.</p>;

  return (
    <div style={{ position:'relative', minWidth:240 }}>
      <input
        placeholder="Search or pick a campaign..."
        value={query || (value ? campaigns.find(c=> c.id===value)?.name || '' : '')}
        onChange={e=> { setQuery(e.target.value); setOpen(true); }}
        onFocus={()=> setOpen(true)}
        onKeyDown={onKey}
        style={{ padding: '0.45rem 0.5rem', width:'100%', border:'1px solid var(--color-mist)', borderRadius:4, fontSize:12 }}
      />
      {open && filtered.length > 0 && (
        <ul style={{ listStyle:'none', margin:0, padding:0, position:'absolute', top:'100%', left:0, right:0, zIndex:30, background:'var(--color-shell)', border:'1px solid var(--color-mist)', maxHeight:220, overflowY:'auto', borderRadius:4, boxShadow:'0 4px 12px rgba(0,0,0,0.18)' }}>
          {filtered.map((c,i) => {
            const active = i === highlight;
            const labelType = (c.type === 'triggered') ? '⚡' : '•';
            const windowInfo = c.type === 'triggered' && c.windowDays ? ` ${c.windowDays}d` : '';
            return (
              <li key={c.id}
                  onMouseDown={(e)=> { e.preventDefault(); commit(c.id); setQuery(c.name); }}
                  onMouseEnter={()=> setHighlight(i)}
                  style={{ padding:'0.4rem 0.55rem', cursor:'pointer', background: active ? 'var(--color-evergreen)' : 'transparent', color: active ? 'var(--color-shell)' : 'var(--color-onyx)', fontSize:12, display:'flex', justifyContent:'space-between', gap:8 }}>
                <span>{labelType} {c.name}{windowInfo}</span>
                <span style={{ opacity:0.6 }}>{c.sentAt}</span>
              </li>
            );
          })}
        </ul>
      )}
      {open && filtered.length === 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--color-shell)', border:'1px solid var(--color-mist)', borderRadius:4, padding:'0.5rem', fontSize:12 }}>No matches.</div>
      )}
    </div>
  );
};

export default CampaignSelector;
