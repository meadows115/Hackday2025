'use client';
import React from 'react';

const VERTICALS = ['retail','media'];

interface Props { value?: string; onChange: (vertical: string) => void; }

const VerticalSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <select
      value={value || ''}
      onChange={(e)=> onChange(e.target.value)}
      style={{ padding: '0.4rem', border: '1px solid var(--color-mist)', borderRadius: 4 }}
    >
      <option value='' disabled>Select vertical</option>
      {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
    </select>
  );
};

export default VerticalSelector;
