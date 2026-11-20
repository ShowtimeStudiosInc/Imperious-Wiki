// World events for the Diamond Approval Rating.
// Runs every 3 hours from .github/workflows/world-events.yml:
//   - a small event on most runs,
//   - a medium event every few days,
//   - a weekly report (big event + an update roll for everyone + a new poll) once a week.
// It edits src/data/popularity.yml and src/data/events/state.json, and saves a Discord post in the
// state for the workflow to send after the site is deployed.
//
//   node scripts/world-events.mjs                 one tick (picks the tier by itself)
//   node scripts/world-events.mjs --tier medium   force a tier (small, medium, big)
//   node scripts/world-events.mjs --announce      send the saved Discord post for this run
//   node scripts/world-events.mjs --dry 200       simulate 200 ticks without saving, print a summary
import fs from 'node:fs';
import { load, dump } from 'js-yaml';

const POP = 'src/data/popularity.yml';
const POOL = 'src/data/events/pool.yml';
const STATE = 'src/data/events/state.json';
const SITE = 'https://showtimestudiosinc.github.io/Imperious-Wiki';
const HOUR = 3600e3, DAY = 24 * HOUR;
const MEDIUM_EVERY = [2.5 * DAY, 3.5 * DAY]; // "every few days"
const BIG_EVERY = 7 * DAY;
const LOG_DAYS = 14;
const ACTS_WEIGHT = 0.35; // events where they act themselves come up about a third as often

const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1] ?? true; };

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
function weighted(items, weight) {
  const ws = items.map(weight);
  let r = Math.random() * ws.reduce((s, w) => s + w, 0);
  for (let i = 0; i < items.length; i++) if ((r -= ws[i]) <= 0) return items[i];
  return items[items.length - 1];
}
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// ── Loading ──────────────────────────────────────────────────────────────────
const pool = load(fs.readFileSync(POOL, 'utf8'));
const loadPop = () => load(fs.readFileSync(POP, 'utf8'));
const loadState = () => (fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {});

const gemNames = fs.readdirSync('src/data/gem-types').flatMap((f) => {
  const g = load(fs.readFileSync('src/data/gem-types/' + f, 'utf8'));
  return g.faction === 'gempire' && /^[345]\./.test(String(g.rank)) && g.kind !== 'fusion' ? [g.name] : [];
});

function people(pop) {
  const out = [];
  for (const [group, rows] of [['deity', pop.deity], ['ruling', pop.ruling], ['regent', pop.regents]]) {
    for (const r of rows) {
      let name = r.name;
      if (!name) {
        const page = `src/data/diamond-pages/${r.slug}.json`, reg = `src/data/regents/${r.slug}.json`;
        if (fs.existsSync(reg)) name = JSON.parse(fs.readFileSync(reg, 'utf8')).name;
        else if (fs.existsSync(page)) name = JSON.parse(fs.readFileSync(page, 'utf8')).name;
      }
      name ||= r.slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ') + (group === 'regent' ? '' : ' Diamond');
      const short = name.replace(/^Grand Regent /, '').replace(/ Diamond$/, '').replace(/^(Alpha|Theta|Epsilon|Saturn|Maroon|Nightshade|Omega) .*/, '$1').replace(/^Bi-Colored Kandy$/, 'Kandy');
      out.push({ row: r, group, slug: r.slug, name, short });
    }
  }
  return out;
}

// Alpha Black stays out of public life, so she only gets events that name her or are marked alpha_ok.
const allowed = (p, e) => p.slug !== 'alpha-black' || (Array.isArray(e.who) && e.who.includes('alpha-black')) || (e.alpha_ok && !e.acts);
function inGroup(p, who) {
  if (!who || who === 'any') return true;
  if (Array.isArray(who)) return who.includes(p.slug);
  if (who === 'diamond') return p.group !== 'regent';
  return p.group === who;
}

