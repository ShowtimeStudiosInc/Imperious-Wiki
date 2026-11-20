// Ported from the Imperious-Gem-Builder repo. The database is built from the wiki's own data.
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

const $ = id => document.getElementById(id); const factionEl = $('faction'), gemEl = $('gem'), prismEl = $('prism'), eraEl = $('era'), cutEl = $('cut'), defectStatAEl = $('defect-stat-a'), defectStatBEl = $('defect-stat-b'), fusionAEl = $('fusion-a'), fusionBEl = $('fusion-b');
function option(value, label = value) { const node = document.createElement('option'); node.value = value; node.textContent = label; return node; }
function choices(el, items, label = x => x, value = x => (typeof x === 'string' ? x : x.name)) { el.replaceChildren(...items.map(x => option(value(x), label(x)))); }
function activeRecord() { return gems.find(g => g.slug === gemEl.value); }
function rankFor(record) { return record.rank || (record.faction === 'United Frontier' ? 'United Frontier' : 'Not assigned'); }
function heightFor(record) { return record.height || 'Not assigned'; }
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
function refreshGems() {
  const selected = gemEl.value;
  const list = gems.filter(g => g.faction === factionEl.value).sort((a, b) => a.name.localeCompare(b.name) || (a.rank || '').localeCompare(b.rank || ''));
  const dupes = new Set(list.filter((g, i) => list.findIndex(o => o.name === g.name) !== i).map(g => g.name));
  choices(gemEl, list, g => dupes.has(g.name) ? `${g.name} (${g.tags.find(t => t.startsWith('Era')) || g.rank || g.slug})` : g.name, g => g.slug);
  if (list.some(g => g.slug === selected)) gemEl.value = selected;
  refresh();
}
function fusionId(record) { return record.slug || `${record.faction}|${record.name}`; }
function fusionRecords() {
  const clearQuartz = gems.find(record => record.name === 'Clear Quartz' && record.faction === 'United Frontier');
  const quartzTypes = clearQuartz ? quartz.map(shift => ({
    ...shift,
    stats: combine(clearQuartz.stats, shift.statModifier),
    isQuartzSubtype: true
  })) : [];
  return [...gems.filter(record => !record.fusion && record.stats), ...quartzTypes]
    .sort((a, b) => `${a.faction}:${a.name}`.localeCompare(`${b.faction}:${b.name}`));
}
function fusionComponent(el) { return fusionRecords().find(record => fusionId(record) === el.value); }
function populateFusionSelect(el, selected) {
  const records = fusionRecords();
  el.replaceChildren(...records.map(record => option(fusionId(record), `${record.faction}: ${record.name}${record.isQuartzSubtype ? ' (Quartz subtype)' : ''}`)));
  if (records.some(record => fusionId(record) === selected)) el.value = selected;
}
function showFusionAbilities(target, record) {
  const abilities = recordAbilities(record);
  target.replaceChildren(...abilities.map(text => { const item = document.createElement('li'); item.textContent = text; return item; }));
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

function refreshFusion() {
  const first = fusionComponent(fusionAEl);
  const second = fusionComponent(fusionBEl);
  if (!first || !second) return;
  const combined = combine(first.stats, second.stats);
  $('fusion-a-name').textContent = `${first.name} abilities`;
  $('fusion-b-name').textContent = `${second.name} abilities`;
  $('fusion-stats').replaceChildren(...S.map(key => {
    const div = document.createElement('div');
    div.className = 'stat';
    const label = document.createElement('span');
    label.textContent = key;
    const value = document.createElement('strong');
    value.textContent = combined[key];
    const note = document.createElement('div');
    note.className = 'change';
    note.textContent = 'Base stat total';
    div.append(label, value, note);
    return div;
  }));
  showFusionAbilities($('fusion-a-abilities'), first);
  showFusionAbilities($('fusion-b-abilities'), second);
  const suggestionsContainer = $('fusion-suggestions');
  suggestionsContainer.replaceChildren(...generateAbilitySuggestions(first, second).map(suggestion => {
    const article = document.createElement('article');
    article.className = 'suggestion-card';
    const heading = document.createElement('h4');
    heading.textContent = suggestion.name;
    const description = document.createElement('p');
    description.textContent = suggestion.description;
    article.append(heading, description);
    return article;
  }));
}
function initialiseFusionTool() { const first = fusionAEl.value; const second = fusionBEl.value; populateFusionSelect(fusionAEl, first); populateFusionSelect(fusionBEl, second); if (!fusionAEl.value) fusionAEl.selectedIndex = 0; if (!fusionBEl.value) { const firstName = fusionAEl.selectedOptions[0]?.textContent.split(': ').pop(); const other = [...fusionBEl.options].findIndex(o => o.textContent.split(': ').pop() !== firstName); fusionBEl.selectedIndex = Math.max(0, other); } refreshFusion(); }
function isMetal(record) { return record.kind === 'Metal' || record.tags?.includes('Metal Society'); }
function modifierApplies(modifier, record) {
  const kindMatches = !modifier.applicableKinds || modifier.applicableKinds.some(kind => kind === 'Metal' ? isMetal(record) : record.kind === kind);
  const tagMatches = !modifier.applicableTags || modifier.applicableTags.every(tag => record.tags?.includes(tag));
  return kindMatches && tagMatches;
}
function refreshDefectStatOptions() {
  const first = defectStatAEl.value;
  const second = defectStatBEl.value;
  choices(defectStatAEl, S);
  if (S.includes(first)) defectStatAEl.value = first;
  choices(defectStatBEl, S.filter(statName => statName !== defectStatAEl.value));
  if (defectStatBEl.options.length && [...defectStatBEl.options].some(option => option.value === second)) defectStatBEl.value = second;
}
function appendRuleList(container, title, values) {
  const heading = document.createElement('h3');
  heading.textContent = title;
  const list = document.createElement('ul');
  values.forEach(value => {
    const item = document.createElement('li');
    item.textContent = value;
    list.appendChild(item);
  });
  container.append(heading, list);
}
function renderItemsRules() {
  const rules = database.rules.items;
  const root = $('item-rules-content');
  const introduction = document.createElement('p');
  introduction.textContent = rules.description;
  root.appendChild(introduction);
  appendRuleList(root, 'Item types', rules.types.map(type => `${type.name}: ${type.description}`));
  appendRuleList(root, 'Equipment slots', [...rules.equipment.slots, `Switching equipment uses your turn: ${rules.equipment.switchUsesTurn ? 'yes' : 'no'}`, `Unarmed fighting uses ${rules.equipment.unarmedType} with no weapon ATK.`]);

  const fightHeading = document.createElement('h3');
  fightHeading.textContent = 'How a FIGHT rolls';
  root.appendChild(fightHeading);
  appendRuleList(root, 'Roll, damage, and critical rules', Object.values(rules.fight));

  const table = document.createElement('table');
  table.className = 'weapon-rules-table';
  const header = document.createElement('tr');
  ['Weapon type', 'Hits', 'Damage', 'Hit Number', 'Crit Number'].forEach(text => {
    const cell = document.createElement('th');
    cell.textContent = text;
    header.appendChild(cell);
  });
  table.appendChild(header);
  rules.weaponTypes.forEach(weapon => {
    const row = document.createElement('tr');
    [weapon.name, weapon.hits, weapon.damage, weapon.hitNumber, weapon.critNumber].forEach(text => {
      const cell = document.createElement('td');
      cell.textContent = text;
      row.appendChild(cell);
    });
    table.appendChild(row);
  });
  root.appendChild(table);
  appendRuleList(root, 'Weapon types', rules.weaponTypes.map(weapon => `${weapon.name}: ${weapon.description}`));
  appendRuleList(root, 'Shields and Defend', [
    rules.defend,
    `Shield: ${rules.shield.hits} hit; ${rules.shield.damage}; Hit Number ${rules.shield.hitNumber}; ${rules.shield.critNumber}`,
    rules.shield.defend,
    rules.shield.stale
  ]);
  appendRuleList(root, 'Armor, weight, and extra effects', [
    rules.armor,
    rules.weight,
    rules.weaponAttack,
    rules.extraEffects
  ]);
  appendRuleList(root, 'Consumables', rules.consumables);
  Object.entries(rules.templates).forEach(([name, fields]) => {
    appendRuleList(root, `${name} template`, Array.isArray(fields) ? fields : [fields]);
  });
}
function refresh() {
  const record = activeRecord(); if (!record) return;
  const prismActive = record.name === 'Clear Quartz' && record.faction === 'United Frontier'; $('prism-step').classList.toggle('hidden', !prismActive);
  const modifier = modifiers.find(m => m.name === eraEl.value) || modifiers[0];
  if (!modifierApplies(modifier, record)) eraEl.value = modifiers[0].name;
  [...eraEl.options].forEach(option => {
    const optionModifier = modifiers.find(item => item.name === option.value);
    option.disabled = optionModifier ? !modifierApplies(optionModifier, record) : false;
  });
  const currentModifier = modifiers.find(m => m.name === eraEl.value) || modifiers[0];
  const rank = rankFor(record);
  const shift = prismActive && prismEl.value !== 'Unshifted' ? quartz.find(q => q.name === prismEl.value) : null;
  const base = shift ? combine(record.stats, shift.statModifier) : record.stats;
  const polishAllowed = isMetal(record);
  const cutAllowed = !polishAllowed;
  if (cutEl.value === 'Perfect Polish' && !polishAllowed) cutEl.value = 'Perfect Cut'; if (cutEl.value === 'Perfect Cut' && !cutAllowed) cutEl.value = 'Perfect Polish';
  refreshDefectStatOptions();
  $('defect-stats-step').classList.toggle('hidden', cutEl.value !== 'Defective');
  const level = Math.min(database.rules.levelCap, Math.max(1, Number.parseInt($('level').value, 10) || 1)); $('level').value = level;
  const cutData = cuts[cutEl.value] || cuts.Standard;
  const defectPenalty = cutEl.value === 'Defective' ? {
    [defectStatAEl.value]: -1,
    [defectStatBEl.value]: -1
  } : zero;
  const modifierOnlyProfile = !record.stats && Boolean(record.statModifier);
  const growth = levelGrowth(level, record.classification);
  const adjustments = combine(currentModifier.stats, cutData.stats, growth, shift?.statModifier, defectPenalty);
  const final = combine(base, currentModifier.stats, cutData.stats, growth, defectPenalty);
  const displayDetails = shift?.abilityDetails || record.abilityDetails || [];
  const allAbilityNames = shift ? recordAbilities(shift) : recordAbilities(record);
  const signatureNames = detailNames(displayDetails.filter(detail => detail.type === 'Signature Ability'));
  let baseAbilities = allAbilityNames;
  if (shift) baseAbilities = allAbilityNames.filter(ability => ability !== 'Prism');
  if (cutEl.value === 'Defective') {
    baseAbilities = baseAbilities.filter(ability => !signatureNames.includes(ability));
    baseAbilities.push('Twisted signature ability (staff-selected)');
  } else if (cutEl.value.startsWith('Perfect')) {
    baseAbilities = baseAbilities.map(ability => signatureNames.includes(ability) ? `Enhanced signature: ${ability}` : ability);
  }
  const cutAbilities = cutEl.value.startsWith('Perfect') || cutEl.value === 'Defective' ? [] : detailNames(cutData.abilityDetails);
  const abilityList = [...baseAbilities, ...detailNames(currentModifier.abilityDetails), ...cutAbilities];
  $('result-name').textContent = shift ? shift.name : record.name;
  const page = shift || record; const link = $('result-link'); if (link) { link.href = page.href || '#'; link.hidden = !page.href; }
  const stone = $('result-stone'); if (stone) { stone.src = page.gemstone || ''; stone.hidden = !page.gemstone; }
  $('rank').textContent = rank.replace(/\//g, ' / ');
  $('rank-label').textContent = 'Rank';
  $('height').textContent = heightFor(record);
  $('result-level').textContent = `${level} / ${database.rules.levelCap}`;
  $('next-exp').textContent = expToNextLevel(level) === null ? 'Level cap reached' : expToNextLevel(level).toLocaleString();
  $('total-exp').textContent = totalExpForLevel(level).toLocaleString();
  $('badges').replaceChildren(...[record.faction, ...(record.tags || []), currentModifier.unique ? 'Unique modifier' : ''].filter(Boolean).map(text => { const badge = document.createElement('span'); badge.textContent = text; return badge; }));
  $('stats').replaceChildren(...S.map(key => {
    const div = document.createElement('div');
    div.className = 'stat';
    const label = document.createElement('span');
    label.textContent = key;
    const value = document.createElement('strong');
    const sourceModifier = record.statModifier?.[key] || 0;
    if (record.fusion) value.textContent = record.componentStats ? record.componentStats[key] : '?';
    else if (modifierOnlyProfile) value.textContent = sourceModifier > 0 ? `+${sourceModifier}` : sourceModifier;
    else value.textContent = Math.max(0, final[key]);
    const change = document.createElement('div');
    change.className = 'change';
    change.textContent = record.fusion ? (record.componentStats ? 'Both halves added' : 'Component-derived') : modifierOnlyProfile ? 'Source modifier; base unknown' : adjustments[key] ? `${adjustments[key] > 0 ? '+' : ''}${adjustments[key]} adjustment` : 'Base value';
    div.append(label, value, change);
    return div;
  }));
  $('abilities').replaceChildren(...abilityList.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
  const notes = [];
  if (record.fusion) notes.push(`A fusion's stats are her two halves added together. These are the base Gem-Type stats of ${record.components.join(' + ')}. For a real fusion, add up the two characters' own sheets instead.`);
  if (currentModifier.unique) notes.push('This is a unique modifier; use it only for an approved case-by-case record.');
  if (cutEl.value.startsWith('Perfect')) notes.push('The selected cut applies its stat changes and enhances the signature ability.');
  if (cutEl.value === 'Defective') notes.push(`Defective applies -1 to ${defectStatAEl.value} and ${defectStatBEl.value}; the twisted signature ability must be selected by staff.`);
  if (shift) notes.push('The selected United Frontier Quartz shift applies its stat change to Clear Quartz base stats.');
  if (modifierOnlyProfile) notes.push('This profile provides stat modifiers but no absolute base stats. The stat panel shows the source modifiers; final stats cannot be calculated from the supplied data.');
  else notes.push('Level gains follow the level-up rules on the Stats page.');
  $('notice').textContent = notes.join(' ');
}
choices(factionEl, factions); choices(eraEl, modifiers, m => m.name); choices(prismEl, ['Unshifted', ...quartz.map(q => q.name)]); choices(cutEl, Object.keys(cuts)); refreshDefectStatOptions();
factionEl.addEventListener('change', refreshGems); [gemEl, prismEl, eraEl, cutEl, defectStatAEl, defectStatBEl, $('level')].forEach(el => el.addEventListener('input', refresh));
refreshGems();
fusionAEl.addEventListener('change', refreshFusion); fusionBEl.addEventListener('change', refreshFusion); initialiseFusionTool();

// Ability Checker event listeners - wrapped in DOMContentLoaded to ensure elements exist
const wireExtras = () => {
  const searchBtn = $('ability-search-btn');
  const searchInput = $('ability-search-input');
  if (searchBtn) searchBtn.addEventListener('click', checkAbilityOverlap);
  if (searchInput) searchInput.addEventListener('input', checkAbilityOverlap);
  
  // Facet & Cut Generator event listeners
  const generateBtn = $('generate-codes-btn');
  if (generateBtn) generateBtn.addEventListener('click', generateCodes);
  
  // Copy button listeners
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const targetElement = $(targetId);
      if (targetElement) {
        copyToClipboard(targetElement.textContent, btn);
      }
    });
  });
  
  // Submission Validator event listener
  const validateBtn = $('validate-btn');
  if (validateBtn) validateBtn.addEventListener('click', runValidation);
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireExtras); else setTimeout(wireExtras, 0);

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

