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
    </main>
  );
}

// Tabs component moved to client component file components/Tabs.tsx
