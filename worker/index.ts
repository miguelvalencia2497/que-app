import { roomCodeSchema } from '../shared/schemas';
import type { CreateRoomResponse } from '../shared/types';
import { generateRoomCode } from './codes';

export { Room } from './Room';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * API routes. Everything outside /api/* is the React app, served from static assets
 * (see `assets` in wrangler.jsonc).
 */
export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean); // ['api', 'rooms', CODE, 'ws']

    if (parts[0] !== 'api' || parts[1] !== 'rooms') return json({ error: 'not_found' }, 404);

    // POST /api/rooms → create a room with a fresh code.
    if (parts.length === 2 && request.method === 'POST') {
      // Codes come from a space of ~280k, so a collision is rare; retry a few times anyway.
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateRoomCode();
        const tokens = await env.ROOMS.getByName(code).init(code);
        if (tokens) return json({ code, ...tokens } satisfies CreateRoomResponse, 201);
      }
      return json({ error: 'try_again' }, 503);
    }

    const code = roomCodeSchema.safeParse(parts[2]?.toUpperCase());
    if (!code.success) return json({ error: 'invalid_code' }, 400);
    const room = env.ROOMS.getByName(code.data);

    // GET /api/rooms/:code → does this room exist?
    if (parts.length === 3 && request.method === 'GET') {
      return (await room.exists()) ? json({ code: code.data }) : json({ error: 'not_found' }, 404);
    }

    // GET /api/rooms/:code/ws → live connection for phones and the TV.
    if (parts.length === 4 && parts[3] === 'ws') {
      if (!(await room.exists())) return json({ error: 'not_found' }, 404);
      return room.fetch(request);
    }

    return json({ error: 'not_found' }, 404);
  },
} satisfies ExportedHandler<Env>;
