import { createHash } from 'node:crypto';
import type { Beat } from './news';

export interface Line { kind: 'say' | 'card' | 'note'; who: string; text: string; say: string; voice: string; v: string }

/**
 * The words the voice actually reads, when they need to differ from what's on the page.
 * Cards are written in capitals with dots between parts, so they're turned into normal sentences.
 * "Live" as in "on air" is spelled "lyve", so it rhymes with "five" instead of "give".
 */
export function speakable(text: string, kind: Line['kind']) {
  let t = text;
  if (kind === 'card') {
    t = t.split(/\s*·\s*/).map((part) => part.toLowerCase().replace(/(^|\s)(\S)/g, (m, sp, c) => sp + c.toUpperCase())).join('. ') + '.';
    t = t.replace(/\bThe Crystal Hour\b/g, 'The Crystal Hour');
  }
  t = t.replace(/\blive (from|on|holovision|tonight|shows?|broadcasts?|audiences?|music|sets?)\b/gi, (m, w) => `lyve ${w}`)
       .replace(/\b(we're|we are|you're|you are|is|are|was|go|goes|going|went) live\b/gi, (m, w) => `${w} lyve`)
       .replace(/\bLIVE\b/g, 'lyve');
  return t;
}

/** Short fingerprint of a line's voice and text. It changes whenever either does, so old audio is never reused. */
export const lineKey = (voice: string, text: string) => createHash('sha256').update(`${voice}|${text}`).digest('hex').slice(0, 10);

const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/** Flattens an episode's beats into numbered lines, in the same order the page shows them. */
export function episodeLines(beats: Beat[], voices: { narrator?: string; cast?: Record<string, string>; pool?: string[] }): Line[] {
  const narrator = voices.narrator || 'asteria';
  const cast = voices.cast || {};
  const pool = voices.pool?.length ? voices.pool : ['orion', 'aurora'];
  const voiceFor = (who: string) => cast[who] || pool[hash(who) % pool.length];
  const out: Line[] = [];
  for (const b of beats) {
    if (b.kind === 'card') { const say = speakable(b.text, 'card'); out.push({ kind: 'card', who: '', text: b.text, say, voice: narrator, v: lineKey(narrator, say) }); }
    else if (b.kind === 'action') { const say = speakable(b.text, 'note'); out.push({ kind: 'note', who: '', text: b.text, say, voice: narrator, v: lineKey(narrator, say) }); }
    else for (const l of b.lines) { const voice = b.speaker ? voiceFor(b.speaker) : narrator; const say = speakable(l, 'say'); out.push({ kind: 'say', who: b.speaker ?? '', text: l, say, voice, v: lineKey(voice, say) }); }
  }
  return out;
}
