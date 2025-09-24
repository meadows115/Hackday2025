import { listCampaigns } from '@/lib/db';
import React from 'react';
import Tabs from '@/components/Tabs';


export default async function Page() {
  const campaigns = listCampaigns();
  const retailFirst = campaigns.find(c => c.vertical === 'retail');
  const mediaFirst = campaigns.find(c => c.vertical === 'media');
  return (
    <main style={{ padding: '1rem', fontFamily: 'sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <h1>Benchmark Storyteller</h1>
      <section style={{ marginTop: '1.5rem' }}>
        <h2>Select & Compare</h2>
        <Tabs retailFirstId={retailFirst?.id} mediaFirstId={mediaFirst?.id} />
      </section>
      <section style={{ marginTop: '2rem' }}>
        <h2>All Campaigns</h2>
        {campaigns.length === 0 && <p>No campaigns yet.</p>}
        {campaigns.length > 0 && (
          <ul>
            {campaigns.map(c => <li key={c.id}>{c.id}: {c.name} ({c.vertical})</li>)}
          </ul>
        )}
      </section>
    </main>
  );
}

// Tabs component moved to client component file components/Tabs.tsx
