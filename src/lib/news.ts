/**
 * The Homeworld Times: news broadcasts from src/data/news/*.yml.
 *
 * A transcript is written the way it's posted on Discord, with a few markers:
 *   [BROADCAST GOING LIVE...]   a line in square brackets is an on-screen card
 *   * She leans forward.        a line starting with "* " is an action or camera note
 *   *She leans forward.*        so is a line wrapped in single asterisks
 *   @Vevila Dei                 "@Name" switches who is talking
 *   - Good evening...           anything else is a spoken line ("- ", "# - ", "• " and quotes are trimmed)
 * Code fences (```) and blank lines are ignored, so a Discord post can be pasted as it is.
 */
import fs from 'node:fs';
import { load } from 'js-yaml';
import { url } from './gems';
import { earlierNews, personFor } from './popularity';

export type Beat =
  | { kind: 'card'; text: string }
  | { kind: 'action'; text: string }
  | { kind: 'speech'; speaker: string | null; lines: string[] };

export interface Change { who: string; change: number; text: string }
export interface Broadcast {
  slug: string;
  title: string;
  date: string;
  anchor: string;
  guests: string[];
  credits: string;
  summary: string;
  beats: Beat[];
  href: string;
  /** Rating changes: applied ones come from the Approval Rating, pending ones from the report itself. */
  impact: { applied: boolean; changes: (Change & { name: string; href: string | null })[]; unrest: number; unrestText: string } | null;
}

const DIR = 'src/data/news';
const iso = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '').slice(0, 10));

export function parseTranscript(text: string): Beat[] {
  const beats: Beat[] = [];
  let speaker: string | null = null;
  const say = (line: string) => {
    const last = beats[beats.length - 1];
    if (last && last.kind === 'speech' && last.speaker === speaker) last.lines.push(line);
    else beats.push({ kind: 'speech', speaker, lines: [line] });
  };
  for (const raw of (text || '').split('\n')) {
    let line = raw.trim();
    if (!line || /^```/.test(line)) continue;
    line = line.replace(/^```|```$/g, '').trim();
    if (!line) continue;
    if (line.startsWith('@')) { speaker = line.slice(1).trim() || null; continue; }
    if (/^\[.*\]$/.test(line)) { beats.push({ kind: 'card', text: line.slice(1, -1).trim() }); continue; }
    if (/^\*\s/.test(line)) { beats.push({ kind: 'action', text: line.slice(2).trim() }); continue; }
    if (/^\*[^*].*[^*]\*$/.test(line)) { beats.push({ kind: 'action', text: line.slice(1, -1).trim() }); continue; }
    line = line.replace(/^#+\s*/, '').replace(/^[-•]\s*/, '').replace(/^\*\*(.*)\*\*$/, '$1').trim();
    line = line.replace(/^["“](.*)["”]$/, '$1');
    if (line) say(line);
  }
  return beats;
}

export function getBroadcasts(): Broadcast[] {
  if (!fs.existsSync(DIR)) return [];
  return fs
    .readdirSync(DIR)
    .filter((f) => /\.ya?ml$/.test(f))
    .map((f) => {
      const slug = f.replace(/\.ya?ml$/, '');
      const d = load(fs.readFileSync(`${DIR}/${f}`, 'utf8')) as any;
      const applied = earlierNews.find((n: any) => n.news === slug);
      let impact: Broadcast['impact'] = null;
      if (applied) {
        impact = {
          applied: true,
          changes: applied.changes.map((c: any) => ({ who: c.who, change: c.change, text: c.text, name: c.person.name, href: c.person.href })),
          unrest: Number(applied.unrest || 0),
          unrestText: applied.unrest_text || '',
        };
      } else if ((d.changes && d.changes.length) || d.unrest) {
        impact = {
          applied: false,
          changes: (d.changes || []).map((c: any) => ({ ...c, change: Number(c.change), name: personFor(c.who)?.name ?? c.who, href: personFor(c.who)?.href ?? null })),
          unrest: Number(d.unrest || 0),
          unrestText: d.unrest_text || '',
        };
      }
      return {
        slug,
        title: d.title || slug,
        date: iso(d.date),
        anchor: d.anchor || 'The Homeworld Times',
        guests: (d.guests || []).filter(Boolean),
        credits: d.credits || '',
        summary: d.summary || '',
        beats: parseTranscript(d.transcript || ''),
        href: url(`/news/${slug}/`),
        impact,
      } satisfies Broadcast;
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
}

export const airDate = (d: string) =>
  d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';
