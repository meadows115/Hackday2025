import { listCampaigns } from '@/lib/db';
import FileUpload from '@/components/FileUpload';
import MetricsChart from '@/components/MetricsChart';
import StoryPanel from '@/components/StoryPanel';
import Recommendations from '@/components/Recommendations';
import React from 'react';
import ComparisonClient from '@/components/ComparisonClient';


export default async function Page() {
  const campaigns = listCampaigns();
  const first = campaigns[0];
  return (
    <main style={{ padding: '1rem', fontFamily: 'sans-serif', maxWidth: 960, margin: '0 auto' }}>
      <h1>Benchmark Storyteller</h1>
      <section style={{ marginTop: '1rem' }}>
        <h2>Upload Campaign CSV</h2>
        <FileUpload />
      </section>
      <section style={{ marginTop: '2rem' }}>
        <h2>Select & Compare</h2>
        <ComparisonClient initialCampaignId={first?.id} initialVertical={first?.vertical} />
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
