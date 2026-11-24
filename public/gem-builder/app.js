// Submission Builder. The database is built from the wiki's own data (src/lib/builder-data.ts).
const database = window.GEM_DATABASE;
if (!database) throw new Error('Gem database did not load before the application.');

const S = ['HP', 'ATK', 'DEF', 'SPD', 'INT', 'MAG'];
const stat = (hp = 0, atk = 0, def = 0, spd = 0, int = 0, mag = 0) => ({ HP: hp, ATK: atk, DEF: def, SPD: spd, INT: int, MAG: mag });
const zero = stat();
const gems = database.gems;
const quartz = database.quartzShifts;
const modifiers = [{ name: 'No modifier', stats: zero, abilityDetails: [] }, ...database.modifiers];
const cuts = database.cuts;
const factions = [...new Set(gems.map(record => record.faction))];
const abilityDatabase = [...gems, ...quartz].flatMap(record => {
  const details = record.abilityDetails || [];
  if (!details.length) return (record.abilities || []).map(name => ({ name, gem: record.name, rank: record.rank || record.faction, description: '' }));
  return details.flatMap(detail => (detail.names?.length ? detail.names : [detail.name]).filter(Boolean).map(name => ({
    name,
    gem: record.name,
    rank: record.rank || record.faction,
    description: detail.description || ''
  })));
});
const fusionAbilityExamples = gems.filter(record => record.fusion).flatMap(record =>
  (record.abilityDetails || [])
    .filter(detail => detail.type === 'Fusion Ability')
    .map(detail => ({
      fusion: record.name,
      components: record.components || [],
      name: detail.name,
      category: detail.category || '',
      description: detail.description || ''
    }))
);

function option(value, label = value) { const node = document.createElement('option'); node.value = value; node.textContent = label; return node; }
function choices(el, items, label = x => x, value = x => (typeof x === 'string' ? x : x.name)) { el.replaceChildren(...items.map(x => option(value(x), label(x)))); }
function combine(...sources) { const out = {}; S.forEach(k => out[k] = sources.reduce((sum, source) => sum + (source?.[k] || 0), 0)); return out; }
function detailNames(details = []) { return [...new Set(details.flatMap(detail => detail.names?.length ? detail.names : [detail.name]).filter(Boolean))]; }
function recordAbilities(record) { return record.abilities?.length ? record.abilities : detailNames(record.abilityDetails); }
function levelGrowth(level, classification = 'Gem') {
  const rules = database.rules.levelGrowth;
  const gained = Math.max(0, level - 1);
  const defGains = Math.floor(gained / rules.defEveryLevels);
  return stat(
    gained * rules.hpPerLevel + defGains * rules.hpPerDefGain,
    Math.floor(gained / rules.atkEveryLevels),
    defGains,
    Math.floor(gained / rules.spdEveryLevels),
    rules.intEveryLevels ? Math.floor(gained / rules.intEveryLevels) : 0,
    Math.floor(gained / rules.magEveryLevels) * (classification === 'Organic' ? rules.organicMagPerGain : rules.gemMagPerGain)
  );
}
function totalExpForLevel(level) {
  const { firstLevel, firstThreshold, increasePerLevel } = database.rules.experience;
  let total = 0;
  for (let current = firstLevel; current <= level; current += 1) total += firstThreshold + (current - firstLevel) * increasePerLevel;
  return total;
}
function expToNextLevel(level) {
  if (level >= database.rules.levelCap) return null;
  const { firstThreshold, increasePerLevel } = database.rules.experience;
  return firstThreshold + (level - 1) * increasePerLevel;
}
function fusionAbilityOptions(record) {
  const details = (record.abilityDetails || []).filter(detail => ['Signature Ability', 'Fusion Ability'].includes(detail.type));
  const abilities = details.flatMap(detail =>
    (detail.names?.length ? detail.names : [detail.name]).filter(Boolean).map(name => ({
      name,
      category: detail.category || ''
    }))
  );
  return abilities.length ? abilities : recordAbilities(record).map(name => ({ name, category: '' }));
}
function fusionExampleScore(first, second, firstAbility, secondAbility, example) {
  const exactComponents = example.components.includes(first.name) && example.components.includes(second.name);
  const exampleSources = example.components.map(name => gems.find(record => record.name === name && !record.fusion));
  const sourceCategories = exampleSources.map(source => new Set(
    source ? fusionAbilityOptions(source).map(ability => ability.category).filter(Boolean) : []
  ));
  let score = exactComponents ? 20 : 0;
  for (const [left, right] of [[0, 1], [1, 0]]) {
    let orientationScore = 0;
    if (firstAbility.category && sourceCategories[left].has(firstAbility.category)) orientationScore += 3;
    if (secondAbility.category && sourceCategories[right].has(secondAbility.category)) orientationScore += 3;
    if (firstAbility.category && firstAbility.category === example.category) orientationScore += 1;
    if (secondAbility.category && secondAbility.category === example.category) orientationScore += 1;
    score = Math.max(score, orientationScore);
  }
  if (firstAbility.category && firstAbility.category === secondAbility.category) score += 1;
  return score;
}
function generateAbilitySuggestions(first, second) {
  const pairs = [];
  const seen = new Set();
  for (const firstAbility of fusionAbilityOptions(first)) {
    for (const secondAbility of fusionAbilityOptions(second)) {
      const key = `${firstAbility.name}|${secondAbility.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({ firstAbility, secondAbility });
    }
  }
  if (!pairs.length) return [{
    name: 'No listed component abilities',
    description: 'Add abilities to the selected component profiles to get combination ideas.'
  }];

  return pairs
    .map(pair => {
      const rankedExamples = [...fusionAbilityExamples].map(example => ({
        example,
        score: fusionExampleScore(first, second, pair.firstAbility, pair.secondAbility, example)
      })).sort((a, b) => b.score - a.score);
      const { example, score } = rankedExamples[0] || {};
      const categories = [pair.firstAbility.category, pair.secondAbility.category].filter(Boolean);
      const theme = categories.length ? ` Their ${categories.join(' and ')} themes could guide the effect.` : '';
      const precedent = example
        ? ` A documented precedent is ${example.fusion}'s ${example.name} (${example.components.join(' + ')}): ${example.description}`
        : '';
      return {
        name: `${pair.firstAbility.name} + ${pair.secondAbility.name}`,
        description: `Brainstorm a new fusion-only ability that blends these component abilities.${theme}${precedent}`,
        relevance: score || 0
      };
    })
    .sort((a, b) => b.relevance - a.relevance)
    .map(({ name, description }) => ({ name, description }))
    .slice(0, 3);
}

