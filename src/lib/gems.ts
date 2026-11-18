import { getCollection, type CollectionEntry } from 'astro:content';

export type Gem = CollectionEntry<'gemTypes'>['data'];

/** Prefix a site path with the base path (needed on GitHub Pages project sites). */
export function url(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return base + (path.startsWith('/') ? path : '/' + path);
}

export const RANKS: Record<string, { name: string; tier: string; level: string; budget: number | null }> = {
  '1.2': { name: 'Transcendent', tier: 'transcendent', level: 'Transcendent', budget: null },
  '2.1': { name: 'High Authoritative/Aristocratic', tier: 'rank-2', level: 'High', budget: 34 },
  '2.2': { name: 'Median Authoritative/Aristocratic', tier: 'rank-2', level: 'Median', budget: 32 },
  '2.3': { name: 'Low Authoritative/Aristocratic', tier: 'rank-2', level: 'Low', budget: 30 },
  '3.1': { name: 'High Militia', tier: 'militia', level: 'High', budget: 30 },
  '3.2': { name: 'Median Militia', tier: 'militia', level: 'Median', budget: 28 },
  '3.3': { name: 'Low Militia', tier: 'militia', level: 'Low', budget: 26 },
  '4.1': { name: 'High Service Trade', tier: 'service-trade', level: 'High', budget: 27 },
  '4.2': { name: 'Median Service Trade', tier: 'service-trade', level: 'Median', budget: 25 },
  '4.3': { name: 'Low Service Trade', tier: 'service-trade', level: 'Low', budget: 23 },
  '5.1': { name: 'High Servant', tier: 'servants', level: 'High', budget: 24 },
  '5.2': { name: 'Low Servant', tier: 'servants', level: 'Low', budget: 20 },
};

export const TIERS: { slug: string; name: string; blurb: string; match: (g: Gem) => boolean }[] = [
  { slug: 'transcendent', name: 'Transcendent', blurb: 'Rank 1.2. Cubic Zirconias and the attendants who serve the Diamonds directly.', match: (g) => g.rank === '1.2' },
  { slug: 'aristocrats', name: 'Aristocrats', blurb: 'Rank 2. The empire\'s high society: seers, hosts, performers, and keepers.', match: (g) => !!g.rank?.startsWith('2.') && g.side === 'Aristocratic' && g.faction === 'gempire' },
  { slug: 'authoritatives', name: 'Authoritatives', blurb: 'Rank 2. Commanders, judges, supervisors, and the gems who run things.', match: (g) => !!g.rank?.startsWith('2.') && g.side === 'Authoritative' && g.faction === 'gempire' },
  { slug: 'militia', name: 'Militia', blurb: 'Rank 3. Soldiers, guards, escorts, and the fusions that fight beside them.', match: (g) => !!g.rank?.startsWith('3.') && g.faction === 'gempire' },
  { slug: 'service-trade', name: 'Service Trade', blurb: 'Rank 4. Builders, terraformers, technicians, healers, and pilots.', match: (g) => !!g.rank?.startsWith('4.') && g.faction === 'gempire' },
  { slug: 'servants', name: 'Servants', blurb: 'Rank 5. Pearls, Spinels, and the helpers who keep everyone else working.', match: (g) => !!g.rank?.startsWith('5.') && g.faction === 'gempire' },
  { slug: 'discontinued', name: 'Discontinued Types', blurb: 'Gem-Types the empire no longer makes. Discontinued ones were stopped on purpose. Lost Lights are ones it can no longer make, because the formula is gone or can\'t be found.', match: (g) => g.faction === 'lost' },
  { slug: 'rogues', name: 'Rogues', blurb: 'Gem-Types rarely found inside the empire, outside of marriage.', match: (g) => g.faction === 'rogue' },
  { slug: 'united-frontier', name: 'United Frontier', blurb: 'Gem-Types of Hades 9, hidden in a fold of space.', match: (g) => g.faction === 'united-frontier' },
];

export const FACTION_LABEL: Record<string, string> = {
  gempire: 'Gempire', 'united-frontier': 'United Frontier', lost: 'Discontinued', rogue: 'Rogue',
};
export const KIND_LABEL: Record<string, string> = {
  standard: 'Standard', 'sub-type': 'Sub-type', fusion: 'Fusion', geode: 'Geode', alloy: 'Alloy', group: 'General Group',
};

export async function getGems() {
  const entries = await getCollection('gemTypes');
  return entries.map((e) => e.data).sort((a, b) => a.name.localeCompare(b.name) || (a.slug < b.slug ? -1 : 1));
}

/** Resolve a loose parent name ("hessonite") to a real slug. */
export function resolveSlug(all: Gem[], key: string | null | undefined) {
  if (!key) return null;
  const exact = all.find((g) => g.slug === key);
  if (exact) return exact;
  return all.find((g) => g.slug.startsWith(key + '-') && g.kind !== 'fusion') ?? null;
}

export type Tag = { label: string; group: string; href: string; tone?: string };

