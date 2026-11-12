# Hangout Queue: project rules

A shared YouTube queue for hangouts. Friends join a room with a code from their phones and add videos; a TV page plays them in order.

- Requirements: Notion page "YouTube Hangout Queue — MVP Requirements" (source of truth); `docs/requirements.md` is a snapshot.
- Design: `docs/design.md` and the mockup canvas linked there (Bubblegum blob style).
- Architecture: `docs/tech-stack.md`.

Follow these rules in every session. If a rule blocks something reasonable, ask before breaking it, then update this file.

## Stack
- React 18 + TypeScript + Vite, React Router, Tailwind CSS, Zustand, `@dnd-kit/sortable`.
- Cloudflare Workers + one Durable Object per room (WebSockets). YouTube Data API v3 called only from the Worker.
- Zod for every message crossing the network.
- npm (no pnpm/yarn). Node 22.

## Commands
- `npm run dev`: local dev (Vite + Worker via `@cloudflare/vite-plugin`).
- `npm run check`: Biome lint + format check. Must pass before every commit.
- `npm run typecheck`: `tsc --noEmit`. Must pass before every commit.
- `npm test`: Vitest (Worker logic + components). Must pass before every commit.
- `npm run deploy`: `wrangler deploy`.

## Project layout
```
src/            React app
  pages/        one component per route: HomePage, RoomPage, TvPage
  components/   shared UI (Button, Mascot, QueueRow, Sheet…)
  store/        Zustand stores (roomStore.ts)
  lib/          client helpers (socket.ts, storage.ts)
worker/         index.ts (routes), Room.ts (Durable Object), youtube.ts, codes.ts
shared/         schemas.ts (Zod), types.ts (inferred types), constants.ts
```
- Code used by both client and Worker lives in `shared/` only. `src/` never imports from `worker/` and vice versa.

## TypeScript
- `strict: true`, plus `noUncheckedIndexedAccess`. No `any`, no `as` casts except `as const`; no `@ts-ignore` (use `@ts-expect-error` with a reason if truly needed).
- Types for messages and room state are inferred from Zod schemas in `shared/schemas.ts` (`z.infer`). Never hand-write a duplicate type.
- Parse every incoming WebSocket message and HTTP body with its schema on both sides. Invalid input gets an `error` message, never a crash.
- Prefer `type` over `interface`. Use discriminated unions (`type: 'add' | 'remove' …`) for messages and handle them with exhaustive `switch` + a `never` check.

## Naming and files
- Components: PascalCase file and name, one component per file (`QueueRow.tsx` exports `QueueRow`).
- Hooks: `useThing.ts`. Utils, stores, schemas: camelCase (`parseYoutubeUrl.ts`, `roomStore.ts`).
- Named exports only; no default exports (config files that require them are the exception).
- Booleans read as questions: `isHost`, `hasGuestControls`. Handlers: `onX` for props, `handleX` inside the component.
- Tests sit next to the file: `parseYoutubeUrl.test.ts`, `QueueRow.test.tsx`.

## React
- Function components only. Props typed with a `type XProps = {…}` right above the component.
- **State:** the server is the source of truth. `store/roomStore.ts` (Zustand) holds the connection status and the latest room snapshot from the server; only the socket layer (`lib/socket.ts`) writes to it. Components read with selectors (`useRoomStore((s) => s.queue)`), never the whole store.
- UI-only state (sheet open, input text) stays in `useState` in the component.
- No optimistic updates in the MVP: send the action, render the server's next snapshot.
- Keep components under ~150 lines; split out pieces when they grow.

## Styling (Bubblegum blob)
- All colors, radii, font and shadows are Tailwind theme tokens in `tailwind.config.ts`, taken from `docs/design.md` (e.g. `bg-lilac`, `text-ink`, `bg-bubblegum`, `rounded-blob`). No raw hex codes or arbitrary values (`bg-[#…]`, `rounded-[…]`) in components.
- Reusable visual pieces are components: `Button`, `IconButton`, `Mascot`, `RoomCode`, `FriendChip`, `Sheet`.
- Tap targets at least 44px. Text contrast at least 4.5:1. Respect `prefers-reduced-motion`.
- Icons: inline SVG components in `src/components/icons/`, no emoji.

## Worker / Durable Object
- All room rules (host-only actions, per-person limit, reorder, guest controls, embeddable check) are enforced in `worker/Room.ts`. The client only hides buttons; it never decides.
- Keep the rule logic in plain, pure functions (e.g. `applyAction(state, action, actor)`) so it can be unit-tested without a Durable Object.
- Secrets (`YOUTUBE_API_KEY`) come from `env`; never log them or send them to the client. Local values live in `.dev.vars` (git-ignored).

## Testing (Vitest)
- **Worker:** unit tests for every rule in the pure room logic (add, remove, reorder, skip, limit, permissions, settings) and for `parseYoutubeUrl`.
- **Components:** React Testing Library tests for key components (QueueRow, AddVideoSheet, SettingsSheet, RoomCode input): render, user interaction, and what's shown for host vs guest. Query by role and label, not by class or test id.
- New logic ships with its tests in the same commit.

## Comments
- Comment the *why*, not the what (e.g. why the TV needs a tap before autoplay). No commented-out code.
- TSDoc on shared schemas/types and on exported Worker functions.

## Formatting and lint
- Biome is the only linter/formatter (`biome.json`). Defaults plus: 2-space indent, single quotes, semicolons, line width 100.
- Don't hand-format; run `npm run check -- --write` (or `biome check --write`).

## Git
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `style:`. Imperative, lower case, no period: `feat: add per-person queue limit`.
- One commit per finished, working step; check, typecheck and tests pass first.
- Never commit `.dev.vars`, `.wrangler/`, `node_modules/` or `dist/`.