// Ability Overlap Checker functions
function searchAbilityDatabase(searchTerm) {
  const normalizedSearch = searchTerm.toLowerCase().trim();
  if (!normalizedSearch) return [];
  
  return abilityDatabase.filter(ability => {
    const nameMatch = ability.name.toLowerCase().includes(normalizedSearch);
    const descMatch = ability.description.toLowerCase().includes(normalizedSearch);
    const gemMatch = ability.gem.toLowerCase().includes(normalizedSearch);
    const rankMatch = ability.rank.toLowerCase().includes(normalizedSearch);
    return nameMatch || descMatch || gemMatch || rankMatch;
  });
}

function checkAbilityOverlap() {
  const searchInput = $('ability-search-input');
  const resultsContainer = $('ability-results');
  const searchTerm = searchInput.value;
  
  if (!searchTerm) {
    resultsContainer.innerHTML = '<p class="field-note">Enter an ability name to check for overlaps with existing gems.</p>';
    return;
  }
  
  const matches = searchAbilityDatabase(searchTerm);
  
  const summary = document.createElement('p');
  summary.className = 'field-note';
  summary.textContent = matches.length === 0
    ? `No matches found for "${searchTerm}". This ability appears to be unique.`
    : `Found ${matches.length} potential match(es) for "${searchTerm}":`;
  resultsContainer.replaceChildren(summary);
  if (matches.length > 0) {
    const resultsList = document.createElement('div');
    resultsList.className = 'ability-results-list';
    
    matches.forEach(match => {
      const resultItem = document.createElement('div');
      resultItem.className = 'ability-result-item';
      const name = document.createElement('strong');
      name.textContent = match.name;
      const gem = document.createElement('span');
      gem.className = 'ability-meta';
      gem.textContent = `Gem: ${match.gem}`;
      const rank = document.createElement('span');
      rank.className = 'ability-meta';
      rank.textContent = `Rank: ${match.rank}`;
      const description = document.createElement('p');
      description.className = 'ability-desc';
      description.textContent = match.description;
      resultItem.append(name, gem, rank, description);
      resultsList.appendChild(resultItem);
    });
    
    resultsContainer.appendChild(resultsList);
  }
}

function isMetal(record) { return record.kind === 'Metal' || record.tags?.includes('Metal Society'); }
function modifierApplies(modifier, record) {
  const kindMatches = !modifier.applicableKinds || modifier.applicableKinds.some(kind => kind === 'Metal' ? isMetal(record) : record.kind === kind);
  const tagMatches = !modifier.applicableTags || modifier.applicableTags.every(tag => record.tags?.includes(tag));
  return kindMatches && tagMatches;
}
// Diamond mapping for Facet codes
const diamondCodes = {
  'Alpha Black Diamond': '0',
  'Omega White Diamond': '0B',
  'Theta Gold Diamond': '1',
  'Metal-Society': '01',
  'Epsilon Blue Diamond': '2',
  'Nightshade Violet Diamond': '3',
  'Maroon Red Diamond': '4',
  'Bi-Colored Kandy Diamond': '5',
  'Saturn Light Diamond': '6'
};

function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    if (!button) return;
    const before = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = before; }, 1400);
  }).catch(err => console.error('Failed to copy: ', err));
}

