'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface Metrics {
  projectedOpen: number;
  ctr: number;
  rpm: number;
}

interface Props {
  campaign: Metrics;
  benchmark: Metrics;
}

const MetricsChart: React.FC<Props> = ({ campaign, benchmark }) => {
  const rows = [
    { key: 'open', name: 'Open %', c: campaign.projectedOpen, b: benchmark.projectedOpen },
    { key: 'ctr', name: 'CTR %', c: campaign.ctr, b: benchmark.ctr },
    { key: 'rpm', name: 'RPM', c: campaign.rpm, b: benchmark.rpm }
  ];

  const data = rows.map(r => ({
    name: r.name,
    campaign: r.c,
    benchmark: r.b,
    better: r.c >= r.b
  }));

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="campaign" name="Campaign">
            {data.map((entry, idx) => (
              <Cell key={`c-${idx}`} fill={entry.better ? 'var(--color-positive)' : 'var(--color-negative)'} />
            ))}
          </Bar>
          <Bar dataKey="benchmark" name="Benchmark" fill="var(--color-neutral)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricsChart;
