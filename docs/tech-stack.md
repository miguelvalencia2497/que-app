# YouTube Hangout Queue — Tech Stack

Builds on [requirements.md](requirements.md) and [design.md](design.md).

## Stack
| Layer | Choice |
|---|---|
| Front end | React + TypeScript + Vite, React Router, Tailwind CSS |
| Client state | Zustand (`roomStore`, written only by the socket layer) |
| Validation | Zod schemas in `shared/`, used by client and Worker |
| Lint/format | Biome |
| Drag to reorder | `@dnd-kit/sortable` (touch + mouse) |
| TV playback | YouTube IFrame Player API |
| QR codes | `qrcode` (client-side) |
| Backend | Cloudflare Workers (single Worker serves static assets + API) |
| Rooms / real-time | One **Durable Object per room** (SQLite storage, WebSocket Hibernation API) |
| Room expiry | Durable Object alarm, 12 h after last activity → delete storage |
| YouTube data | YouTube Data API v3 (`search.list`, `videos.list`), called from the Worker; key in a Worker secret; responses cached via Cache API |
| Tooling | Wrangler, `@cloudflare/vite-plugin`, Vitest + React Testing Library; deploy with `wrangler deploy` |

## Architecture
```
Phones / TV ──HTTPS──> Worker ──> static React app
             ──WS /api/rooms/:code/ws──> Room Durable Object (state + sockets)
             ──GET /api/search?q= , /api/video?id= ──> Worker ──> YouTube Data API (cached)
```
- `POST /api/rooms` → generates a code (alphabet without O/0/I/1/L), creates the DO, returns `{ code, hostToken }`. The host token is kept in `localStorage` and proves the host role (R1.5).
- Guests get a random `clientId` in `localStorage`, plus name and friend color.

## Room state (inside the Durable Object)
```ts
Room   { code, createdAt, lastActivity, hostToken, settings, nowPlaying?, queue: QueueItem[], members }
Settings { guestControls: boolean; perPersonLimit: number | null }
QueueItem { id, videoId, title, channel, durationSec, thumb, addedBy: clientId, addedByName, color, addedAt }
Playback { state: 'playing'|'paused', startedAt, positionSec }  // lets a reloaded TV resume (R4.7)
```

## WebSocket messages
- **Client → room:** `hello {clientId, name, hostToken?, role:'phone'|'tv'}`, `add {videoId}`, `remove {itemId}`, `reorder {itemId, toIndex}` (host), `control {play|pause|skip}` (host or guest if allowed), `settings {...}` (host), `tv:ended`, `tv:error`, `tv:progress {positionSec}`.
- **Room → clients:** `state {full room snapshot}` after every change (small rooms, so full snapshots keep it simple), `error {code, message}`, `command {play|pause|load}` for the TV.
- The server checks every rule (host-only actions, per-person limit, embeddable check via `videos.list status.embeddable`).

## Project layout
See `CLAUDE.md` (project rules) for the full layout and conventions.

## Setup needed from you
- A Cloudflare account (free) for deploying.
- A YouTube Data API v3 key from Google Cloud Console (free), stored with `wrangler secret put YOUTUBE_API_KEY`. Local dev uses `.dev.vars`.

## Build order
1. Scaffold Vite + Worker + DO; create/join room; live state over WebSocket.
2. Add by pasting a link (`videos.list`) + queue list + remove.
3. TV page: player, auto-advance, error skip, idle screen + QR, resume after reload.
4. Search, host settings (guest controls, limit), drag to reorder.
5. Playful styling pass, motion, empty/error states.
6. Deploy; run the acceptance check from requirements.md on real phones + TV.