/** The chips shown under a name bar. Every chip links to the filtered catalog. */
export function tagsFor(g: Gem, all: Gem[]): Tag[] {
  const t: Tag[] = [];
  const f = (k: string, v: string) => url(`/gem-types/all/?${k}=${encodeURIComponent(v)}`);
  if (g.rank) t.push({ label: `Rank ${g.rank}`, group: 'rank', href: f('rank', g.rank) });
  if (g.side) t.push({ label: g.side, group: 'side', href: f('side', g.side) });
  if (g.era) t.push({ label: g.era, group: 'era', href: f('era', g.era) });
  if (g.kind === 'sub-type') {
    const p = resolveSlug(all, g.parent);
    t.push({ label: `Sub-type of ${p ? p.name : titleCase(g.parent!)}`, group: 'kind', href: p ? url(`/gem-types/${p.slug}/`) : f('kind', 'sub-type') });
  } else if (g.kind === 'fusion') {
    t.push({ label: 'Fusion', group: 'kind', href: f('kind', 'fusion') });
  } else if (g.kind !== 'standard') {
    t.push({ label: KIND_LABEL[g.kind], group: 'kind', href: f('kind', g.kind) });
  }
  t.push({ label: g.species === 'metal' ? 'Metal' : 'Gem', group: 'species', href: f('species', g.species) });
  t.push({ label: FACTION_LABEL[g.faction], group: 'faction', href: f('faction', g.faction), tone: g.faction });
  for (const s of g.status) t.push({ label: s, group: 'status', href: f('status', s) });
  for (const s of g.traits) t.push({ label: s, group: 'trait', href: f('trait', s) });
  if (g.court) t.push({ label: `Court ${g.court}`, group: 'court', href: f('court', g.court) });
  if (g.threatClass) t.push({ label: `Threat: ${g.threatClass}`, group: 'threat', href: f('threat', g.threatClass) });
  return t;
}

export function titleCase(s: string) {
  return s.replace(/-/g, ' ').replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** Display name with the bit that tells same-named types apart. */
export function fullName(g: Gem) {
  if (g.variant) return `${g.name} (${g.variant} Variant)`;
  if (g.kind === 'fusion' && ['Malachite', 'Opal'].includes(g.name)) return `${g.name} (Fusion)`;
  if (g.era && /-era-/.test(g.slug)) return `${g.name} (${g.era})`;
  return g.name;
}

export const hasPower = (g: Gem) => g.abilities.some((a) => a.section === 'Signature Ability');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Turns Discord-flavored text into safe HTML: custom emoji, `code`, **bold**, *italic*. */
export function rich(text: string) {
  const emoji: string[] = [];
  let s = text.replace(/<:(\w+):(\d+)>/g, (_, name, id) => {
    emoji.push(`<img class="demoji" src="https://cdn.discordapp.com/emojis/${id}.webp?size=32" alt="" aria-hidden="true">`);
    return `\u0000${emoji.length - 1}\u0000`;
  });
  s = esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\W)\*([^*]+)\*(?=\W|$)/g, '$1<em>$2</em>')
    .replace(/\n\n/g, '</p><p>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => emoji[Number(i)]);
}

export function characterTemplate(g: Gem) {
  const s = g.stats;
  const v = (n?: number) => (n === undefined ? '' : String(n));
  return [
    '## Gem Information', '- _`Name:`_ ', '- _`Facet & Cut:`_ ', `- _\`Era:\`_ ${g.era ?? ''}`, '- _`Nicknames:`_ ', '- _`Pronouns:`_ ', '- _`Affiliation:`_ ',
    '## Behavior', '- _`Personality:`_ ', '- _`Likes:`_ ', '- _`Dislikes:`_ ', '- _`Attraction towards(Male Presenting or Female Presenting Gems?):`_ ', '- _`Relationships:`_ ', '- _`Fear:`_ ', '- _`Alignment:`_ ',
    '## Capabilities', `- _\`Gem Type:\`_ ${fullName(g)}`, '- _`Gem Placement:`_ ', '- _`Place of Birth:`_', `- _\`Powers & Abilities:\`_ ${g.abilities.filter((a) => a.section !== 'Latent Ability' && a.name).map((a) => a.name).join(', ')}`,
    '## Stats', `- _\`HP:\`_ ${v(s?.hp)}`, `- _\`ATK:\`_ ${v(s?.atk)}`, '  - _`Weapon 1 (Optional):`_ ', '  - _`Weapon 2 (Optional):`_ ', `- _\`DEF:\`_ ${v(s?.def)}`, '  - _`Armor (Optional):`_ ', '  - _`Accessories 1 (Optional):`_', '  - _`Accessories 2 (Optional):`_',
    `- _\`SPD:\`_ ${v(s?.spd)}`, `- _\`INT:\`_ ${v(s?.int)}`, `- _\`MAG:\`_ ${v(s?.mag)}`, '- _`LVL:`_ 1', '  - _`EXP:`_ 0',
    '## Appearance', `- _\`Natural Height:\`_ ${g.height ?? ''}`, '- _`Appearance (Image/Description):`_',
  ].join('\n');
}