// ── Unrest ───────────────────────────────────────────────────────────────────
export const unrestLevel = (u) => (u >= 75 ? 'Boiling' : u >= 50 ? 'Restless' : u >= 25 ? 'Uneasy' : 'Calm');
function unrestTarget(all) {
  const avg = all.reduce((s, p) => s + p.row.score, 0) / all.length;
  return clamp(Math.round((72 - avg) * 3), 0, 100);
}

// ── One tick ─────────────────────────────────────────────────────────────────
function tick(pop, state, now, forceTier) {
  const all = people(pop);
  state.flags ||= {};
  if (!state.recent || Array.isArray(state.recent)) state.recent = {};
  state.history ||= [{ t: now - BIG_EVERY, scores: Object.fromEntries(all.map((p) => [p.slug, p.row.previous ?? p.row.score])) }];
  if (pop.unrest == null) pop.unrest = unrestTarget(all);
  state.lastMedium ??= now;
  state.lastBig ??= now;
  state.nextMediumGap ??= rand(MEDIUM_EVERY[0], MEDIUM_EVERY[1]);

  let tier = forceTier;
  if (!tier) tier = now - state.lastBig >= BIG_EVERY ? 'big' : now - state.lastMedium >= state.nextMediumGap ? 'medium' : 'small';
  if (tier === 'big') state.lastBig = now;
  if (tier === 'medium' || tier === 'big') { state.lastMedium = now; state.nextMediumGap = rand(MEDIUM_EVERY[0], MEDIUM_EVERY[1]); }

  const fits = (e) =>
    e.tier === tier &&
    (e.min_unrest == null || pop.unrest >= e.min_unrest) &&
    (e.max_unrest == null || pop.unrest <= e.max_unrest) &&
    !(state.recent[tier] || []).includes(e.id) &&
    (!e.needs || all.some((p) => (state.flags[e.needs] || []).includes(p.slug))) &&
    all.some((p) => inGroup(p, e.who) && allowed(p, e));
  let options = pool.filter(fits);
  // Follow-ups to a chain come first when one is waiting.
  const followUps = options.filter((e) => e.needs);
  if (followUps.length && Math.random() < 0.6) options = followUps;
  if (!options.length) options = pool.filter((e) => e.tier === tier && !e.needs && e.min_unrest == null && e.max_unrest == null);
  // Keep the overall average near the middle: when gems are doing well, bad news is more likely, and the other way round.
  const avg = all.reduce((s, p) => s + p.row.score, 0) / all.length;
  const lean = (e) => Math.sign(e.change[0] + e.change[1]);
  const ev = weighted(options, (e) => (e.acts ? ACTS_WEIGHT : 1) * Math.exp(-lean(e) * (avg - 58) / 6));
  state.recent[tier] = [ev.id, ...(state.recent[tier] || [])].slice(0, tier === 'small' ? 20 : tier === 'medium' ? 8 : 4);

  const date = new Date(now).toISOString().slice(0, 10);
  const lines = [];
  const move = (p, n, kind, text, always = true) => {
    const before = p.row.score;
    p.row.score = clamp(before + n, 3, 98);
    const real = p.row.score - before;
    if (real || always) lines.push({ date, who: p.slug, change: real >= 0 ? `+${real}` : `${real}`, kind, text });
    return real;
  };
  const fill = (text, p, other, gem) =>
    text
      .replaceAll('{short}', p.short).replaceAll('{name}', p.name).replaceAll('{other}', other?.short ?? '')
      .replaceAll('{a_gem}', (/^[AEIOU]/i.test(gem) ? 'An ' : 'A ') + gem).replaceAll('{gem}', gem)
      .replace(/(^|\. )a /g, '$1A ').replace(/(^|\. )an /g, '$1An ');
  const gem = pick(gemNames);
  // Good news tends to find gems who are doing badly and bad news finds gems who are doing well,
  // so nobody drifts off to 0 or 100.
  const leaning = (e) => (e.change[0] + e.change[1]) / 2;
  const tilt = (p, sign) => Math.pow(sign >= 0 ? 101 - p.row.score : p.row.score, 1.5);

  let candidates = all.filter((p) => inGroup(p, ev.who) && allowed(p, ev));
  if (ev.needs) candidates = candidates.filter((p) => (state.flags[ev.needs] || []).includes(p.slug));

  if (tier === 'big') {
    const hit = ev.targets === 'all' ? candidates : [...candidates].sort(() => Math.random() - 0.5).slice(0, ev.targets || 3);
    // The headline goes in the log once, under the first gem it hits, with the others listed after it.
    const changes = hit.map((p) => ({ p, n: rand(ev.change[0], ev.change[1]) }));
    for (const [i, { p, n }] of changes.entries()) move(p, n, 'big', i === 0 ? ev.text : 'Also part of this week\'s headline.', i === 0);
    // Then the weekly update roll for everyone.
    for (const p of all) {
      const n = weighted([-2, -1, 0, 1, 2], (k) => (k === 0 ? 1.2 : 1) * (k > 0 ? (101 - p.row.score) / 50 : k < 0 ? p.row.score / 50 : 1));
      if (n) move(p, n, 'roll', n > 0 ? 'Their numbers went up a little in this week\'s poll.' : 'Their numbers dipped a little in this week\'s poll.');
    }
    for (const p of all) if (p.row.votes) p.row.votes = Math.max(500, Math.round(p.row.votes * (0.94 + Math.random() * 0.12)));
  } else {
    const p = weighted(candidates, (c) => tilt(c, leaning(ev)));
    let other = null;
    if (ev.other) {
      other = ev.other_who ? all.find((o) => o.slug === ev.other_who) : pick(all.filter((o) => o.slug !== p.slug && o.slug !== 'alpha-black'));
    }
    const text = fill(ev.text, p, other, gem);
    move(p, rand(ev.change[0], ev.change[1]), tier, text);
    if (other) move(other, rand(ev.other[0], ev.other[1]), tier, `Also part of this: ${text}`);
    if (ev.sets) state.flags[ev.sets] = [...new Set([...(state.flags[ev.sets] || []), p.slug])];
    if (ev.needs) state.flags[ev.needs] = (state.flags[ev.needs] || []).filter((s) => s !== p.slug);
  }
  for (const k of Object.keys(state.flags)) if (!state.flags[k].length) delete state.flags[k];

  // Unrest follows how the Diamonds are doing overall, plus whatever the event did.
  const target = unrestTarget(all);
  pop.unrest = clamp(Math.round(pop.unrest + (target - pop.unrest) * 0.05 + (ev.unrest || 0)), 0, 100);

  // "Change" on the boards = change over the last 7 days.
  state.history.push({ t: now, scores: Object.fromEntries(all.map((p) => [p.slug, p.row.score])) });
  const weekAgo = [...state.history].reverse().find((h) => h.t <= now - BIG_EVERY) || state.history[0];
  state.history = state.history.filter((h) => h.t >= weekAgo.t);
  for (const p of all) p.row.previous = weekAgo.scores[p.slug] ?? p.row.score;

  pop.updated = date;
  pop.log = [...lines, ...(pop.log || [])].filter((l) => now - new Date(l.date).getTime() <= LOG_DAYS * DAY);
  return { tier, ev, lines, all };
}

