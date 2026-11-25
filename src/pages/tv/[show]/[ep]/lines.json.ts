// Every line of an episode, numbered in reading order, with the voice it should be read in.
// The Listen button asks the TTS Worker for "line N of this episode", and the Worker reads the text
// from this file, so it only ever voices lines that are really published on the wiki.
import fs from 'node:fs';
import { load } from 'js-yaml';
import { getShows } from '../../../../lib/tv';
import { episodeLines } from '../../../../lib/tts';

export function getStaticPaths() {
  return getShows().filter((s) => !s.external).flatMap((s) => s.episodes.map((e) => ({ params: { show: s.slug, ep: e.slug }, props: { e } })));
}

export function GET({ props }: { props: { e: any } }) {
  const voices = (load(fs.readFileSync('src/data/tv/voices.yml', 'utf8')) as any) || {};
  return new Response(JSON.stringify({ v: 1, lines: episodeLines(props.e.beats, voices) }), { headers: { 'Content-Type': 'application/json' } });
}
