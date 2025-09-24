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
  type?: 'regular' | 'triggered';
  windowDays?: number | null; // measurement window for triggered campaigns
  sentAt?: string; // ISO date
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
      vertical TEXT NOT NULL,
      type TEXT DEFAULT 'regular',
      windowDays INTEGER,
      sentAt TEXT
    )`).run();

  // Lightweight migration: ensure columns type, windowDays exist (older DBs)
  const cols: { name: string }[] = d.prepare(`PRAGMA table_info(campaigns)`).all() as any;
  const colNames = new Set(cols.map(c => c.name));
  if (!colNames.has('type')) {
    try { d.prepare(`ALTER TABLE campaigns ADD COLUMN type TEXT DEFAULT 'regular'`).run(); } catch {}
  }
  if (!colNames.has('windowDays')) {
    try { d.prepare(`ALTER TABLE campaigns ADD COLUMN windowDays INTEGER`).run(); } catch {}
  }
  if (!colNames.has('sentAt')) {
    try { d.prepare(`ALTER TABLE campaigns ADD COLUMN sentAt TEXT`).run(); } catch {}
  }

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
    const now = Date.now();
    const daysAgo = (d: number) => new Date(now - d*24*60*60*1000).toISOString();
    const dummy: Campaign[] = [
      { name: 'Weekend Flash', subject: 'Extra 20% this weekend', projectedOpen: 24.0, ctr: 3.0, rpm: 704, vertical: 'retail', type: 'regular', sentAt: daysAgo(3) },
      { name: 'Spring Teaser', subject: 'New Collection Sneak Peek', projectedOpen: 28.2, ctr: 2.9, rpm: 725, vertical: 'retail', type: 'regular', sentAt: daysAgo(10) },
      { name: 'Daily Digest', subject: 'Top Stories You Missed', projectedOpen: 29.4, ctr: 6.9, rpm: 0.62, vertical: 'media', type: 'regular', sentAt: daysAgo(1) },
      { name: 'Cart Recovery Flow', subject: 'Still thinking this over?', projectedOpen: 26.1, ctr: 3.4, rpm: 810, vertical: 'retail', type: 'triggered', windowDays: 7, sentAt: daysAgo(5) },
      { name: 'Welcome Series', subject: 'Welcome to the family!', projectedOpen: 35.5, ctr: 4.1, rpm: 690, vertical: 'retail', type: 'triggered', windowDays: 14, sentAt: daysAgo(14) },
      { name: 'Breaking News Alert', subject: 'Major update just in', projectedOpen: 33.2, ctr: 8.1, rpm: 0.68, vertical: 'media', type: 'triggered', windowDays: 3, sentAt: daysAgo(2) }
    ];
    insertCampaigns(dummy);
  }

  // If total campaigns still low, generate additional synthetic data to improve date range coverage.
  const afterSeedCount = d.prepare('SELECT COUNT(*) as c FROM campaigns').get() as { c: number };
  if (afterSeedCount.c < 24) {
    const benchRetail = getBenchmarkByVertical('retail') || { projectedOpen:30, ctr:2.5, rpm:750 } as any;
    const benchMedia = getBenchmarkByVertical('media') || { projectedOpen:28, ctr:7, rpm:0.65 } as any;
    const now = Date.now();
    function isoDaysAgo(n: number) { return new Date(now - n*24*60*60*1000).toISOString(); }
    function jitter(base: number, pct: number) { return +(base * (1 + (Math.random()*2-1)*pct)).toFixed(2); }
    const synthetic: Campaign[] = [];
    const dayBuckets = [2,4,6,8,12,15,18,21,24,27];
    for (const day of dayBuckets) {
      // Retail regular
      synthetic.push({
        name: `Retail Blast ${day}`,
        subject: `Retail update day ${day}`,
        projectedOpen: jitter(benchRetail.projectedOpen, 0.15),
        ctr: jitter(benchRetail.ctr, 0.2),
        rpm: jitter(benchRetail.rpm, 0.2),
        vertical: 'retail',
        type: 'regular',
        sentAt: isoDaysAgo(day)
      });
      // Retail triggered
      synthetic.push({
        name: `Retail Flow ${day}`,
        subject: `Flow touchpoint ${day}`,
        projectedOpen: jitter(benchRetail.projectedOpen+2, 0.15),
        ctr: jitter(benchRetail.ctr+0.4, 0.25),
        rpm: jitter(benchRetail.rpm, 0.25),
        vertical: 'retail',
        type: 'triggered',
        windowDays: day % 14 < 7 ? 7 : 14,
        sentAt: isoDaysAgo(day)
      });
      // Media regular
      synthetic.push({
        name: `Media Digest ${day}`,
        subject: `Top stories D${day}`,
        projectedOpen: jitter(benchMedia.projectedOpen, 0.15),
        ctr: jitter(benchMedia.ctr, 0.25),
        rpm: jitter(benchMedia.rpm, 0.3),
        vertical: 'media',
        type: 'regular',
        sentAt: isoDaysAgo(day)
      });
      // Media triggered
      synthetic.push({
        name: `Media Alert Flow ${day}`,
        subject: `Breaking flow D${day}`,
        projectedOpen: jitter(benchMedia.projectedOpen+1.5, 0.15),
        ctr: jitter(benchMedia.ctr+0.8, 0.3),
        rpm: jitter(benchMedia.rpm, 0.35),
        vertical: 'media',
        type: 'triggered',
        windowDays: day % 6 < 3 ? 3 : 6,
        sentAt: isoDaysAgo(day)
      });
    }
    insertCampaigns(synthetic);
  }

  // Cleanup: remove any legacy benchmarks / campaigns outside allowed verticals
  d.prepare(`DELETE FROM benchmarks WHERE vertical NOT IN ('retail','media')`).run();
  d.prepare(`DELETE FROM campaigns WHERE vertical NOT IN ('retail','media')`).run();
}

export interface InsertCampaignsResult {
  inserted: number;
  skippedInvalidVertical: number;
  totalProvided: number;
}

export function insertCampaigns(data: Campaign[]): InsertCampaignsResult {
  if (!data.length) return { inserted: 0, skippedInvalidVertical: 0, totalProvided: 0 };
  const d = getDb();
  const stmt = d.prepare(`INSERT INTO campaigns (name, subject, projectedOpen, ctr, rpm, vertical, type, windowDays, sentAt)
    VALUES (@name, @subject, @projectedOpen, @ctr, @rpm, @vertical, @type, @windowDays, @sentAt)`);
  let inserted = 0;
  let skippedInvalidVertical = 0;
  const insertMany = d.transaction((rows: Campaign[]) => {
    for (const r of rows) {
      r.vertical = r.vertical.toLowerCase();
      if (!ALLOWED_VERTICALS.has(r.vertical)) { skippedInvalidVertical++; continue; }
      if (!r.type) r.type = 'regular';
      if (typeof r.windowDays === 'undefined') r.windowDays = null;
      if (typeof r.sentAt === 'undefined') r.sentAt = new Date().toISOString();
      stmt.run({
        name: r.name,
        subject: r.subject,
        projectedOpen: r.projectedOpen,
        ctr: r.ctr,
        rpm: r.rpm,
        vertical: r.vertical,
        type: r.type,
        windowDays: r.windowDays,
        sentAt: r.sentAt
      });
      inserted++;
    }
  });
  insertMany(data);
  return { inserted, skippedInvalidVertical, totalProvided: data.length };
}

export function getCampaignById(id: number): Campaign | null {
  const d = getDb();
  const row = d.prepare('SELECT id, name, subject, projectedOpen, ctr, rpm, vertical, type, windowDays, sentAt FROM campaigns WHERE id = ?').get(id) as Campaign | undefined;
  return row ?? null;
}

export function getBenchmarkByVertical(vertical: string): BenchmarkRow | null {
  const d = getDb();
  const row = d.prepare('SELECT * FROM benchmarks WHERE vertical = ?').get(vertical.toLowerCase()) as BenchmarkRow | undefined;
  return row ?? null;
}

export function listCampaigns(): Campaign[] {
  const d = getDb();
  return d.prepare('SELECT id, name, subject, projectedOpen, ctr, rpm, vertical, type, windowDays, sentAt FROM campaigns ORDER BY id DESC').all() as Campaign[];
}

export interface AggregateMetrics { projectedOpen: number; ctr: number; rpm: number; count: number; }

export function aggregateCampaignMetrics(vertical: string, start: string, end: string, type: 'regular' | 'triggered' | 'all' = 'all'): AggregateMetrics | null {
  const d = getDb();
  const clauses = ['vertical = @vertical'];
  const params: any = { vertical: vertical.toLowerCase(), start, end };
  clauses.push('sentAt BETWEEN @start AND @end');
  if (type !== 'all') { clauses.push('type = @type'); params.type = type; }
  const sql = `SELECT COUNT(*) as count, AVG(projectedOpen) as projectedOpen, AVG(ctr) as ctr, AVG(rpm) as rpm FROM campaigns WHERE ${clauses.join(' AND ')}`;
  const row = d.prepare(sql).get(params) as any;
  if (!row || row.count === 0) return null;
  return { projectedOpen: row.projectedOpen, ctr: row.ctr, rpm: row.rpm, count: row.count };
}

export function listVerticals(): string[] {
  const d = getDb();
  const rows = d.prepare('SELECT vertical FROM benchmarks ORDER BY vertical').all() as { vertical: string }[];
  return rows.map(r => r.vertical);
}
