// Live "who's viewing this page" counter for the wiki.
// Each wiki page gets its own Durable Object room. Every open tab holds one WebSocket to its
// page's room, and the room sends the current count to everyone whenever someone joins or leaves.
// Nothing about the viewer is stored: the room only knows how many sockets are open.
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
