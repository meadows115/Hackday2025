'use client';
import React from 'react';

interface Metrics { projectedOpen: number; ctr: number; rpm: number; type?: string; windowDays?: number | null; }
interface Deltas { openDiff: number; ctrDiff: number; rpmDiff: number; }
interface Props { campaign: Metrics; benchmark: Metrics; deltas: Deltas; }

function pct(v: number) { return `${v.toFixed(2)}%`; }

function compareLine(label: string, a: number, b: number) {
  const ratio = b === 0 ? 1 : a / b;
  if (ratio >= 1.07) return `${label} is stronger than the vertical (${pct(a)} vs ${pct(b)}).`;
  if (ratio <= 0.93) return `${label} is below the vertical (${pct(a)} vs ${pct(b)}).`;
  return `${label} is in line with the vertical (${pct(a)} vs ${pct(b)}).`;
}

const StoryPanel: React.FC<Props> = ({ campaign, benchmark }) => {
  const lines: string[] = [];
  lines.push(compareLine('Open rate', campaign.projectedOpen, benchmark.projectedOpen));
  lines.push(compareLine('CTR', campaign.ctr, benchmark.ctr));
  lines.push(compareLine('Revenue per thousand', campaign.rpm, benchmark.rpm));
  if (campaign.type === 'triggered' && campaign.windowDays) {
    lines.push(`Measured over a ${campaign.windowDays}-day window for this triggered flow.`);
  }
  return (
    <div style={{ border:'1px solid var(--color-mist)', background:'var(--color-shell)', padding:'0.75rem 0.9rem', borderRadius:4, fontSize:12, lineHeight:1.4 }}>
      <h3 style={{ margin:'0 0 0.4rem', fontSize:13, fontWeight:600 }}>Story</h3>
      <ul style={{ margin:0, padding:'0 0 0 1.1rem', display:'flex', flexDirection:'column', gap:2 }}>
        {lines.map((l,i)=>(<li key={i}>{l}</li>))}
      </ul>
    </div>
  );
};

export default StoryPanel;
