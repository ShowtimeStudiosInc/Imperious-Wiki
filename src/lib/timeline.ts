/** Loads the Timeline (src/data/timeline.yml and src/data/timeline/<slug>.md). */
import { load } from 'js-yaml';
import fs from 'node:fs';

export interface Part { id: string; when: string; title: string; paras: string[] }
export interface Era { slug: string; title: string; name: string; tagline: string; emblem: string; heading?: string; parts: Part[] }
export interface Event {
  id: string; title: string; when?: string; segment?: string; link?: string; at?: string; x?: number;
  status?: 'open' | 'pending' | 'sealed'; current?: boolean; kind?: 'news';
}
export interface Track {
  key: string; label: string; name?: string; color: string; style?: 'solid' | 'dotted';
  from_left?: boolean; to_right?: boolean; ends_at?: string; note?: string;
  parts?: { slug: string; segment?: string; labels?: Record<string, string>; only?: string }[]; events: Event[];
}
export interface Page { key: string; title: string; sub: string; tracks: Track[] }

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Reads an Era's .md: a "# Heading", then "**WHEN · TITLE**" section lines, each followed by "> " paragraphs. */
function readParts(slug: string): { heading?: string; parts: Part[] } {
  const file = `src/data/timeline/${slug}.md`;
  if (!fs.existsSync(file)) return { parts: [] };
  const parts: Part[] = [];
  let heading: string | undefined;
  let cur: Part | null = null;
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('# ')) { heading = line.slice(2).trim(); continue; }
    const sec = line.match(/^\*\*(.+?)\*\*$/);
    if (sec) {
      const [when, ...rest] = sec[1].split(' · ');
      const title = (rest.join(' · ') || when).trim();
      cur = { id: slugify(title), when: rest.length ? when.trim() : '', title, paras: [] };
      parts.push(cur);
      continue;
    }
    // Every quoted line is its own paragraph (dialogue lines often sit back to back).
    const text = line.replace(/^>\s?/, '').trim();
    if (cur && text) cur.paras.push(text);
  }
  return { heading, parts };
}

const raw = load(fs.readFileSync('src/data/timeline.yml', 'utf8')) as { eras: Omit<Era, 'parts'>[]; pages: (Omit<Page, 'tracks'> & { tracks: Omit<Track, 'events'> & { events?: Event[] }[] })[] };

export const eras: Era[] = raw.eras.map((e) => ({ ...e, ...readParts(e.slug) }));
const eraBySlug = new Map(eras.map((e) => [e.slug, e]));

/** Pages with every track's events filled in (Era lore sections become events). */
export const pages: Page[] = raw.pages.map((p) => ({
  ...p,
  tracks: p.tracks.map((t) => ({
    ...t,
    events: [
      ...(t.parts ?? []).flatMap((src) =>
        (eraBySlug.get(src.slug)?.parts ?? []).filter((pt) => !src.only || pt.when.includes(src.only)).map((pt) => ({ id: pt.id, title: src.labels?.[pt.id] ?? pt.title, when: pt.when, segment: src.segment, link: `/timeline/${src.slug}/#${pt.id}` }))),
      ...(t.events ?? []),
    ],
  })),
}));

/** Where every event on a page sits, in percent. Tracks with lore sections spread evenly; "at" borrows another event's spot; "x" pins it. */
export function layout(page: Page) {
  const pos = new Map<string, number>();
  const spread = (n: number, i: number) => (n === 1 ? 56 : 20 + (i * 74) / (n - 1));
  for (const t of page.tracks) t.events.forEach((e, i) => { if (e.x != null) pos.set(e.id, e.x); else if (!e.at) pos.set(e.id, spread(t.events.length, i)); });
  for (const t of page.tracks) for (const e of t.events) if (e.at && e.x == null) pos.set(e.id, pos.get(e.at) ?? 50);
  return pos;
}

/** Hex emblems, drawn on a 100 x 100 grid in currentColor. */
export const EMBLEMS: Record<string, string> = {
  // four stones drifting apart from one point
  'four-stones': '<circle cx="50" cy="50" r="9"/><path d="M50 14l6 10-6 10-6-10z"/><path d="M86 50l-10 6-10-6 10-6z" opacity=".75"/><path d="M50 86l-6-10 6-10 6 10z" opacity=".55"/><path d="M14 50l10-6 10 6-10 6z" opacity=".35"/>',
  // stars lined up in rows
  rows: '<g>' + [26, 50, 74].map((y) => [26, 50, 74].map((x) => `<circle cx="${x}" cy="${y}" r="6"/>`).join('')).join('') + '</g>',
  // a gem with rays, the golden stone
  sunstone: '<path d="M50 30l14 20-14 20-14-20z"/><g stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M50 12v8M50 80v8M12 50h8M80 50h8M23 23l6 6M71 71l6 6M77 23l-6 6M29 71l-6 6"/></g>',
  // scales
  scales: '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M50 18v62M30 80h40M22 32h56"/><path d="M22 32l-10 24h20zM78 32l-10 24h20z"/></g><circle cx="50" cy="18" r="5"/>',
  // five points around a center
  five: [0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return `<path transform="translate(${50 + 30 * Math.cos(a)} ${50 + 30 * Math.sin(a)})" d="M0 -9l6 9-6 9-6-9z"/>`; }).join('') + '<circle cx="50" cy="50" r="6" opacity=".6"/>',
  // a gate
  gate: '<g fill="none" stroke="currentColor" stroke-width="5"><path d="M24 84V44a26 26 0 0 1 52 0v40"/><path d="M36 84V48a14 14 0 0 1 28 0v36"/></g><path d="M16 84h68v6H16z"/>',
  // an anvil
  anvil: '<path d="M14 34h54c0 10 8 14 18 14v8H66c-4 0-6 3-6 7v5h8v8H32v-8h8v-5c0-6-4-9-10-9H14z"/>',
  // a hatch with a ladder going down
  hatch: '<g fill="none" stroke="currentColor" stroke-width="5"><circle cx="50" cy="34" r="20"/><path d="M50 14v40M30 34h40"/><path d="M40 62v26M60 62v26M40 70h20M40 80h20"/></g>',
};

/** Small part icons, used in order for a node's sections. */
export const PART_ICONS = [
  '<circle cx="12" cy="12" r="4"/><circle cx="4" cy="4" r="2"/><circle cx="20" cy="4" r="2"/><circle cx="20" cy="20" r="2"/><circle cx="4" cy="20" r="2"/>',
  '<path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',
  '<g stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3v18M4 7.5l16 9M4 16.5l16-9"/></g>',
  '<path d="M6 3h2v18H6zM8 4h11l-3 4 3 4H8z"/>',
  '<g>' + [6, 12, 18].map((y) => [6, 12, 18].map((x) => `<circle cx="${x}" cy="${y}" r="2"/>`).join('')).join('') + '</g>',
  '<g fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/></g>',
  '<path d="M5 3h10l4 4v14H5z" opacity=".9"/><path d="M8 11h8v2H8zM8 15h6v2H8z" fill="#0d0818"/>',
  '<path d="M12 3l7 9-7 9-7-9z"/>',
];
