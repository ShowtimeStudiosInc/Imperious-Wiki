/** Loads src/data/popularity.yml for the home page screen and the Diamond Approval Rating page. */
import { load } from 'js-yaml';
import fs from 'node:fs';
import { DIAMONDS } from './diamonds';
import { url } from './gems';

type Row = { slug: string; name?: string; score: number; previous?: number; votes?: number };
type News = { title: string; news?: string; source?: string; weekly?: boolean; headline?: string; unrest?: number; unrest_text?: string; changes?: { who: string; change: number; text?: string }[] };
type Log = { date: string | Date; who: string; change: number; kind: 'event' | 'roll' | 'small' | 'medium' | 'big' | 'decree'; text: string };
type Alert = { level: string; date: string | Date; text: string; hooks: string[] };
const raw = load(fs.readFileSync('src/data/popularity.yml', 'utf8')) as {
  updated: string | Date; unrest?: number; alert?: Alert; earlier_news?: News[]; deity: Row[]; ruling: Row[]; regents: Row[]; log?: Log[];
};

const fmt = (d: string | Date) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export interface Person { slug: string; name: string; short: string; href: string | null }
export interface Standing extends Person { score: number; change: number; votes: number | null }

const people = new Map<string, Person>();
for (const d of [...raw.deity, ...raw.ruling]) {
  const page = DIAMONDS.find((x) => x.slug === d.slug);
  const name = page?.name ?? d.name ?? d.slug;
  people.set(d.slug, { slug: d.slug, name, short: name.replace(/ Diamond$/, ''), href: page ? url(`/diamonds/${d.slug}/`) : null });
}
for (const r of raw.regents) {
  const file = `src/data/regents/${r.slug}.json`;
  const name = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')).name as string) : (r.name ?? r.slug);
  people.set(r.slug, { slug: r.slug, name, short: name.replace(/^Grand Regent /, ''), href: fs.existsSync(file) ? url(`/regents/${r.slug}/`) : null });
}
/** Name and page for a Diamond or Regent slug from the boards. */
export const personFor = (slug: string) => people.get(slug) ?? null;

const rank = (rows: Row[]): Standing[] =>
  rows
    .map((r) => ({ ...people.get(r.slug)!, score: r.score, change: r.score - (r.previous ?? r.score), votes: r.votes ?? null }))
    .sort((a, b) => b.score - a.score);

export const updated = fmt(raw.updated);

/** The Unrest alert, set when Unrest is Restless or Boiling. */
export const alert = raw.alert ?? null;

/** Player decrees: the types, and the ones waiting for the next weekly report. */
const decreeFile = (fs.existsSync('src/data/events/decrees.yml') ? load(fs.readFileSync('src/data/events/decrees.yml', 'utf8')) : {}) as {
  types?: { id: string; name: string; about: string; cooldown?: number }[]; pending?: { who: string; decree: string; note?: string }[];
};
export const decreeTypes = decreeFile.types ?? [];
export const pendingDecrees = (decreeFile.pending ?? [])
  .map((d) => ({ ...d, person: people.get(d.who), type: decreeTypes.find((t) => t.id === d.decree) }))
  .filter((d) => d.person && d.type);

/** Gempire-wide Unrest meter, 0 to 100. */
export const unrest = raw.unrest ?? null;
export const unrestLevel = (u: number) => (u >= 75 ? 'Boiling' : u >= 50 ? 'Restless' : u >= 25 ? 'Uneasy' : 'Calm');
export const kindLabel = (k: string) =>
  ({ decree: 'Decree', roll: 'Weekly roll', event: 'Event', small: 'Small event', medium: 'Medium event', big: 'Weekly headline' } as Record<string, string>)[k] ?? 'Event';
export const groups = [
  { title: 'Deity Diamonds', rows: rank(raw.deity) },
  { title: 'Ruling Diamonds', rows: rank(raw.ruling) },
  { title: 'Grand Regents', rows: rank(raw.regents) },
];

/** The permanent timeline: Homeworld Times broadcasts and weekly headlines, newest first. Kept for good. */
export const earlierNews = [...(raw.earlier_news ?? [])].reverse().map((n) => ({
  ...n,
  changes: (n.changes ?? []).map((c) => ({ ...c, change: Number(c.change), person: people.get(c.who)! })),
}));

/** Log grouped by date, newest first. */
export const logByDate = (() => {
  const byDate = new Map<string, (Log & { person: Person })[]>();
  for (const l of raw.log ?? []) {
    const key = new Date(l.date).toISOString().slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push({ ...l, change: Number(l.change), person: people.get(l.who)! });
  }
  return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([k, items]) => ({ date: fmt(k), items }));
})();

export const changeLabel = (n: number) => (n > 0 ? `▲ ${n}` : n < 0 ? `▼ ${-n}` : '–');
export const changeClass = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : 'same');
export const votesLabel = (n: number | null) => (n == null ? '' : `${n.toLocaleString('en-US')} gems polled`);
