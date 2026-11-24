import fs from 'node:fs';
import { load } from 'js-yaml';

export interface Quest { id: string; status: 'locked' | 'open' | 'taken' | 'done'; title?: string; hint?: string; giver?: string; location?: string; reward?: string; party?: string[]; text?: string }
export interface Storyline {
  slug: string; title: string; kind: string; era: string; status: string; theme?: string; tagline: string; summary: string; how_to_join?: string;
  lore: { title: string; paras: string[] }[];
  chapters: { slug: string; title: string; when?: string; summary: string }[];
  quests: Quest[];
  locations: { name: string; kind: string; text: string; thread?: string }[];
  npcs: { role: string; gem: string; name?: string; text: string }[];
  rogues: { name: string; note: string; visitor?: boolean }[];
  tools: { name: string; status: 'live' | 'planned'; text: string }[];
}

const dir = 'src/data/storylines';
export const storylines: Storyline[] = fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((f) => f.endsWith('.yml')).map((f) => load(fs.readFileSync(`${dir}/${f}`, 'utf8')) as Storyline)
  : [];
