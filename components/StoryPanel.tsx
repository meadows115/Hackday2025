'use client';
import React from 'react';

interface Metrics { projectedOpen: number; ctr: number; rpm: number; type?: string; windowDays?: number | null; }
interface Deltas { openDiff: number; ctrDiff: number; rpmDiff: number; }
interface Props { campaign: Metrics; benchmark: Metrics; deltas: Deltas; }

function formatPct(value: number) {
  return `${value.toFixed(2)}%`;
}

const StoryPanel: React.FC<Props> = ({ campaign, benchmark, deltas }) => {
  const sentences: string[] = [];

  // Open rate narrative
  const openDelta = deltas.openDiff;
  if (openDelta >= 0) {
    sentences.push(`Your open rate was ${formatPct(campaign.projectedOpen)} vs ${formatPct(benchmark.projectedOpen)} for the vertical (up ${openDelta.toFixed(2)} pts).`);
  } else {
    sentences.push(`Your open rate was ${formatPct(campaign.projectedOpen)} vs ${formatPct(benchmark.projectedOpen)} (−${Math.abs(openDelta).toFixed(2)} pts below benchmark).`);
  }

  // CTR narrative
  const ctrDelta = deltas.ctrDiff;
  if (ctrDelta >= 0) {
    sentences.push(`CTR outperformed peers (${formatPct(campaign.ctr)} vs ${formatPct(benchmark.ctr)}).`);
  } else {
    sentences.push(`CTR lagged (${formatPct(campaign.ctr)} vs ${formatPct(benchmark.ctr)}).`);
  }

  // RPM narrative
  const rpmDelta = deltas.rpmDiff;
  if (rpmDelta >= 0) {
    sentences.push(`Revenue per thousand was higher (${campaign.rpm.toFixed(2)} vs ${benchmark.rpm.toFixed(2)}).`);
  } else {
    sentences.push(`Revenue per thousand trailed (${campaign.rpm.toFixed(2)} vs ${benchmark.rpm.toFixed(2)}).`);
  }

  if (campaign.type === 'triggered' && campaign.windowDays) {
    sentences.push(`(Measured over a ${campaign.windowDays}-day post-send window for this triggered flow.)`);
  }
  const summary = sentences.join(' ');

  return (
    <div className="p-4 border rounded bg-gray-50 space-y-2">
      <h3 className="font-semibold">Story</h3>
      <p>{summary}</p>
    </div>
  );
};

export default StoryPanel;
