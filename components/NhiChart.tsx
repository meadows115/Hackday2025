'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  campaign: { gmail: number; yahoo: number; other: number; total: number };
  benchmark: { gmail: number; yahoo: number; other: number; total: number };
}

const NhiChart: React.FC<Props> = ({ campaign, benchmark }) => {
  const data = [
    { name: 'Gmail', Campaign: campaign.gmail, Benchmark: benchmark.gmail },
    { name: 'Yahoo', Campaign: campaign.yahoo, Benchmark: benchmark.yahoo },
    { name: 'Other', Campaign: campaign.other, Benchmark: benchmark.other },
    { name: 'Total', Campaign: campaign.total, Benchmark: benchmark.total }
  ];
  return (
    <div style={{ background: 'var(--color-shell)', border: '1px solid var(--color-mist)', borderRadius: 4, padding: '0.75rem' }}>
      <h3 style={{ margin: '0 0 0.5rem', fontSize: 14 }}>Non-Human Interaction (NHI) vs Benchmark (%)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(v:number)=> v.toFixed(2)+ '%'} />
          <Legend />
          <Bar dataKey="Campaign" fill="var(--color-evergreen)" />
          <Bar dataKey="Benchmark" fill="var(--color-ocean)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default NhiChart;