// Character Sheet Validator functions
const escapeHtml = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TEMPLATE_FIELDS = ['Name', 'Facet & Cut', 'Era', 'Pronouns', 'Affiliation', 'Personality', 'Gem Type', 'Gem Placement', 'Place of Birth', 'Powers & Abilities', 'HP', 'ATK', 'DEF', 'SPD', 'INT', 'MAG', 'LVL', 'Natural Height', 'Appearance'];
const norm = text => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function readSheet(text) {
  const fields = {};
  text.split('\n').forEach(raw => {
    const line = raw.replace(/[_`*>]/g, '').replace(/^\s*[-•]\s*/, '').trim();
    const m = line.match(/^([A-Za-z &()/,?-]+?)\s*:\s*(.*)$/);
    if (!m) return;
    let key = m[1].trim();
    if (/^appearance/i.test(key)) key = 'Appearance';
    if (/^attraction/i.test(key)) key = 'Attraction';
    if (!(key in fields)) fields[key] = m[2].trim();
  });
  return fields;
}
function field(fields, name) {
  const want = norm(name);
  const key = Object.keys(fields).find(k => norm(k) === want);
  return key === undefined ? undefined : fields[key];
}
function findGemType(value) {
  if (!value) return null;
  const v = norm(value);
  const all = [...gems, ...quartz];
  const exact = all.filter(g => norm(g.name) === v);
  if (exact.length) return exact[0];
  const partial = all.filter(g => v.includes(norm(g.name))).sort((a, b) => b.name.length - a.name.length);
  return partial[0] || null;
}
function findEra(value) {
  if (!value) return null;
  const v = norm(value);
  return database.modifiers.filter(m => v.includes(norm(m.name)) || norm(m.name).includes(v)).sort((a, b) => b.name.length - a.name.length)[0] || null;
}
const firstNumber = value => { const m = String(value || '').match(/-?\d+/); return m ? Number(m[0]) : null; };

function validateCharacterSheet(text) {
  const issues = [], warnings = [], notes = [];
  const fields = readSheet(text);
  const gemValue = field(fields, 'Gem Type');
  const record = findGemType(gemValue);
  const uf = record && record.faction === 'United Frontier' || /united frontier/i.test(field(fields, 'Affiliation') || '');
  const noFacet = uf || /cubic zirconia/i.test(gemValue || '');

  TEMPLATE_FIELDS.forEach(name => {
    if (name === 'Facet & Cut' && noFacet) return;
    const value = field(fields, name);
    if (value === undefined) issues.push(`Missing the ${name} field.`);
    else if (!value) issues.push(`${name} is empty.`);
  });

  if (gemValue && !record) warnings.push(`"${gemValue}" doesn't match any Gem-Type on the wiki. Check the spelling, or make sure the Gem-Type has been approved.`);
  if (record) notes.push(`Gem-Type: ${record.name}${record.rank ? ` (Rank ${record.rank})` : ''}.`);

  const era = findEra(field(fields, 'Era'));
  if (field(fields, 'Era') && !era && !/none|standard/i.test(field(fields, 'Era'))) warnings.push(`The Era "${field(fields, 'Era')}" doesn't match an Era or modifier on the wiki.`);

  const level = firstNumber(field(fields, 'LVL')) || 1;
  if (level > 1) notes.push(`This sheet is level ${level}. New Gems start at level 1, so this only makes sense for a Gem that has trained or fought.`);

  const sheetStats = {};
  S.forEach(k => { sheetStats[k] = firstNumber(field(fields, k)); });
  S.forEach(k => { if (sheetStats[k] !== null && sheetStats[k] < 0) issues.push(`${k} is below 0.`); });

  if (record && !record.fusion) {
    const base = record.statModifier ? combine((gems.find(g => g.name === 'Clear Quartz' && g.faction === 'United Frontier') || {}).stats, record.statModifier) : record.stats;
    if (base) {
      const expected = combine(base, era ? era.stats : zero, levelGrowth(level, record.classification));
      const off = S.filter(k => sheetStats[k] !== null && sheetStats[k] !== expected[k]);
      if (off.length) warnings.push(`These stats don't match ${record.name}${era ? ` with ${era.name}` : ''} at level ${level}: ${off.map(k => `${k} is ${sheetStats[k]}, expected ${expected[k]}`).join('; ')}. Items, cut quality or a Prism shift can explain a difference, so check those before changing anything.`);
      else if (S.every(k => sheetStats[k] !== null)) notes.push(`Stats match ${record.name}${era ? ` with ${era.name}` : ''} at level ${level}.`);
    }
  }

  if (record && record.height) {
    const h = field(fields, 'Natural Height');
    if (h && norm(h) !== norm(record.height) && !/depends/i.test(record.height)) warnings.push(`Natural Height is "${h}". ${record.name}s stand ${record.height}.`);
  }

  const facet = field(fields, 'Facet & Cut');
  if (facet && !noFacet) {
    const m = facet.replace(/\s+/g, '').match(/^(0B|01|[0-6])([A-Z])(\d{1,2})([A-Z])[-–](\d+)X([A-Z])$/i);
    if (!m) warnings.push(`The Facet & Cut "${facet}" doesn't look like the usual shape, for example 4M2O - 11XX.`);
    else {
      const atkAfterEra = record && record.stats ? combine(record.stats, era ? era.stats : zero).ATK : null;
      if (atkAfterEra !== null && Number(m[5]) !== atkAfterEra) warnings.push(`The Cut starts with ${m[5]}, but ATK after the Era should be ${atkAfterEra}. Level growth doesn't count toward it.`);
      if (record && record.rank && m[3][0] !== record.rank[0]) warnings.push(`The Facet's rank number is ${m[3]}, but ${record.name} is Rank ${record.rank}.`);
    }
  }
  if (facet && noFacet) warnings.push('United Frontier Gems and Cubic Zirconias don’t have a Facet & Cut.');

  return { issues, warnings, notes };
}

function runValidation() {
  const sheetInput = $('character-sheet-input').value;
  const resultsContainer = $('validation-results');
  if (!sheetInput.trim()) {
    resultsContainer.innerHTML = '<p class="field-note">Paste your sheet above and press Check sheet.</p>';
    return;
  }
  const { issues, warnings, notes } = validateCharacterSheet(sheetInput);
  const list = (cls, title, items) => items.length ? `<div class="${cls}"><h3>${title}</h3><ul>${items.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul></div>` : '';
  let html = list('validation-issues', 'Missing or wrong', issues) + list('validation-warnings', 'Worth checking', warnings);
  if (!issues.length && !warnings.length) html = `<div class="validation-success"><h3>No problems found</h3><p>Every template field is filled in and nothing stood out. Staff still review everything else.</p></div>`;
  html += list('validation-success', 'What it found', notes);
  resultsContainer.innerHTML = html;
}

// ---------------------------------------------------------------------------
// Submission Builder
// Everything the person picks or types lives in `state`. It is saved to this
// device's localStorage on every change, so a half-built character survives a
// closed tab with no account. Clearing it is always the person's choice.
// ---------------------------------------------------------------------------
const $ = id => document.getElementById(id);
const DRAFT_KEY = 'ia-submission-draft-v1';
const ufClearQuartz = gems.find(g => g.name === 'Clear Quartz' && g.faction === 'United Frontier');
const pickable = gems.filter(g => !g.fusion && (g.stats || g.statModifier));
const fusionTypes = gems.filter(g => g.fusion);

const blankGem = (faction = factions[0]) => ({ faction, slug: '', prism: 'Unshifted', era: 'No modifier', cut: 'Standard', defA: 'HP', defB: 'ATK', level: 1 });
const blankState = () => ({
  v: 1, mode: 'single',
  single: blankGem(), a: blankGem(), b: blankGem(),
  facet: { diamond: '', kg: '', fl: '', cl: '' },
  fusionFacet: '', fusionType: '', fusionAbilityName: '', fusionAbilityDesc: '', dropped: [],
  fields: {}, updated: 0
});
let state = blankState();
let storageWorks = true;

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || saved.v !== 1) return false;
    const base = blankState();
    state = { ...base, ...saved, single: { ...base.single, ...saved.single }, a: { ...base.a, ...saved.a }, b: { ...base.b, ...saved.b }, facet: { ...base.facet, ...saved.facet }, fields: { ...saved.fields }, dropped: saved.dropped || [] };
    return true;
  } catch { return false; }
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    state.updated = Date.now();
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); storageWorks = true; }
    catch { storageWorks = false; }
    showDraftStatus();
  }, 250);
}
function showDraftStatus(restored = false) {
  const el = $('draft-status');
  if (!storageWorks) { el.textContent = 'This browser is blocking saving, so copy your submission before you leave the page.'; $('draft-bar').classList.add('warn'); return; }
  $('draft-bar').classList.remove('warn');
  if (!state.updated) { el.textContent = 'Your work saves on this device as you type. No account needed.'; return; }
  const when = new Date(state.updated);
  const time = when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const day = when.toDateString() === new Date().toDateString() ? 'today' : when.toLocaleDateString([], { month: 'short', day: 'numeric' });
  el.textContent = restored
    ? `Welcome back. Your draft from ${day} at ${time} is restored.`
    : `Draft saved on this device ${day} at ${time}.`;
}

