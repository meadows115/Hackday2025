'use client';
import React, { useState } from 'react';

interface Props {
  onUpload?: () => void;
}

export const FileUpload: React.FC<Props> = ({ onUpload }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Upload failed');
      }
      if (typeof json.inserted === 'number') {
        const skipped = json.skippedInvalidVertical || 0;
        setResult(`Inserted ${json.inserted}/${json.totalProvided} campaigns` + (skipped ? ` (skipped ${skipped} invalid vertical)` : ''));
      } else {
        setResult('Upload complete');
      }
      onUpload?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <input type="file" accept=".csv" onChange={handleChange} disabled={loading} />
      {loading && <p>Uploading...</p>}
      {result && <p className="text-green-600">{result}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
};

export default FileUpload;
