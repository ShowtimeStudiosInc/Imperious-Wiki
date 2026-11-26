/**
 * Holovision: the wiki's TV guide. Shows come from src/data/tv/shows.yml, and each show's episodes
 * from src/data/tv/episodes/<show>/*.yml. Transcripts use the same markers as Homeworld Times
 * broadcasts (see src/lib/news.ts), so a show can be pasted the way it was posted on Discord.
 */
import fs from 'node:fs';
import { load } from 'js-yaml';
import { url } from './gems';
import { parseTranscript, getBroadcasts, type Beat } from './news';

export interface Episode {
  show: string; slug: string; title: string; date: string; host: string; guests: string[];
  /** When it airs in the story: the storyline it falls in and the in-roleplay time. */
  story: { arc: string; arcTitle: string; when: string; href: string } | null;
  credits: string; summary: string; beats: Beat[]; href: string; minutes: number;
}
export interface Show {
  slug: string; name: string; tagline: string; host: string; where: string; network: string; kind: string;
  color: string; accent: string; status: 'on-air' | 'coming-soon'; order: number;
  href: string; external: boolean; episodes: Episode[]; latest: { title: string; date: string; href: string; summary: string } | null;
}

const iso = (d: unknown) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d ?? '').slice(0, 10));
/** Roughly how long an episode runs on air, from its spoken words (about 150 a minute). */
const runtime = (beats: Beat[]) => {
  const words = beats.reduce((n, b) => n + (b.kind === 'speech' ? b.lines.join(' ') : b.text).split(/\s+/).length, 0);
  return Math.max(1, Math.round(words / 150));
};

export function getEpisodes(show: string): Episode[] {
  const dir = `src/data/tv/episodes/${show}`;
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).map((f) => {
    const slug = f.replace(/\.ya?ml$/, '');
    const d = (load(fs.readFileSync(`${dir}/${f}`, 'utf8')) as any) || {};
    const beats = parseTranscript(d.transcript || '');
    let story = null;
    if (d.story && d.story.arc) {
      const file = `src/data/storylines/${d.story.arc}.yml`;
      const arc = fs.existsSync(file) ? ((load(fs.readFileSync(file, 'utf8')) as any) || {}) : {};
      story = { arc: d.story.arc, arcTitle: arc.title || d.story.arc, when: d.story.when || '', href: url(`/events/${d.story.arc}/`) };
    }
    return {
      show, slug, title: d.title || slug, date: iso(d.date), host: d.host || '', guests: d.guests || [],
      credits: d.credits || '', summary: d.summary || '', story, beats, href: url(`/tv/${show}/${slug}/`), minutes: runtime(beats),
    };
  }).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export function getShows(): Show[] {
  const raw = (load(fs.readFileSync('src/data/tv/shows.yml', 'utf8')) as any[]) || [];
  return raw.map((s) => {
    const episodes = s.href ? [] : getEpisodes(s.slug);
    let latest: Show['latest'] = null;
    if (s.slug === 'homeworld-times') {
      const b = getBroadcasts()[0];
      if (b) latest = { title: b.title, date: b.date, href: b.href, summary: b.summary };
    } else if (episodes[0]) {
      const e = episodes[0];
      latest = { title: e.title, date: e.date, href: e.href, summary: e.summary };
    }
    return {
      slug: s.slug, name: s.name, tagline: s.tagline || '', host: s.host || '', where: s.where || '', network: s.network || '',
      kind: s.kind || 'Show', color: s.color || '#c9b8ff', accent: s.accent || '#ffd27a', status: s.status || 'on-air', order: s.order ?? 99,
      href: url(s.href || `/tv/${s.slug}/`), external: !!s.href, episodes, latest,
    };
  }).sort((a, b) => a.order - b.order);
}
