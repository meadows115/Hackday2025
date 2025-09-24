'use client';
import React, { useEffect, useState } from 'react';

interface Campaign { id: number; name: string; vertical: string; }

interface Props {
  onChange: (campaignId: number) => void;
  value?: number;
}

const CampaignSelector: React.FC<Props> = ({ onChange, value }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      const res = await fetch('/api/campaigns', { cache: 'no-store' });
      const json = await res.json();
      if (!ignore) {
        setCampaigns(json.campaigns || []);
        setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, []);

  if (loading) return <p>Loading campaigns...</p>;
  if (!campaigns.length) return <p>No campaigns available.</p>;

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ padding: '0.4rem', border: '1px solid var(--color-mist)', borderRadius: 4 }}
    >
      <option value='' disabled>Select campaign</option>
      {campaigns.map(c => (
        <option key={c.id} value={c.id}>{c.id}: {c.name} ({c.vertical})</option>
      ))}
    </select>
  );
};

export default CampaignSelector;
