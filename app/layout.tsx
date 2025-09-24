import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Benchmark Storyteller',
  description: 'Compare campaign metrics to vertical benchmarks and generate stories.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#fff', color: '#111' }}>{children}</body>
    </html>
  );
}
