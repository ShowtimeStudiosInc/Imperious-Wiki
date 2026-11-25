import type { Beat } from './news';

export interface Line { kind: 'say' | 'card' | 'note'; who: string; text: string; voice: string }

const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/** Flattens an episode's beats into numbered lines, in the same order the page shows them. */
export function episodeLines(beats: Beat[], voices: { narrator?: string; cast?: Record<string, string>; pool?: string[] }): Line[] {
  const narrator = voices.narrator || 'asteria';
  const cast = voices.cast || {};
  const pool = voices.pool?.length ? voices.pool : ['orion', 'aurora'];
  const voiceFor = (who: string) => cast[who] || pool[hash(who) % pool.length];
  const out: Line[] = [];
  for (const b of beats) {
    if (b.kind === 'card') out.push({ kind: 'card', who: '', text: b.text, voice: narrator });
    else if (b.kind === 'action') out.push({ kind: 'note', who: '', text: b.text, voice: narrator });
    else for (const l of b.lines) out.push({ kind: 'say', who: b.speaker ?? '', text: l, voice: b.speaker ? voiceFor(b.speaker) : narrator });
  }
  return out;
}