// Two clicks to erase, so nobody loses a character by accident.
function armButton(button, label, armedLabel, action) {
  let armed = false, timer = null;
  button.addEventListener('click', () => {
    if (!armed) {
      armed = true; button.textContent = armedLabel; button.classList.add('armed');
      timer = setTimeout(() => { armed = false; button.textContent = label; button.classList.remove('armed'); }, 4000);
      return;
    }
    clearTimeout(timer); armed = false; button.textContent = label; button.classList.remove('armed');
    action();
  });
}
function clearDraft(message) {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
  state = blankState();
  writeInputs(); renderAll();
  $('draft-status').textContent = message;
}

// ----- one Gem -------------------------------------------------------------
function computeGem(cfg) {
  const record = pickable.find(g => g.slug === cfg.slug);
  if (!record) return null;
  const prismActive = record === ufClearQuartz;
  const shift = prismActive && cfg.prism !== 'Unshifted' ? quartz.find(q => q.name === cfg.prism) : null;
  let modifier = modifiers.find(m => m.name === cfg.era) || modifiers[0];
  if (!modifierApplies(modifier, record)) modifier = modifiers[0];
  const metal = isMetal(record);
  let cut = cuts[cfg.cut] ? cfg.cut : 'Standard';
  if (cut === 'Perfect Polish' && !metal) cut = 'Perfect Cut';
  if (cut === 'Perfect Cut' && metal) cut = 'Perfect Polish';
  const defA = S.includes(cfg.defA) ? cfg.defA : 'HP';
  const defB = S.includes(cfg.defB) && cfg.defB !== defA ? cfg.defB : S.find(k => k !== defA);
  const level = Math.min(database.rules.levelCap, Math.max(1, Number.parseInt(cfg.level, 10) || 1));
  const cutData = cuts[cut] || cuts.Standard;
  const defectPenalty = cut === 'Defective' ? { [defA]: -1, [defB]: -1 } : zero;
  const modifierOnly = !record.stats && Boolean(record.statModifier);
  const base = shift ? combine(record.stats, shift.statModifier) : record.stats;
  const growth = levelGrowth(level, record.classification);
  const adjustments = combine(modifier.stats, cutData.stats, growth, shift?.statModifier, defectPenalty);
  const raw = combine(base, modifier.stats, cutData.stats, growth, defectPenalty);
  const final = Object.fromEntries(S.map(k => [k, Math.max(0, raw[k])]));

  const details = shift?.abilityDetails || record.abilityDetails || [];
  const signature = detailNames(details.filter(d => d.type === 'Signature Ability'));
  const latent = new Set(detailNames(details.filter(d => d.type === 'Latent Ability')));
  let own = shift ? recordAbilities(shift).filter(a => a !== 'Prism') : recordAbilities(record);
  if (cut === 'Defective') own = [...own.filter(a => !signature.includes(a)), 'Twisted signature ability (staff-selected)'];
  else if (cut.startsWith('Perfect')) own = own.map(a => signature.includes(a) ? `Enhanced signature: ${a}` : a);
  const cutAbilities = cut.startsWith('Perfect') || cut === 'Defective' ? [] : detailNames(cutData.abilityDetails);
  const abilities = [...own, ...detailNames(modifier.abilityDetails), ...cutAbilities];

  const eraTag = (record.tags || []).find(t => /^Era /.test(t)) || '';
  const notes = [];
  if (modifier.unique) notes.push(`${modifier.name} is a unique modifier. Only use it if staff have approved it for your character.`);
  if (cut.startsWith('Perfect')) notes.push(`${cut} changes her stats and makes her signature ability stronger.`);
  if (cut === 'Defective') notes.push(`Defective takes 1 from ${defA} and ${defB}. Staff pick her twisted signature ability.`);
  if (shift) notes.push(`${shift.name} is a Prism shift, so its changes are added to Clear Quartz's base stats.`);
  if (modifierOnly) notes.push('This Gem-Type only lists stat changes, not full base stats, so ask staff for her final numbers.');
  return {
    cfg, record, shift, modifier, cut, defA, defB, level, prismActive, metal, modifierOnly,
    name: shift ? shift.name : record.name,
    page: shift || record,
    final, adjustments, abilities,
    sheetAbilities: abilities.filter(a => !latent.has(a)),
    rank: record.rank || (record.faction === 'United Frontier' ? 'United Frontier' : ''),
    height: record.height && !/depends/i.test(record.height) ? record.height : '',
    heightNote: record.height && /depends/i.test(record.height) ? record.height : '',
    era: modifier.name === 'No modifier' ? eraTag : modifier.name,
    atkAfterEra: base ? combine(base, modifier.stats).ATK : null,
    noFacet: record.faction === 'United Frontier' || /cubic zirconia/i.test(record.name),
    notes
  };
}

