import Database from 'better-sqlite3';

const ALLOWED_VERTICALS = new Set(['retail', 'media']);

export interface Campaign {
  id?: number;
  name: string;
  subject: string;
  projectedOpen: number; // percentage
  ctr: number; // percentage
  rpm: number; // revenue per thousand sends (or raw number provided)
  vertical: string;
}

export interface BenchmarkRow {
  vertical: string;
  projectedOpen: number;
  ctr: number;
  rpm: number;
}

// Singleton DB connection
let db: Database.Database | null = null;
function getDb() {
  if (!db) {
    db = new Database('benchmark.db');
    db.pragma('journal_mode = WAL');
    init();
  }
  return db;
}

function init() {
  const d = db!;
  d.prepare(`CREATE TABLE IF NOT EXISTS benchmarks (
      vertical TEXT PRIMARY KEY,
      projectedOpen REAL NOT NULL,
      ctr REAL NOT NULL,
      rpm REAL NOT NULL
    )`).run();

  d.prepare(`CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      projectedOpen REAL NOT NULL,
      ctr REAL NOT NULL,
      rpm REAL NOT NULL,
      vertical TEXT NOT NULL
    )`).run();

  // Seed benchmark rows if empty
  const existing = d.prepare('SELECT COUNT(*) as c FROM benchmarks').get() as { c: number };
  if (existing.c === 0) {
    const seed: BenchmarkRow[] = [
      { vertical: 'retail', projectedOpen: 30.5, ctr: 2.47, rpm: 790 },
      { vertical: 'media', projectedOpen: 27.72, ctr: 7.38, rpm: 0.70 }
    ];
    const stmt = d.prepare('INSERT INTO benchmarks (vertical, projectedOpen, ctr, rpm) VALUES (@vertical, @projectedOpen, @ctr, @rpm)');
    const insertMany = d.transaction((rows: BenchmarkRow[]) => {
      for (const r of rows) stmt.run(r);
    });
    insertMany(seed);
  }

  // Seed dummy campaigns if none exist
  const existingCampaigns = d.prepare('SELECT COUNT(*) as c FROM campaigns').get() as { c: number };
  if (existingCampaigns.c === 0) {
    const dummy: Campaign[] = [
      { name: 'Weekend Flash', subject: 'Extra 20% this weekend', projectedOpen: 24.0, ctr: 3.0, rpm: 704, vertical: 'retail' },
      { name: 'Spring Teaser', subject: 'New Collection Sneak Peek', projectedOpen: 28.2, ctr: 2.9, rpm: 725, vertical: 'retail' },
      { name: 'Daily Digest', subject: 'Top Stories You Missed', projectedOpen: 29.4, ctr: 6.9, rpm: 0.62, vertical: 'media' },
      { name: 'Cart Recovery', subject: 'Still thinking this over?', projectedOpen: 26.1, ctr: 3.4, rpm: 810, vertical: 'retail' }
    ];
    insertCampaigns(dummy);
  }

  // Cleanup: remove any legacy benchmarks / campaigns outside allowed verticals
  d.prepare(`DELETE FROM benchmarks WHERE vertical NOT IN ('retail','media')`).run();
  d.prepare(`DELETE FROM campaigns WHERE vertical NOT IN ('retail','media')`).run();
}

export function insertCampaigns(data: Campaign[]): number {
  if (!data.length) return 0;
  const d = getDb();
  const stmt = d.prepare(`INSERT INTO campaigns (name, subject, projectedOpen, ctr, rpm, vertical)
    VALUES (@name, @subject, @projectedOpen, @ctr, @rpm, @vertical)`);
  const insertMany = d.transaction((rows: Campaign[]) => {
    for (const r of rows) {
      r.vertical = r.vertical.toLowerCase();
      if (!ALLOWED_VERTICALS.has(r.vertical)) continue; // skip invalid verticals silently
      stmt.run(r);
    }
  });
  insertMany(data);
  return data.length;
}

export function getCampaignById(id: number): Campaign | null {
  const d = getDb();
  const row = d.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as Campaign | undefined;
  return row ?? null;
}

export function getBenchmarkByVertical(vertical: string): BenchmarkRow | null {
  const d = getDb();
  const row = d.prepare('SELECT * FROM benchmarks WHERE vertical = ?').get(vertical.toLowerCase()) as BenchmarkRow | undefined;
  return row ?? null;
}

export function listCampaigns(): Campaign[] {
  const d = getDb();
  return d.prepare('SELECT * FROM campaigns ORDER BY id DESC').all() as Campaign[];
}

export function listVerticals(): string[] {
  const d = getDb();
  const rows = d.prepare('SELECT vertical FROM benchmarks ORDER BY vertical').all() as { vertical: string }[];
  return rows.map(r => r.vertical);
}
