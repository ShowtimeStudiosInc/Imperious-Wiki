// Live "who's viewing this page" counter for the wiki.
// Each wiki page gets its own Durable Object room. Every open tab holds one WebSocket to its
// page's room, and the room sends the current count to everyone whenever someone joins or leaves.
// Nothing about the viewer is stored: the room only knows how many sockets are open.
//
// It also serves /tts, the voices for the Listen button on Holovision episodes (see ttsRoute below).
import { DurableObject } from 'cloudflare:workers';

const ALLOWED = ['https://showtimestudiosinc.github.io', 'http://localhost:4321'];

export class PageRoom extends DurableObject {
  async fetch() {
    const [client, server] = Object.values(new WebSocketPair());
    this.ctx.acceptWebSocket(server); // hibernation API: the room sleeps between joins and leaves
    this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }
  broadcast(leaving) {
    // A socket that is closing still shows up in getWebSockets(), so leave it out by hand.
    const sockets = this.ctx.getWebSockets().filter((ws) => ws !== leaving && ws.readyState === WebSocket.OPEN);
    const msg = JSON.stringify({ viewers: sockets.length });
    for (const ws of sockets) {
      try { ws.send(msg); } catch {}
    }
  }
  async webSocketMessage() {} // the page never needs to talk back
  async webSocketClose(ws) {
    try { ws.close(); } catch {}
    this.broadcast(ws);
  }
  async webSocketError(ws) {
    try { ws.close(); } catch {}
    this.broadcast(ws);
  }
}

// ---------- /tts: voices for the Listen button ----------
// The page asks for "line N of episode X". The Worker reads that line from the episode's published
// lines.json on the wiki, so it can only ever voice text that is really on the wiki. Each line is made
// once with Deepgram Aura-2 on Workers AI and saved, so every listener after the first gets the saved copy.
const SITE = 'https://showtimestudiosinc.github.io/Imperious-Wiki';
const MODEL = '@cf/deepgram/aura-2-en';
const VOICES = new Set(['amalthea', 'andromeda', 'apollo', 'arcas', 'aries', 'asteria', 'athena', 'atlas', 'aurora', 'callista', 'cora',
  'cordelia', 'delia', 'draco', 'electra', 'harmonia', 'helena', 'hera', 'hermes', 'hyperion', 'iris', 'janus', 'juno', 'jupiter', 'luna',
  'mars', 'minerva', 'neptune', 'odysseus', 'ophelia', 'orion', 'orpheus', 'pandora', 'phoebe', 'pluto', 'saturn', 'thalia', 'theia', 'vesta', 'zeus']);

const cors = (origin) => ({ 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' });

async function sha(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

async function ttsRoute(request, env, ctx, url, origin) {
  const head = cors(origin);
  if (url.pathname === '/tts/health') {
    return Response.json({ ok: !!env.AI }, { headers: { ...head, 'Cache-Control': 'no-store' } });
  }
  if (!env.AI) return new Response('Voices are not set up', { status: 503, headers: head });
  const ep = (url.searchParams.get('ep') || '').toLowerCase();
  const i = Number(url.searchParams.get('i'));
  if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(ep) || !Number.isInteger(i) || i < 0 || i > 5000) {
    return new Response('Bad request', { status: 400, headers: head });
  }

  // The episode's line list, cached at the edge for 10 minutes. The page sends each line's fingerprint (v),
  // and if the cached list doesn't match it, the episode was just edited, so fetch the list fresh.
  const want = (url.searchParams.get('v') || '').toLowerCase();
  const getLine = async (fresh) => {
    const res = await fetch(`${SITE}/tv/${ep}/lines.json${fresh ? `?t=${Date.now()}` : ''}`, fresh ? { cf: { cacheTtl: 0 } } : { cf: { cacheTtl: 600, cacheEverything: true } });
    if (!res.ok) return null;
    return ((await res.json()).lines || [])[i] || null;
  };
  let line = await getLine(false);
  if (line && want && line.v !== want) line = await getLine(true);
  if (!line || !line.text) return new Response('No such line', { status: 404, headers: head });
  if (want && line.v && line.v !== want) {
    // The page and the published list still disagree (the site is mid-update). Don't voice old text.
    return new Response('Line changed', { status: 409, headers: { ...head, 'Cache-Control': 'no-store' } });
  }
  const voice = VOICES.has(line.voice) ? line.voice : 'asteria';
  const text = String(line.say || line.text).slice(0, 1500); // `say` is the spoken version, when it differs

  const key = `tts/v1/${voice}/${await sha(text)}.mp3`;
  const audioHeaders = { ...head, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=31536000, immutable' };

  // 1. Saved copy from KV (if a TTS_CACHE namespace is bound), shared by every data center.
  if (env.TTS_CACHE) {
    const saved = await env.TTS_CACHE.get(key, 'arrayBuffer');
    if (saved) return new Response(saved, { headers: { ...audioHeaders, 'X-TTS': 'saved' } });
  }
  // 2. Saved copy in this data center's cache.
  const cacheKey = new Request(`https://tts.cache/${key}`);
  const cached = await caches.default.match(cacheKey);
  if (cached) {
    const buf = await cached.arrayBuffer();
    if (env.TTS_CACHE) ctx.waitUntil(env.TTS_CACHE.put(key, buf));
    return new Response(buf, { headers: { ...audioHeaders, 'X-TTS': 'cached' } });
  }
  // 3. Make it.
  let buf;
  try {
    const out = await env.AI.run(MODEL, { text, speaker: voice, encoding: 'mp3' });
    buf = out instanceof ArrayBuffer ? out : await new Response(out).arrayBuffer();
  } catch (err) {
    // Usually the daily free allowance running out. The page falls back to the device voices.
    return new Response('Voice unavailable', { status: 503, headers: { ...head, 'Cache-Control': 'no-store' } });
  }
  if (!buf || buf.byteLength < 200) return new Response('Voice unavailable', { status: 503, headers: head });
  ctx.waitUntil(caches.default.put(cacheKey, new Response(buf, { headers: { 'Cache-Control': 'public, max-age=31536000' } })));
  if (env.TTS_CACHE) ctx.waitUntil(env.TTS_CACHE.put(key, buf));
  return new Response(buf, { headers: { ...audioHeaders, 'X-TTS': 'new' } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/tts' || url.pathname === '/tts/health') {
      const origin = request.headers.get('Origin') || '';
      if (!ALLOWED.includes(origin)) return new Response('Not allowed', { status: 403 });
      return ttsRoute(request, env, ctx, url, origin);
    }
    if (url.pathname !== '/room') return new Response('Imperious Wiki presence', { status: 200 });
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const origin = request.headers.get('Origin') || '';
    if (!ALLOWED.includes(origin)) return new Response('Not allowed', { status: 403 });
    // One room per page path. Trim it so odd URLs can't make endless rooms.
    let page = (url.searchParams.get('page') || '/').toLowerCase().replace(/[^a-z0-9/_-]/g, '').slice(0, 120);
    if (!page.endsWith('/')) page += '/';
    const room = env.ROOMS.get(env.ROOMS.idFromName(page));
    return room.fetch(request);
  },
};
