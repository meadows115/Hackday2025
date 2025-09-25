'use client';
import React from 'react';

interface AdjustedMeta {
  openAdj: number;
  ctrAdj: number;
  nhiTotal?: number;
  nhiBenchTotal?: number;
  integrity?: 'good' | 'watch' | 'inflated';
}
interface Deltas { openDiff: number; ctrDiff: number; rpmDiff: number; }
interface Benchmark { projectedOpen: number; ctr: number; rpm: number; }
interface Props {
  deltas: Deltas;
  benchmark: Benchmark;
  adjusted?: AdjustedMeta | null;
}

// Simple heuristic thresholds; could be externalized later.
const THRESHOLDS = {
  openUnder: -5, // percentage points
  ctrUnder: -0.4, // percentage points
  rpmUnderRatio: 0.85, // campaign rpm < 85% of benchmark treated as underperforming
  nhiInflationMultiplier: 1.35 // NHI > 135% of peer benchmark
};

const AnomaliesPanel: React.FC<Props> = ({ deltas, benchmark, adjusted }) => {
  const items: string[] = [];

  // Open underperformance
  if (deltas.openDiff < THRESHOLDS.openUnder) {
    items.push(`Open rate is ${(Math.abs(deltas.openDiff)).toFixed(2)} pts below vertical (${benchmark.projectedOpen.toFixed(2)}% peer). Consider subject line testing or list quality review.`);
  }

  // CTR underperformance
  if (deltas.ctrDiff < THRESHOLDS.ctrUnder) {
    items.push(`CTR trails peers by ${Math.abs(deltas.ctrDiff).toFixed(2)} pts. Audit hero placement, above‑fold links, and merchandising density.`);
  }

  // RPM underperformance (need campaign rpm but only deltas & benchmark given; derive campaign rpm = benchmark.rpm + rpmDiff)
  const campaignRpm = benchmark.rpm + deltas.rpmDiff;
  if (campaignRpm < benchmark.rpm * THRESHOLDS.rpmUnderRatio) {
    items.push(`Revenue per thousand at ${campaignRpm.toFixed(2)} is below ${benchmark.rpm.toFixed(2)} benchmark. Evaluate monetization mix or segment value.`);
  }

  if (adjusted && adjusted.nhiTotal != null && adjusted.nhiBenchTotal != null) {
    const peer = adjusted.nhiBenchTotal;
    const mine = adjusted.nhiTotal;
    if (mine > peer * THRESHOLDS.nhiInflationMultiplier) {
      items.push(`Elevated NHI: ${mine.toFixed(2)}% vs ${peer.toFixed(2)}% peer. Potential inflated visibility — investigate engagement filtering (suppress role accounts, inactive, potential bots).`);
    } else if (adjusted.integrity === 'watch') {
      items.push(`Slightly high NHI (${mine.toFixed(2)}% vs ${peer.toFixed(2)}%). Monitor list hygiene and newly acquired sources.`);
    }
    if (adjusted.integrity === 'inflated') {
      items.push(`Integrity flag: Inflated. Treat uplifts cautiously; rely on Adjusted Metrics for true performance signal.`);
    }
  }

  if (!items.length) {
    items.push('No material anomalies detected. Metrics are within expected ranges for your vertical.');
  }

  return (
    <div style={{ border:'1px solid var(--color-mist)', background:'var(--color-shell)', padding:'0.75rem 0.9rem', borderRadius:4 }}>
      <h3 style={{ margin:'0 0 0.5rem', fontSize:13, fontWeight:600 }}>Insights & Anomalies</h3>
      <ul style={{ margin:0, paddingLeft:'1.1rem', display:'flex', flexDirection:'column', gap:4, fontSize:12 }}>
        {items.map((t,i)=>(<li key={i}>{t}</li>))}
      </ul>
    </div>
  );
};

export default AnomaliesPanel;
