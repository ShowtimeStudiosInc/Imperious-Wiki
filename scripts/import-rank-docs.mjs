// Turns the Discord-format rank posts in /raw into one YAML data file per Gem-Type.
// Run with: npm run import
// It overwrites files in src/data/gem-types, so edit the raw posts (or the YAML) and re-run.
import fs from 'node:fs';
import path from 'node:path';
import * as yaml from 'js-yaml';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RAW = path.join(ROOT, 'raw');
const OUT = path.join(ROOT, 'src/data/gem-types');
const extras = yaml.load(fs.readFileSync(path.join(ROOT, 'src/data/extras.yml'), 'utf8'));

const FILE_RANK = {
  'rank-1-2.md': '1.2', 'rank-2-1.md': '2.1', 'rank-2-2.md': '2.2', 'rank-2-3.md': '2.3',
  'rank-3-1.md': '3.1', 'rank-3-2.md': '3.2', 'rank-3-3.md': '3.3',
  'rank-4-1.md': '4.1', 'rank-4-2.md': '4.2', 'rank-4-3.md': '4.3',
  'rank-5-1.md': '5.1', 'rank-5-2.md': '5.2', 'discontinued.md': null, 'united-frontier.md': null, 'rogues.md': null,
};

const METALS = new Set(['gold', 'silver', 'platinum', 'steel', 'iron', 'tungsten', 'copper', 'bronze', 'brass',
  'titanium', 'cobalt', 'chromium', 'tivcral', 'uranium', 'stellite']);

