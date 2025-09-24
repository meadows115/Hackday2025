'use client';
import React from 'react';

interface Deltas { openDiff: number; ctrDiff: number; rpmDiff: number; }

const Recommendations: React.FC<{ deltas: Deltas }> = ({ deltas }) => {
  const recs: string[] = [];

  if (deltas.openDiff < 0) {
    recs.push('Test more compelling subject lines and preheaders to lift open rate.');
  }
  if (deltas.ctrDiff < 0) {
    recs.push('Strengthen calls-to-action and tighten above-the-fold content to boost CTR.');
  }
  if (deltas.rpmDiff < 0) {
    recs.push('Feature higher-margin products and consider cart recovery sequences to raise RPM.');
  }
  if (recs.length === 0) {
    recs.push('Great performance – continue iterating on what works and test incremental improvements.');
  }

  return (
    <div className="p-4 border rounded bg-gray-50 space-y-2">
      <h3 className="font-semibold">Recommendations</h3>
      <ul className="list-disc ml-5 space-y-1">
        {recs.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </div>
  );
};

export default Recommendations;