// ----- the pickers ---------------------------------------------------------
const pickers = {};
function makePicker(key, root) {
  const id = name => `${key}-${name}`;
  root.innerHTML = `
    <div class="pf"><label for="${id('faction')}">Faction</label><select id="${id('faction')}" data-f="faction"></select></div>
    <div class="pf"><label for="${id('gem')}">Gem-Type</label><select id="${id('gem')}" data-f="slug"></select></div>
    <div class="pf" data-show="prism"><label for="${id('prism')}">Prism shift</label><select id="${id('prism')}" data-f="prism"></select></div>
    <div class="pf"><label for="${id('era')}">Era or modifier</label><select id="${id('era')}" data-f="era"></select></div>
    <div class="pf"><label for="${id('cut')}">Cut quality</label><select id="${id('cut')}" data-f="cut"></select></div>
    <div class="pf" data-show="defect"><label for="${id('defA')}">First defective stat</label><select id="${id('defA')}" data-f="defA"></select></div>
    <div class="pf" data-show="defect"><label for="${id('defB')}">Second defective stat</label><select id="${id('defB')}" data-f="defB"></select></div>
    <div class="pf"><label for="${id('level')}">Level</label><input id="${id('level')}" data-f="level" type="number" min="1" max="${database.rules.levelCap}" inputmode="numeric" /></div>`;
  const el = name => root.querySelector(`[data-f="${name}"]`);
  choices(el('faction'), factions);
  choices(el('prism'), ['Unshifted', ...quartz.map(q => q.name)]);
  choices(el('cut'), Object.keys(cuts));
  root.addEventListener('input', event => {
    const f = event.target.dataset.f; if (!f) return;
    const cfg = state[key];
    if (f === 'level') { cfg.level = event.target.value; }
    else cfg[f] = event.target.value;
    if (f === 'faction') cfg.slug = '';
    sync(); renderAll(); save();
  });
  el('level').addEventListener('change', () => { sync(); renderAll(); save(); });
  function sync() {
    const cfg = state[key];
    if (!factions.includes(cfg.faction)) cfg.faction = factions[0];
    el('faction').value = cfg.faction;
    const list = pickable.filter(g => g.faction === cfg.faction).sort((a, b) => a.name.localeCompare(b.name) || (a.rank || '').localeCompare(b.rank || ''));
    const dupes = new Set(list.filter((g, i) => list.findIndex(o => o.name === g.name) !== i).map(g => g.name));
    choices(el('slug'), list, g => dupes.has(g.name) ? `${g.name} (${g.tags.find(t => t.startsWith('Era')) || g.rank || g.slug})` : g.name, g => g.slug);
    if (!list.some(g => g.slug === cfg.slug)) cfg.slug = list[0]?.slug || '';
    el('slug').value = cfg.slug;
    const record = list.find(g => g.slug === cfg.slug);
    choices(el('era'), modifiers, m => m.name);
    [...el('era').options].forEach(o => { const m = modifiers.find(x => x.name === o.value); o.disabled = record ? !modifierApplies(m, record) : false; });
    const done = computeGem(cfg);
    if (done) { cfg.era = done.modifier.name; cfg.cut = done.cut; cfg.defA = done.defA; cfg.defB = done.defB; }
    el('era').value = cfg.era;
    el('cut').value = cfg.cut;
    el('prism').value = cfg.prism;
    choices(el('defA'), S); el('defA').value = cfg.defA;
    choices(el('defB'), S.filter(k => k !== cfg.defA)); el('defB').value = cfg.defB;
    if (document.activeElement !== el('level')) el('level').value = done ? done.level : 1;
    root.querySelector('[data-show="prism"]').hidden = !done?.prismActive;
    root.querySelectorAll('[data-show="defect"]').forEach(n => { n.hidden = cfg.cut !== 'Defective'; });
    el('level').closest('.pf').hidden = key !== 'single';
  }
  pickers[key] = { sync };
}

// ----- small DOM helpers ---------------------------------------------------
function h(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') node.className = v; else if (k === 'text') node.textContent = v; else node.setAttribute(k, v);
  }
  node.append(...kids.flat().filter(k => k !== null && k !== undefined && k !== false));
  return node;
}
const signed = n => (n > 0 ? `+${n}` : `${n}`);
function statTiles(target, values, noteFor) {
  target.replaceChildren(...S.map(k => h('div', { class: 'stat' }, h('span', { text: k }), h('strong', { text: values[k] }), h('div', { class: 'change', text: noteFor(k) }))));
}
function metaCards(target, cards) {
  target.replaceChildren(...cards.map(([label, value]) => h('div', { class: 'meta-card' }, h('span', { text: label }), h('strong', { text: value || 'Not set' }))));
}