// ── Discord post ─────────────────────────────────────────────────────────────
const arrow = (n) => (n > 0 ? `▲ ${n}` : n < 0 ? `▼ ${-n}` : '–');
function discordPost(pop, result) {
  const { tier, lines, all } = result;
  const byslug = Object.fromEntries(all.map((p) => [p.slug, p]));
  const link = `${SITE}/approval-rating/`;
  const unrest = `Unrest: **${pop.unrest}/100** (${unrestLevel(pop.unrest)})`;
  if (tier === 'medium') {
    const main = lines[0], p = byslug[main.who];
    const extra = lines.slice(1).map((l) => `${byslug[l.who].short} ${l.change}`).join(', ');
    return {
      embeds: [{
        title: 'Gempire News', url: link, color: 0xff4fa3,
        description: `${main.text}\n\n**${p.short}** ${main.change}${extra ? ` · ${extra}` : ''}\n${unrest}`,
      }],
    };
  }
  if (tier === 'big') {
    const head = lines.find((l) => l.kind === 'big');
    const board = [['Deity Diamonds', pop.deity], ['Ruling Diamonds', pop.ruling], ['Grand Regents', pop.regents]].map(([t, rows]) =>
      `**${t}**\n` + [...rows].sort((a, b) => b.score - a.score).map((r, i) => `${i + 1}. ${byslug[r.slug].short}: ${r.score} (${arrow(r.score - (r.previous ?? r.score))})`).join('\n'));
    return {
      embeds: [{
        title: 'Weekly Approval Report', url: link, color: 0xff4fa3,
        description: `${head.text}\n\n${board.join('\n\n')}\n\n${unrest}`,
      }],
    };
  }
  return null;
}

