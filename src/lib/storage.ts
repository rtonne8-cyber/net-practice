// localStorage layer — same key and JSON shape as the prototype's window.storage

const KEY = "netpractice:records:v1";

export interface Records {
  sessions: number;
  lastDate: string | null;
  best: Record<string, number>;
  // P4 additions
  streak: number;
  practiceDays: string[]; // ISO date strings, deduped
}

const DEFAULT: Records = {
  sessions: 0,
  lastDate: null,
  best: {},
  streak: 0,
  practiceDays: [],
};

export function loadRecords(): Records {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Records>;
      return { ...DEFAULT, ...parsed };
    }
  } catch {
    // corrupted storage — fall through to default
  }
  return { ...DEFAULT };
}

export function saveRecords(rec: Records): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {
    // storage quota exceeded or unavailable — swallow silently
  }
}

// Compute days-practised streak from sorted ISO date array
export function computeStreak(practiceDays: string[]): number {
  if (!practiceDays.length) return 0;
  const sorted = [...new Set(practiceDays)].sort();
  const today = toISODate(new Date());
  let streak = 0;
  let cursor = today;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i] === cursor) {
      streak++;
      cursor = prevDay(cursor);
    } else if (sorted[i] < cursor) {
      break;
    }
  }
  return streak;
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function prevDay(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
