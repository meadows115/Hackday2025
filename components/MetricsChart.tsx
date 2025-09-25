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
  adjustedMeta?: { openAdj: number; ctrAdj: number; nhiTotal: number; nhiBenchTotal: number } | null;
  showAdjusted?: boolean;
}

const MetricsChart: React.FC<Props> = ({ campaign, benchmark, adjustedMeta, showAdjusted }) => {
  const usingAdjusted = showAdjusted && adjustedMeta;
  const rows = [
    { key: 'open', name: usingAdjusted ? 'Adj Open %' : 'Open %', c: usingAdjusted ? adjustedMeta!.openAdj : campaign.projectedOpen, b: benchmark.projectedOpen },
    { key: 'ctr', name: usingAdjusted ? 'Adj CTR %' : 'CTR %', c: usingAdjusted ? adjustedMeta!.ctrAdj : campaign.ctr, b: benchmark.ctr },
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
          <Bar dataKey="campaign" name={usingAdjusted ? 'Campaign (Adj)' : 'Campaign'}>
            {data.map((entry, idx) => (
              <Cell key={`c-${idx}`} fill={entry.better ? (usingAdjusted ? 'var(--color-ocean)' : 'var(--color-positive)') : (usingAdjusted ? 'var(--color-sun)' : 'var(--color-negative)')} />
            ))}
          </Bar>
          <Bar dataKey="benchmark" name="Benchmark" fill="var(--color-neutral)" />
        </BarChart>
      </ResponsiveContainer>
      {usingAdjusted && adjustedMeta && (
        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>
          Adjusted removes estimated automated opens (NHI {adjustedMeta.nhiTotal.toFixed(2)}% vs benchmark {adjustedMeta.nhiBenchTotal.toFixed(2)}%).
        </div>
      )}
    </div>
  );
};

export default MetricsChart;