const slugify = (s) => s.toLowerCase().replace(/\(.*?\)/g, (m) => m).replace(/[()]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const title = (s) => s.toLowerCase().replace(/(^|[\s\-(])([a-z])/g, (m, a, b) => a + b.toUpperCase());

const ABILITY_LINE = /^\s*`([^`]+)`((?:\s*\[[^\]]*\])*)\s*-\s*(.*)$/;
const MOVE_LINE = /^>\s*-\s*`([^`]+)`((?:\s*\[[^\]]*\])*)\s*-\s*(.*)$/;
const SECTION = /^-?\s*_``([^`]+?):``_\s*(.*)$/;

function splitNameTags(raw) {
  // "Hush [2 SP] [REACTION]" -> name "Hush", tags ["2 SP","REACTION"]
  const tags = [];
  const name = raw.replace(/\s*\[([^\]]+)\]/g, (_, t) => { tags.push(t.trim()); return ''; }).trim();
  return { name, tags };
}
function extraTags(str) {
  const tags = [];
  (str || '').replace(/\[([^\]]+)\]/g, (_, t) => tags.push(t.trim()));
  return tags;
}
function costOf(tags) {
  const sp = tags.find((t) => /^\d+\s*SP$/i.test(t));
  return sp ? Number(sp.match(/\d+/)[0]) : null;
}
const isLore = (l) => /^`/.test(l) && !ABILITY_LINE.test(l) && /`\s*$/.test(l);
const stripLore = (l) => l.replace(/^`+|`+$/g, '').trim();

function parseHeader(line, fileRank) {
  const m = line.match(/^#\s+(.+)$/);
  let rest = m[1].trim();
  const tags = [];
  rest = rest.replace(/\s*\[([^\]]+)\]/g, (_, t) => { tags.push(t.trim()); return ''; }).trim();
  const g = {
    displayName: title(rest),
    kind: 'standard', parent: null, era: null, variant: null,
    faction: fileRank === null ? 'lost' : 'gempire',
    species: 'gem', status: [], headerTags: tags,
  };
  for (const t of tags) {
    const u = t.toUpperCase();
    let mm;
    if ((mm = u.match(/^SUB-TYPE(?: OF)?\s+(.+)$/))) {
      if (u.includes('FUSION')) { g.kind = 'fusion'; g.variantOf = title(mm[1].replace(/ FUSION$/, '')); }
      else { g.kind = 'sub-type'; g.parent = title(mm[1]); }
    } else if ((mm = u.match(/^(.+) VARIANT FUSION$/))) { g.kind = 'fusion'; g.variant = title(mm[1]); }
    else if ((mm = u.match(/^(.+) VARIANT$/))) { g.variant = title(mm[1]); }
    else if (u === 'FUSION') g.kind = 'fusion';
    else if (u === 'NON-FUSION') g.nonFusion = true;
    else if (u === 'GEODE') g.kind = 'geode';
    else if (u === 'ALLOY') { g.kind = 'alloy'; g.species = 'metal'; }
    else if (u === 'METAL') g.species = 'metal';
    else if (u === 'METAL SOCIETY') { g.species = 'metal'; g.status.push('Legacy'); }
    else if (u === 'GENERAL GROUP') g.kind = 'group';
    else if (u === 'DISCONTINUED GEM-TYPE') g.status.push('Discontinued');
    else if (u === 'LOST GEM-TYPE' || u === 'LOST LIGHT') { g.faction = 'lost'; g.status.push('Lost Light'); }
    else if (u === 'UNITED FRONTIER GEM-TYPE' || u === 'UNITED FRONTIER') g.faction = 'united-frontier';
    else if (u === 'THE QUARTZ GROUP') g.quartzGroup = true;
    else if (u === 'ROGUE GEM-TYPE' || u === 'ROGUE') g.faction = 'rogue';
    else if ((mm = t.match(/^ERA\s+(.+)$/i))) g.era = 'Era ' + mm[1].replace(/side-b/i, 'Side-B');
    else g.unknownTags = [...(g.unknownTags || []), t];
  }
  // Polyhedroid Agate is both a sub-type and a geode.
  if (tags.some((t) => /^GEODE$/i.test(t)) && tags.some((t) => /^SUB-TYPE/i.test(t))) {
    g.kind = 'sub-type'; g.geode = true;
  }
  if (METALS.has(g.displayName.toLowerCase())) g.species = 'metal';
  return g;
}

function parseBlock(lines, fileRank) {
  const head = parseHeader(lines[0], fileRank);
  const gem = { ...head, rank: fileRank, stats: null, abilities: [], role: '', interactions: '', notes: [], extraBlocks: [] };
  const stats = {};
  let section = null;
  let current = null;
  let after = null; // 'role' | 'interactions'
  let extra = null;
  let modMode = false;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\s+$/, '');
    if (!line.trim()) { current = null; continue; }
    let m;
    if (/STAT MODIFIER/.test(line)) { modMode = true; continue; }
    if (modMode && (m = line.match(/^_``(HP|ATK|DEF|SPD|INT|MAG):``_\s*([+-]?\d+)\s*(?:\(HP\s*([+-]?\d+)\))?/))) {
      gem.modifiers = gem.modifiers || {};
      gem.modifiers[m[1].toLowerCase()] = Number(m[2]);
      if (m[3] !== undefined) gem.modifiers.hp = Number(m[3]);
      continue;
    }
    if ((m = line.match(/^_``(HP|ATK|DEF|SPD|INT|MAG):``_\s*(.*)$/))) {
      const v = m[2].trim();
      stats[m[1].toLowerCase()] = /^\d+$/.test(v) ? Number(v) : null;
      continue;
    }
    if (/BASE STATS/.test(line)) continue;
    if (/^_``(Rank|Gemstone Appearance):``_/.test(line)) { section = null; continue; }
    if ((m = line.match(/^\*\*``(.+?)``\*\*$/))) { extra = { title: title(m[1]), lines: [] }; gem.extraBlocks.push(extra); section = null; continue; }
    if (extra && /^`\d+\s*-/.test(line)) { extra.lines.push(line.replace(/^`|`/g, (x) => x).trim()); continue; }
    if ((m = line.match(SECTION))) {
      const label = m[1].trim();
      if (/^Interactions$/i.test(label)) { after = 'interactions'; section = null; continue; }
      section = label.replace(/ Abilities$/, ' Ability');
      if (m[2].trim()) {
        // A label with its text on the same line (like "Hessonite Half:") is a note; abilities after it are Signature Abilities.
        gem.abilities.push({ section, name: null, tags: [], cost: null, text: m[2].trim(), moves: [] });
        section = 'Signature Ability';
      }
      current = null;
      continue;
    }
    if (line.startsWith('-# ')) { gem.notes.push(line.slice(3).trim()); continue; }
    if ((m = line.match(MOVE_LINE)) && current) {
      const { name, tags } = splitNameTags(m[1]);
      const t2 = [...tags, ...extraTags(m[2])];
      current.moves.push({ name, tags: t2, cost: costOf(t2), text: m[3].trim() });
      continue;
    }
    if (/^- `/.test(line) && current) { // move line without quote marker
      const mm = line.slice(2).match(ABILITY_LINE);
      if (mm) { const { name, tags } = splitNameTags(mm[1]); const t2 = [...tags, ...extraTags(mm[2])]; current.moves.push({ name, tags: t2, cost: costOf(t2), text: mm[3].trim() }); continue; }
    }
    if (isLore(line.trim())) {
      const text = stripLore(line.trim());
      if (after === 'interactions') { gem.interactions = text; after = null; }
      else if (!gem.role) gem.role = text;
      else gem.role += '\n\n' + text;
      section = null; current = null;
      continue;
    }
    if (section && (m = line.trim().match(ABILITY_LINE))) {
      const { name, tags } = splitNameTags(m[1]);
      const t2 = [...tags, ...extraTags(m[2])];
      current = { section, name, tags: t2, cost: costOf(t2), text: m[3].trim(), moves: [] };
      gem.abilities.push(current);
      continue;
    }
    if (section) { // plain text under a section
      current = { section, name: null, tags: [], cost: null, text: line.trim(), moves: [] };
      gem.abilities.push(current);
      continue;
    }
    gem.unparsed = [...(gem.unparsed || []), line];
  }
  if (Object.keys(stats).length) gem.stats = Object.values(stats).some((v) => v === null) ? null : stats;
  return gem;
}

function slugFor(g) {
  let base = g.displayName;
  if (g.variant) base += ' ' + g.variant + ' variant';
  else if (g.era && ['Hessonite', 'Hematite', 'Peridot', 'Gold', 'Steel', 'Bronze'].includes(g.displayName)) base += ' ' + g.era;
  else if (g.kind === 'fusion' && ['Malachite', 'Opal'].includes(g.displayName)) base += ' fusion';
  else if (g.faction === 'united-frontier' && g.quartzGroup && g.displayName !== 'Clear Quartz') base += ' uf';
  return slugify(base);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const all = [];
for (const [file, rank] of Object.entries(FILE_RANK)) {
  const p = path.join(RAW, file);
  if (!fs.existsSync(p)) continue;
  const text = fs.readFileSync(p, 'utf8');
  const blocks = [];
  let cur = null;
  for (const line of text.split(/\r?\n/)) {
    if (/^#\s+\S/.test(line) && !/^#\s+⟡/.test(line)) { cur = [line]; blocks.push(cur); }
    else if (cur) cur.push(line);
  }
  for (const b of blocks) {
    if (/DIAMOND\s*$/i.test(b[0]) && !/\[/.test(b[0])) continue; // Diamond profiles live elsewhere
    all.push(parseBlock(b, rank));
  }
}

const bySlug = {};
for (const g of all) {
  g.slug = slugFor(g);
  if (bySlug[g.slug]) g.slug += '-' + (g.rank || 'lost').replace('.', '-');
  bySlug[g.slug] = g;
}

const out = [];
for (const g of all) {
  const ex = extras.types?.[g.slug] || {};
  const doc = {
    name: g.displayName,
    slug: g.slug,
    rank: g.rank,
    side: ex.side ?? extras.sides?.[g.slug] ?? null,
    faction: ex.faction ?? g.faction,
    kind: g.kind,
    parent: g.parent ? slugify(g.parent) : null,
    components: ex.components ?? null,
    variant: g.variant ?? null,
    era: g.era,
    species: g.species,
    status: g.status,
    traits: ex.traits ?? (g.abilities.some((a) => /Bioluminescence|Luminescence/.test(a.name || '')) ? ['Bioluminescent'] : []),
    court: ex.court ?? null,
    threatClass: ex.threatClass ?? null,
    height: ex.height ?? extras.heights?.[g.slug] ?? null,
    stats: g.stats,
    abilities: g.abilities,
    extraBlocks: g.extraBlocks.length ? g.extraBlocks : undefined,
    role: g.role,
    interactions: g.interactions || null,
    notes: g.notes.length ? g.notes : undefined,
    description: ex.description ?? null,
    image: ex.image ?? null,
    gemstone: fs.existsSync(path.join(ROOT, 'public/images/gemstones', g.slug + '.svg')) ? `/images/gemstones/${g.slug}.svg` : null,
    credit: ex.credit ?? null,
    modifiers: g.modifiers ?? undefined,
    descendedFrom: ex.descendedFrom ?? undefined,
    shiftOf: g.faction === 'united-frontier' && g.quartzGroup && g.displayName !== 'Clear Quartz' ? 'clear-quartz' : undefined,
    attachments: ex.attachments ?? undefined,
    updated: new Date().toISOString().slice(0, 10),
  };
  if (g.geode) doc.status = [...doc.status, 'Geode'];
  if (ex.discontinued && !doc.status.includes('Discontinued')) doc.status = [...doc.status, 'Discontinued'];
  if (doc.status.includes('Discontinued') && !ex.faction) doc.faction = 'lost';
  if (g.unparsed) console.warn('Unparsed lines in', g.slug, g.unparsed);
  if (g.unknownTags) console.warn('Unknown tags in', g.slug, g.unknownTags);
  for (const k of Object.keys(doc)) if (doc[k] === undefined) delete doc[k];
  fs.writeFileSync(path.join(OUT, g.slug + '.yml'), yaml.dump(doc, { lineWidth: 120, noRefs: true }));
  out.push(doc);
}
console.log(`Wrote ${out.length} Gem-Types to src/data/gem-types`);