// ── Saving ───────────────────────────────────────────────────────────────────
const HEADER = fs.readFileSync(POP, 'utf8').split('\n').filter((l) => l.startsWith('#')).join('\n');
function save(pop, state) {
  const ordered = { updated: pop.updated, unrest: pop.unrest, deity: pop.deity, ruling: pop.ruling, regents: pop.regents, ...(pop.earlier_news ? { earlier_news: pop.earlier_news } : {}), log: pop.log };
  fs.writeFileSync(POP, HEADER + '\n' + dump(ordered, { lineWidth: -1, quotingType: '"' }).replace(/^(\s+change: )'([+-]?\d+)'/gm, '$1$2'));
  fs.writeFileSync(STATE, JSON.stringify(state, null, 1) + '\n');
}

// ── Main ─────────────────────────────────────────────────────────────────────
if (arg('--announce')) {
  const state = loadState();
  const url = process.env.DISCORD_WEBHOOK_URL;
  const post = state.post;
  if (!url || !post || String(post.run) !== String(process.env.GITHUB_RUN_ID)) { console.log('Nothing to post.'); process.exit(0); }
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Imperious Wiki', allowed_mentions: { parse: [] }, embeds: post.embeds }),
  });
  console.log('Discord:', res.status);
} else if (arg('--dry')) {
  const runs = Number(arg('--dry')) || 200;
  const pop = loadPop(), state = loadState();
  let now = Date.now();
  const tiers = { small: 0, medium: 0, big: 0 };
  for (let i = 0; i < runs; i++, now += 3 * HOUR) {
    const r = tick(pop, state, now);
    tiers[r.tier]++;
    if (i < 12 || r.tier !== 'small') console.log(new Date(now).toISOString().slice(0, 13), r.tier.padEnd(6), `U${pop.unrest}`, r.lines.filter((l) => l.kind !== 'roll').map((l) => `${l.who} ${l.change}: ${l.text}`).join(' | ').slice(0, 220));
  }
  console.log(tiers, 'unrest', pop.unrest);
  for (const p of people(pop)) console.log(p.short.padEnd(12), p.row.score, 'prev', p.row.previous);
  console.log('log entries', pop.log.length);
} else {
  const pop = loadPop(), state = loadState();
  const result = tick(pop, state, Date.now(), arg('--tier'));
  const post = discordPost(pop, result);
  state.post = post ? { run: process.env.GITHUB_RUN_ID || 'local', ...post } : null;
  save(pop, state);
  const out = process.env.GITHUB_OUTPUT;
  if (out) fs.appendFileSync(out, `tier=${result.tier}\n`);
  console.log(result.tier, result.lines.map((l) => `${l.who} ${l.change}: ${l.text}`).join('\n'));
}