// Social standing mapping (rank without decimal)
const socialStandingMap = {
  '5.2': '5',
  '5.1': '5',
  '4.3': '4',
  '4.2': '4',
  '4.1': '4',
  '3.3': '3',
  '3.2': '3',
  '3.1': '3',
  '2.3': '2',
  '2.2': '2',
  '2.1': '2',
  '1.2': '1',
  'United Frontier': 'UF',
  'Titan': 'T',
  'Standard': 'S',
  'Elite': 'E',
  'Champion': 'C',
  'Minion': 'M'
};

// Facet & Cut Generator functions
function generateFacetCode(diamond, kindergarten, socialStanding, randomLetter) {
  const diamondCode = diamondCodes[diamond] || '?';
  const kindergartenLetter = kindergarten.charAt(0).toUpperCase() || '?';
  const socialCode = socialStandingMap[socialStanding] || socialStanding.charAt(0) || '?';
  const randomFacetLetter = randomLetter.toUpperCase() || '?';
  
  return `${diamondCode}${kindergartenLetter}${socialCode}${randomFacetLetter}`;
}

function generateCutCode(atkStat, randomLetter) {
  const atkCode = atkStat.toString();
  const cutCode = `${atkCode}X${randomLetter.toUpperCase()}`;
  return cutCode;
}

function generateCodes() {
  const diamond = $('diamond-select').value;
  const kindergarten = $('kindergarten-input').value;
  const socialStanding = $('social-standing-select').value;
  const randomFacetLetter = $('facet-random-letter').value;
  const randomCutLetter = $('cut-random-letter').value;
  const atkStat = $('atk-stat-input').value;
  
  const facetCode = generateFacetCode(diamond, kindergarten, socialStanding, randomFacetLetter);
  const cutCode = generateCutCode(atkStat, randomCutLetter);
  
  $('facet-result').textContent = facetCode;
  $('cut-result').textContent = cutCode;
}

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