// ----- render: single ------------------------------------------------------
function renderSingle(g) {
  const card = $('card-s');
  if (!g) { card.replaceChildren(h('p', { class: 'field-note', text: 'Pick a Gem-Type to see her stats.' })); $('notice-s').textContent = ''; return; }
  const head = h('div', { class: 'gem-card-head' },
    g.page.gemstone ? h('img', { src: g.page.gemstone, alt: '', class: 'stone' }) : null,
    h('div', {}, h('h3', { class: 'gem-name', text: g.name }),
      h('div', { class: 'badges' }, [g.record.faction, ...(g.record.tags || []), g.cut !== 'Standard' ? g.cut : ''].filter(Boolean).map(t => h('span', { text: t })))),
    g.page.href ? h('a', { class: 'btn', href: g.page.href, text: 'Gem-Type page' }) : null);
  const profile = h('div', { class: 'profile' });
  const next = expToNextLevel(g.level);
  metaCards(profile, [['Rank', g.rank.replace(/\//g, ' / ')], ['Height', g.height || g.heightNote], ['Level', `${g.level} / ${database.rules.levelCap}`], ['EXP to next level', next === null ? 'Level cap reached' : next.toLocaleString()]]);
  const stats = h('div', { class: 'stats' });
  if (g.modifierOnly) statTiles(stats, Object.fromEntries(S.map(k => [k, signed(g.record.statModifier?.[k] || 0)])), () => 'Change only');
  else statTiles(stats, g.final, k => g.adjustments[k] ? `${signed(g.adjustments[k])} from Era, cut and level` : 'Base value');
  const abil = h('div', { class: 'abilities' }, h('h3', { text: 'Abilities' }), h('ul', {}, g.abilities.map(a => h('li', { text: a }))));
  card.replaceChildren(head, profile, stats, abil);
  $('notice-s').textContent = [...g.notes, 'Level gains follow the level-up rules on the Stats page.'].join(' ');
}

// ----- render: fusion ------------------------------------------------------
const inches = text => { const m = String(text || '').match(/(\d+)\s*'\s*(\d+)?/); return m ? Number(m[1]) * 12 + Number(m[2] || 0) : null; };
const feet = total => `${Math.floor(total / 12)}'${total % 12}"`;
function nameMatches(component, g) {
  const c = norm(component);
  const names = [g.name, g.record.name, g.record === ufClearQuartz || /quartz/i.test(g.name) ? 'Quartz' : ''].filter(Boolean).map(norm);
  if (names.includes(c)) return 2;
  return names.some(n => n.split(' ').includes(c) || (c.includes(' ') && n.includes(c))) ? 1 : 0;
}
function fusionMatches(A, B) {
  return fusionTypes.map(t => {
    const [c1, c2] = t.components || [];
    if (!c1 || !c2) return null;
    const score = Math.max(
      nameMatches(c1, A) && nameMatches(c2, B) ? nameMatches(c1, A) + nameMatches(c2, B) : 0,
      nameMatches(c1, B) && nameMatches(c2, A) ? nameMatches(c1, B) + nameMatches(c2, A) : 0);
    return score ? { t, score } : null;
  }).filter(Boolean).sort((x, y) => y.score - x.score).map(x => x.t);
}
const abilityKey = (half, name) => `${half}:${name}`;
function computeFusion() {
  // A fusion starts at LVL 1 and doesn't inherit her halves' level gains.
  const A = computeGem({ ...state.a, level: 1 }), B = computeGem({ ...state.b, level: 1 });
  if (!A || !B) return null;
  const matches = fusionMatches(A, B);
  const typed = state.fusionType.trim();
  const chosen = matches.find(t => norm(t.name) === norm(typed)) || (!typed ? matches[0] : null);
  const name = typed || chosen?.name || '';
  const sum = inches(A.height) !== null && inches(B.height) !== null ? feet(inches(A.height) + inches(B.height)) : '';
  const height = chosen?.height || sum;
  const stats = combine(A.final, B.final);
  const halves = [['a', A], ['b', B]];
  const kept = halves.flatMap(([half, g]) => g.sheetAbilities.filter(n => !state.dropped.includes(abilityKey(half, n))));
  const fusionAbility = state.fusionAbilityName.trim();
  const abilities = [...new Set(kept), fusionAbility ? `${fusionAbility} (Fusion Ability)` : ''].filter(Boolean);
  const metalClash = A.metal !== B.metal;
  const eras = [...new Set([A.era, B.era].filter(Boolean))];
  return { A, B, matches, chosen, name, height, sumHeight: sum, stats, abilities, metalClash, eras, noFacet: A.noFacet && B.noFacet };
}
function halfSummary(target, g) {
  if (!g) { target.replaceChildren(); return; }
  target.replaceChildren(
    h('div', { class: 'half-name' }, g.page.gemstone ? h('img', { src: g.page.gemstone, alt: '' }) : null, h('strong', { text: g.name }), h('span', { text: g.height ? ` · ${g.height}` : '' })),
    h('div', { class: 'mini-stats' }, S.map(k => h('span', {}, h('em', { text: k }), ` ${g.final[k]}`))));
}
function renderFusion(F) {
  halfSummary($('sum-a'), F?.A); halfSummary($('sum-b'), F?.B);
  if (!F) return;
  const typeInput = $('fusion-type');
  typeInput.placeholder = F.matches[0]?.name || `Name her Gem-Type, e.g. ${F.A.name}-${F.B.name} fusion`;
  $('fusion-matches').replaceChildren(...(F.matches.length
    ? [h('span', { class: 'field-note', text: 'Fusion Gem-Types on the wiki for this pair:' }), ...F.matches.map(t => {
        const b = h('button', { type: 'button', class: `chip${F.chosen === t ? ' on' : ''}`, text: `${t.name} (${t.components.join(' + ')})` });
        b.addEventListener('click', () => { state.fusionType = t.name; typeInput.value = t.name; renderAll(); save(); });
        return b;
      })]
    : [h('span', { class: 'field-note', text: 'No fusion Gem-Type on the wiki matches this pair yet. Type the one you are submitting.' })]));
  metaCards($('fusion-profile'), [['Gem-Type', F.name], ['Height', F.height], ['Era', F.eras.join(' / ')], ['Halves', `${F.A.name} + ${F.B.name}`]]);
  statTiles($('fusion-stats'), F.stats, k => `${F.A.final[k]} + ${F.B.final[k]}`);
  $('fusion-ability-picks').replaceChildren(...[['a', F.A], ['b', F.B]].map(([half, g]) => h('article', {},
    h('h3', { text: `From ${g.name}` }),
    g.sheetAbilities.length ? h('div', { class: 'ability-ticks' }, g.sheetAbilities.map(n => {
      const box = h('input', { type: 'checkbox' });
      box.checked = !state.dropped.includes(abilityKey(half, n));
      box.addEventListener('change', () => {
        const k = abilityKey(half, n);
        state.dropped = box.checked ? state.dropped.filter(x => x !== k) : [...new Set([...state.dropped, k])];
        renderAll(); save();
      });
      return h('label', { class: 'tick' }, box, h('span', { text: n }));
    })) : h('p', { class: 'field-note', text: 'No listed abilities.' }))));
  const notes = [];
  if (F.metalClash) notes.push('A Gem and a Metal can never fuse. Metals can only fuse with other Metals.');
  if (F.chosen && F.chosen.height && F.sumHeight && F.chosen.height !== F.sumHeight) notes.push(`${F.chosen.name}'s Gem-Type page lists her at ${F.chosen.height}, so that is used instead of the halves added together (${F.sumHeight}).`);
  if (!F.height) notes.push('One half has no set height, so type her Natural Height yourself in Step 3.');
  notes.push('Her stats are both halves added together, including each half\'s Era and cut. A fusion always starts at LVL 1, so her halves\' levels don\'t count. A fusion that is played again needs her own sheet, and a permanent fusion needs staff approval.');
  $('notice-f').textContent = notes.join(' ');
  $('notice-f').classList.toggle('bad', F.metalClash);
  $('fusion-suggestions').replaceChildren(...fusionIdeasFor(F.A, F.B).map(s => h('article', { class: `suggestion-card${s.tag === 'For this pair' ? ' pair' : ''}` },
    h('span', { class: 'idea-tag', text: s.tag }), h('h4', { text: s.name }), h('p', { text: s.description }))));
  $('ideas').open = $('ideas').open || fusionIdeasFor(F.A, F.B)[0]?.tag === 'For this pair';
}

// Written ideas from src/data/fusion-ideas.yml come first: this exact pair, then other pairs
// that share one of her halves. The old generated ideas fill in after them.
const fusionIdeas = database.fusionIdeas || [];
function fusionIdeasFor(A, B) {
  const has = (idea, g) => idea.halves.some(n => nameMatches(n, g));
  const pairOf = idea => idea.halves.join(' + ');
  const exact = fusionIdeas.filter(i => i.halves.length === 2 && ((nameMatches(i.halves[0], A) && nameMatches(i.halves[1], B)) || (nameMatches(i.halves[0], B) && nameMatches(i.halves[1], A))));
  const shared = fusionIdeas.filter(i => !exact.includes(i) && (has(i, A) || has(i, B))).slice(0, 2);
  const out = [
    ...exact.map(i => ({ tag: 'For this pair', name: i.name, description: i.idea })),
    ...shared.map(i => ({ tag: `From ${pairOf(i)}`, name: i.name, description: i.idea }))
  ];
  const generated = generateAbilitySuggestions(A.page, B.page).map(s => ({ tag: 'Mix and match', ...s }));
  return [...out, ...generated].slice(0, Math.max(3, out.length + 1));
}

// ----- Facet & Cut ---------------------------------------------------------
function facetCode(g) {
  if (!g || g.noFacet) return '';
  const f = state.facet;
  const d = diamondCodes[f.diamond];
  const k = f.kg.trim().charAt(0).toUpperCase();
  const r = (g.rank.match(/^\d/) || [''])[0];
  const fl = f.fl.trim().toUpperCase(), cl = f.cl.trim().toUpperCase();
  if (!d || !k || !r || !fl || !cl || g.atkAfterEra === null) return '';
  return `${d}${k}${r}${fl} - ${g.atkAfterEra}X${cl}`;
}
function renderFacet(g, F) {
  const fusion = state.mode === 'fusion';
  const none = fusion ? !!F?.noFacet : !!g?.noFacet;
  $('facet-single').hidden = fusion || none;
  $('facet-fusion').hidden = !fusion || none;
  $('facet-none').hidden = !none;
  if (fusion || !g) return;
  const r = (g.rank.match(/^\d/) || [''])[0];
  $('facet-auto').textContent = r
    ? `Filled in for you: rank number ${r} from ${g.record.name}'s Rank ${g.rank}, and ${g.atkAfterEra} for her ATK after her Era (level gains don't count).`
    : `${g.record.name} has no Rank on the wiki yet, so ask staff for the rank number.`;
  $('facet-result').textContent = facetCode(g) || '---';
}

// ----- Step 3 fields -------------------------------------------------------
const FIELD_GROUPS = [
  ['Gem Information', [
    { k: 'name', label: 'Name', need: true, ph: 'What does she go by?' },
    { k: 'nicknames', label: 'Nicknames', ph: 'Optional' },
    { k: 'pronouns', label: 'Pronouns', need: true, ph: 'e.g. she/her' },
    { k: 'affiliation', label: 'Affiliation', need: true, ph: 'Who she answers to or works for' }]],
  ['Behavior', [
    { k: 'personality', label: 'Personality', need: true, area: true, ph: 'How does she act, talk and treat others?' },
    { k: 'likes', label: 'Likes' },
    { k: 'dislikes', label: 'Dislikes' },
    { k: 'attraction', label: 'Attraction towards', ph: 'Male Presenting or Female Presenting Gems?' },
    { k: 'relationships', label: 'Relationships', area: true, ph: 'Friends, rivals, family, partners' },
    { k: 'fear', label: 'Fear' },
    { k: 'alignment', label: 'Alignment', ph: 'e.g. Lawful Neutral' }]],
  ['Capabilities', [
    { k: 'placement', label: 'Gem Placement', need: true, ph: 'Where her gem sits, e.g. left palm' },
    { k: 'birthplace', label: 'Place of Birth', need: true, ph: 'e.g. a colony or Kindergarten' },
    { k: 'extraPowers', label: 'Other powers or SKILLs', ph: 'Optional. Added after her Gem-Type abilities' }]],
  ['Equipment', [
    { k: 'weapon1', label: 'Weapon 1', ph: 'Optional' },
    { k: 'weapon2', label: 'Weapon 2', ph: 'Optional' },
    { k: 'armor', label: 'Armor', ph: 'Optional' },
    { k: 'acc1', label: 'Accessory 1', ph: 'Optional' },
    { k: 'acc2', label: 'Accessory 2', ph: 'Optional' }]],
  ['Appearance', [
    { k: 'height', label: 'Natural Height', ph: '' },
    { k: 'appearance', label: 'Appearance', need: true, area: true, ph: 'An image link, a description, or both' }]]
];
function buildFields() {
  $('detail-fields').replaceChildren(...FIELD_GROUPS.map(([title, list]) => h('fieldset', { class: 'fgroup' },
    h('legend', { text: title }),
    h('div', { class: 'fgrid' }, list.map(f => h('div', { class: `pf${f.area ? ' wide' : ''}` },
      h('label', { for: `fld-${f.k}` }, f.label, f.need ? h('span', { class: 'need', title: 'Needed', text: ' •' }) : null),
      h(f.area ? 'textarea' : 'input', { id: `fld-${f.k}`, 'data-save': `fields.${f.k}`, placeholder: f.ph || '', autocomplete: 'off', ...(f.area ? { rows: 4 } : { type: 'text' }) })))))));
}

// Inputs with data-save="a.b" read and write that path in state.
function getPath(path) { return path.split('.').reduce((o, k) => o?.[k], state); }
function setPath(path, value) { const keys = path.split('.'); const last = keys.pop(); const obj = keys.reduce((o, k) => (o[k] ??= {}), state); obj[last] = value; }
function writeInputs() {
  document.querySelectorAll('[data-save]').forEach(el => { el.value = getPath(el.dataset.save) ?? ''; });
}
document.addEventListener('input', event => {
  const path = event.target.dataset?.save; if (!path) return;
  setPath(path, event.target.value);
  renderAll(); save();
});

// ----- the submission ------------------------------------------------------
function buildSheet() {
  const fusion = state.mode === 'fusion';
  const g = fusion ? null : computeGem(state.single);
  const F = fusion ? computeFusion() : null;
  const v = k => (state.fields[k] || '').trim();
  let gemType = '', era = '', facet = '', powers = [], stats = null, lvl = 1, autoHeight = '', noFacet = false;
  if (g) {
    gemType = `${g.name}${g.cut !== 'Standard' ? ` (${g.cut})` : ''}`;
    era = g.era; facet = facetCode(g); noFacet = g.noFacet;
    powers = g.sheetAbilities; stats = g.modifierOnly ? null : g.final; lvl = g.level; autoHeight = g.height;
  }
  if (F) {
    gemType = F.name ? `${F.name} (Fusion of ${F.A.name} + ${F.B.name})` : '';
    era = F.eras.join(' / '); facet = state.fusionFacet.trim(); noFacet = F.noFacet;
    powers = F.abilities; stats = F.stats; autoHeight = F.height;
  }
  if (v('extraPowers')) powers = [...powers, v('extraPowers')];
  const height = v('height') || autoHeight;
  const st = k => (stats ? stats[k] : '');
  const line = (label, value = '') => `- _\`${label}:\`_ ${value}`.trimEnd();
  const sub = (label, value = '') => `  - _\`${label}:\`_ ${value}`.trimEnd();
  const text = [
    '## Gem Information', line('Name', v('name')), line('Facet & Cut', noFacet ? '' : facet), line('Era', era), line('Nicknames', v('nicknames')), line('Pronouns', v('pronouns')), line('Affiliation', v('affiliation')),
    '## Behavior', line('Personality', v('personality')), line('Likes', v('likes')), line('Dislikes', v('dislikes')), line('Attraction towards(Male Presenting or Female Presenting Gems?)', v('attraction')), line('Relationships', v('relationships')), line('Fear', v('fear')), line('Alignment', v('alignment')),
    '## Capabilities', line('Gem Type', gemType), line('Gem Placement', v('placement')), line('Place of Birth', v('birthplace')), line('Powers & Abilities', powers.join(', ')),
    '## Stats', line('HP', st('HP')), line('ATK', st('ATK')), sub('Weapon 1 (Optional)', v('weapon1')), sub('Weapon 2 (Optional)', v('weapon2')), line('DEF', st('DEF')), sub('Armor (Optional)', v('armor')), sub('Accessories 1 (Optional)', v('acc1')), sub('Accessories 2 (Optional)', v('acc2')),
    line('SPD', st('SPD')), line('INT', st('INT')), line('MAG', st('MAG')), line('LVL', fusion ? 1 : lvl), sub('EXP', 0),
    '## Appearance', line('Natural Height', height), line('Appearance (Image/Description)', v('appearance'))
  ].join('\n');
  const checks = [
    ['Gem-Type', !!gemType],
    ...(fusion ? [['Halves can fuse', !F?.metalClash]] : []),
    ['Facet & Cut', noFacet || !!facet],
    ['Era', !!era],
    ['Stats', !!stats],
    ...FIELD_GROUPS.flatMap(([, list]) => list.filter(f => f.need).map(f => [f.label, !!v(f.k)])),
    ['Natural Height', !!height]
  ];
  return { text, checks, g, F, autoHeight };
}
function renderSubmission(built) {
  const done = built.checks.filter(([, ok]) => ok).length;
  const all = built.checks.length;
  $('progress-count').textContent = `${done} / ${all}`;
  $('progress-bar').style.width = `${Math.round(done / all * 100)}%`;
  $('checklist').replaceChildren(...built.checks.map(([label, ok]) => h('li', { class: ok ? 'ok' : 'todo' }, h('span', { 'aria-hidden': 'true', text: ok ? '✓' : '○' }), ` ${label}`)));
  $('sheet-preview').textContent = built.text;
  const n = built.text.length;
  $('char-count').textContent = n > 2000 ? `${n} characters. Discord's limit is 2000, so post it in two messages.` : `${n} / 2000 characters`;
  $('char-count').classList.toggle('over', n > 2000);
  $('finish-draft').disabled = done < all;
  $('fld-height').placeholder = built.autoHeight ? `${built.autoHeight} (from her Gem-Type)` : 'e.g. 6\'2"';
}

// ----- everything ----------------------------------------------------------
function renderAll() {
  const fusion = state.mode === 'fusion';
  document.querySelectorAll('.mode-toggle button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
  $('single-area').hidden = fusion;
  $('fusion-area').hidden = !fusion;
  const g = fusion ? null : computeGem(state.single);
  const F = fusion ? computeFusion() : null;
  if (fusion) renderFusion(F); else renderSingle(g);
  renderFacet(g, F);
  renderSubmission(buildSheet());
}
document.querySelectorAll('.mode-toggle button').forEach(b => b.addEventListener('click', () => { state.mode = b.dataset.mode; renderAll(); save(); }));

// Gem-Type pages link here with ?type=<slug>. It only changes the Gem-Type, never the rest of a saved draft.
function applyTypeParam() {
  const want = new URLSearchParams(location.search).get('type');
  if (!want) return;
  const shift = quartz.find(q => q.slug === want);
  const record = gems.find(g => g.slug === want);
  if (shift && ufClearQuartz) { state.mode = 'single'; Object.assign(state.single, { faction: ufClearQuartz.faction, slug: ufClearQuartz.slug, prism: shift.name }); }
  else if (record?.fusion) {
    state.mode = 'fusion'; state.fusionType = record.name;
    (record.components || []).slice(0, 2).forEach((c, i) => {
      const half = i ? state.b : state.a;
      const best = pickable.map(g => ({ g, s: nameMatches(c, { name: g.name, record: g }) })).filter(x => x.s).sort((x, y) => y.s - x.s)[0]?.g;
      if (best) Object.assign(half, { faction: best.faction, slug: best.slug });
    });
  } else if (record) { state.mode = 'single'; Object.assign(state.single, { faction: record.faction, slug: record.slug, prism: 'Unshifted' }); }
  history.replaceState(null, '', location.pathname + location.hash);
}

const restored = loadDraft();
applyTypeParam();
buildFields();
['single', 'a', 'b'].forEach(key => makePicker(key, $(key === 'single' ? 'pick-s' : `pick-${key}`)));
// Start the second half on a different Gem-Type so a new fusion isn't one Gem fused with herself.
if (!state.b.slug) { const first = pickable.find(g => g.faction === state.b.faction); const other = pickable.find(g => g.faction === state.b.faction && g !== first); if (other) state.b.slug = other.slug; }
Object.values(pickers).forEach(p => p.sync());
writeInputs();
renderAll();
showDraftStatus(restored && state.updated);

$('copy-sheet').addEventListener('click', e => copyToClipboard(buildSheet().text, e.currentTarget));
armButton($('start-over'), 'Start over', 'Click again to erase', () => clearDraft('Started over. Your old draft is gone.'));
armButton($('finish-draft'), "I've submitted it, clear my draft", 'Click again to clear', () => clearDraft('Draft cleared. Good luck with your submission!'));
document.querySelectorAll('.copy-btn').forEach(btn => btn.addEventListener('click', () => copyToClipboard($(btn.dataset.target).textContent, btn)));
$('ability-search-btn').addEventListener('click', checkAbilityOverlap);
$('ability-search-input').addEventListener('input', checkAbilityOverlap);
$('validate-btn').addEventListener('click', runValidation);
