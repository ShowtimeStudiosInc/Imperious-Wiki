// Builds the Gem Builder's database from the wiki's own data, so the builder always matches the
// Gem-Type pages. Shape follows the original Imperious-Gem-Builder repo (window.GEM_DATABASE).
import { readFileSync } from 'node:fs';
import { load } from 'js-yaml';
import { getGems, RANKS, url, type Gem } from './gems';

const S = ['HP', 'ATK', 'DEF', 'SPD', 'INT', 'MAG'] as const;
type Stats = Record<(typeof S)[number], number>;
const toStats = (s: any): Stats | null =>
  s ? { HP: s.hp ?? 0, ATK: s.atk ?? 0, DEF: s.def ?? 0, SPD: s.spd ?? 0, INT: s.int ?? 0, MAG: s.mag ?? 0 } : null;
const add = (a: Stats, b: Stats): Stats => Object.fromEntries(S.map((k) => [k, a[k] + b[k]])) as Stats;

const FACTION: Record<string, string> = {
  gempire: 'Gempire',
  'united-frontier': 'United Frontier',
  rogue: 'Rogues',
  lost: 'Lost Light',
};
const RATINGS = ['Limited', 'Minor', 'Base', 'Enhanced', 'Advanced', 'Perfect'];
const CLASSES = ['Physical', 'Summoning', 'Visions', 'Shapeshifting', 'Enchantments', 'Alteration', 'Entropy', 'Elements'];
const plain = (t = '') => t.replace(/<:([A-Za-z_]+):\d+>/g, '').replace(/\s+/g, ' ').trim();

function details(g: Gem) {
  return g.abilities.map((a) => {
    const tags = a.tags || [];
    const desc = plain(a.text) + (a.moves?.length ? ' ' + a.moves.map((m) => `${m.name}${m.cost != null ? ` (${m.cost} SP)` : ''}: ${plain(m.text)}`).join(' ') : '');
    return {
      type: a.section,
      name: a.name || a.section,
      names: [a.name || a.section],
      rating: tags.find((t) => RATINGS.includes(t)) || null,
      category: tags.find((t) => CLASSES.includes(t)) || null,
      cost: a.cost ?? null,
      passive: tags.includes('PASSIVE'),
      description: desc,
      moves: (a.moves || []).map((m) => m.name),
    };
  });
}

function rankLabel(g: Gem) {
  if (!g.rank) return null;
  const r = RANKS[g.rank];
  return r ? `${g.rank} ${r.name}` : g.rank;
}

export async function builderDatabase() {
  const all = await getGems();
  const bySlug = new Map(all.map((g) => [g.slug, g]));
  const gems: any[] = [];
  const quartzShifts: any[] = [];

  for (const g of all) {
    const record: any = {
      name: g.name,
      slug: g.slug,
      href: url(`/gem-types/${g.slug}/`),
      gemstone: g.gemstone ? url(g.gemstone) : null,
      faction: FACTION[g.faction] || g.faction,
      rank: rankLabel(g),
      statBudget: g.rank ? RANKS[g.rank]?.budget ?? null : null,
      stats: toStats(g.stats),
      statModifier: null,
      abilities: g.abilities.map((a) => a.name || a.section),
      abilityDetails: details(g),
      fusion: g.kind === 'fusion',
      components: [],
      componentStats: null,
      kind: g.species === 'metal' ? 'Metal' : null,
      tags: [g.era ? `Era ${String(g.era).replace(/^Era\s*/i, '')}` : null, g.kind === 'fusion' ? 'Fusion' : null, g.species === 'metal' ? 'Metal' : null].filter(Boolean),
      height: g.height,
    };
    if ((g as any).shiftOf) {
      quartzShifts.push({ ...record, stats: null, statModifier: toStats((g as any).modifiers) });
      continue;
    }
    if (g.kind === 'fusion' && g.components?.length === 2) {
      const halves = g.components.map((c) => bySlug.get(c));
      record.components = halves.map((h, i) => h?.name || g.components![i]);
      const hs = halves.map((h) => toStats(h?.stats));
      if (hs[0] && hs[1]) record.componentStats = add(hs[0], hs[1]);
    }
    gems.push(record);
  }

  const mods: any[] = load(readFileSync(process.cwd() + '/src/data/modifiers.yml', 'utf8')) as any[];
  const special = (m: any) =>
    (m.specials || []).map((s: any) => ({ type: 'Modifier Special', name: s.name, names: [s.name], cost: s.cost, description: plain(s.text) }));
  const modifiers = mods
    .filter((m) => m.kind !== 'cut')
    .map((m) => ({
      name: m.slug === 'era-0-1' ? 'Era 0-1 Metal Society' : m.name,
      category: m.kind,
      stats: toStats(m.stats),
      abilityDetails: special(m),
      unique: m.kind === 'sole' || m.kind === 'mix',
      ...(m.slug === 'era-0-1' ? { applicableKinds: ['Metal'] } : {}),
    }));
  const cuts: Record<string, any> = {
    Standard: { name: 'Standard', stats: toStats({}), abilityDetails: [], description: 'Most gems are Standard and get no cut quality modifier.' },
  };
  for (const m of mods.filter((m) => m.kind === 'cut')) {
    cuts[m.name] = { name: m.name, stats: toStats(m.stats || {}), abilityDetails: special(m), description: plain(m.statsText || '') };
  }

  const fusionIdeas = (load(readFileSync(process.cwd() + '/src/data/fusion-ideas.yml', 'utf8')) as any[]) || [];

  return {
    gems,
    quartzShifts,
    fusionIdeas,
    modifiers,
    cuts,
    rules: {
      levelCap: 30,
      experience: { firstLevel: 2, firstThreshold: 100, increasePerLevel: 25 },
      levelGrowth: { hpPerLevel: 2, hpPerDefGain: 2, atkEveryLevels: 3, defEveryLevels: 4, spdEveryLevels: 6, intEveryLevels: 0, magEveryLevels: 3, gemMagPerGain: 2, organicMagPerGain: 1 },
    },
  };
}
