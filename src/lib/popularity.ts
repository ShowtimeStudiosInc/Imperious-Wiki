/** Loads src/data/popularity.yml for the home page screen and the Popularity page. */
import { load } from 'js-yaml';
import fs from 'node:fs';
import { DIAMONDS } from './diamonds';
import { url } from './gems';

type Row = { slug: string; score: number; previous?: number };
type Log = { date: string | Date; who: string; change: number; kind: 'event' | 'roll'; text: string };
const raw = load(fs.readFileSync('src/data/popularity.yml', 'utf8')) as { updated: string | Date; diamonds: Row[]; regents: Row[]; log?: Log[] };

const regent = (slug: string) => JSON.parse(fs.readFileSync(`src/data/regents/${slug}.json`, 'utf8')) as { name: string };
const fmt = (d: string | Date) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export interface Standing { slug: string; name: string; short: string; href: string; score: number; change: number; kind: 'diamond' | 'regent' }

const people = new Map<string, Omit<Standing, 'score' | 'change'>>();
for (const d of raw.diamonds) {
  const name = DIAMONDS.find((x) => x.slug === d.slug)?.name ?? d.slug;
  people.set(d.slug, { slug: d.slug, name, short: name.replace(/ Diamond$/, ''), href: url(`/diamonds/${d.slug}/`), kind: 'diamond' });
}
for (const r of raw.regents) {
  const name = regent(r.slug).name;
  people.set(r.slug, { slug: r.slug, name, short: name.replace(/^Grand Regent /, ''), href: url(`/regents/${r.slug}/`), kind: 'regent' });
}
const rank = (rows: Row[]): Standing[] =>
  rows.map((r) => ({ ...people.get(r.slug)!, score: r.score, change: r.score - (r.previous ?? r.score) })).sort((a, b) => b.score - a.score);

export const updated = fmt(raw.updated);
export const diamonds = rank(raw.diamonds);
export const regents = rank(raw.regents);

/** Log grouped by date, newest first. */
export const logByDate = (() => {
  const groups = new Map<string, (Log & { person: Omit<Standing, 'score' | 'change'> })[]>();
  for (const l of raw.log ?? []) {
    const key = new Date(l.date).toISOString().slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({ ...l, change: Number(l.change), person: people.get(l.who)! });
  }
  return [...groups.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([k, items]) => ({ date: fmt(k), items }));
})();

export const changeLabel = (n: number) => (n > 0 ? `▲ ${n}` : n < 0 ? `▼ ${-n}` : '–');
export const changeClass = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : 'same');
