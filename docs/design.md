# YouTube Hangout Queue — Design

Builds on [requirements.md](requirements.md).

## Style: Bubblegum blob (chosen)
Mockups: [Hangout Queue mockups canvas](https://claude.ai/artifact/GTFDEwNSLaNhjqpNnysvts).
- **Palette:** pastel lilac background `#F4EAFF`, ink `#3B1F5C`, muted text `#6B4E8C`. Main purple `#8E5CFF` / deep `#6B3BE8`. Main action button bubblegum pink `#E0217F` (white text). Soft accents: pink `#FFD3EA`, mint `#C9F7E6`, yellow `#FFE066`.
- **Friend colors:** each person gets one (coral `#FF8A65`, mint `#2FD4A0`, pink `#FF7EB6`, yellow `#FFC94D`, blue `#5AB0FF`…) for their avatar dot, thumbnail ring and name chip, so the TV shows at a glance whose video is up.
- **Shapes:** squishy, slightly uneven blob corners (e.g. `34px 30px 36px 28px`), pill-shaped queue rows, round icon buttons, big soft blobs in the background. No outlines or hard shadows.
- **Mascot:** a little purple TV with googly eyes, antennae and a pink smile. It appears next to the room code, on the home screen, on empty states, and bouncing on the TV between videos.
- **Type:** *Baloo 2* for everything (800 headings, 700 labels, 500 body).
- **Motion:** squishy and bouncy. Cards pop in, rows wobble when dragged, the mascot's eyes follow the progress bar, and it does a hop when a new video starts. Respect "reduce motion."
- **Room code:** big bold letters, letter-spaced; on the TV, each letter sits in its own blob.

## Screens

### Phone
1. **Home:** logo, big "Create room" button, "Join" code input (4–5 letter tiles, auto-advance, auto-uppercase).
2. **Name prompt:** "What should we call you?" + name input; your friend color is shown as a preview.
3. **Room (main screen)**
   - Header: room code tiles + share button (opens QR/link). Host also sees a gear icon (settings).
   - **Now playing card:** thumbnail, title, "added by" chip. Play/pause and skip shown for the host, or for everyone if guest controls are on.
   - **Up next list:** rows with thumbnail, title, duration, added-by chip. Your own rows have a remove button. Host rows have a drag handle (long-press to drag on touch).
   - **Sticky bottom bar:** big coral "Add video" pill.
   - **Empty state:** "The queue's empty. Be the first to add something."
4. **Add video (bottom sheet):** one input, "Paste a link or search."
   - Looks like a URL → preview card with "Add to queue."
   - Words → search results list (debounced ~400ms); tap a row's "+" to add. Sheet stays open so you can add several; a toast confirms each add.
   - Errors inline: "That link isn't a YouTube video," "This video can't be played outside YouTube," "You've hit the limit of N videos. Wait for one to play."
5. **Host settings (bottom sheet):** "Guests can play/pause and skip" toggle, "Max videos per person" stepper (No limit, 1–10), "Open TV view" button, "Share room" (QR + link).

### TV (16:9, read from ~3m away)
6. **Idle:** huge room code tiles, QR code, join URL, "Scan to add videos." Gently animated colorful background shapes.
7. **Start gate:** "Tap to start the party" (needed once for autoplay with sound).
8. **Playing:** full-screen video. Corner overlay (bottom-left) shows room code; "Up next: <title> · <name>" slides in for the last 15 s of a video and the first 5 s of the next, otherwise hidden.
9. **Between videos:** 2–3 s card "Next up: <title>, added by <name>" in that person's color.

## Key flows
- **Host:** Home → Create room → Name → Room → Settings → Open TV view (on the TV or laptop) → tap to start.
- **Guest:** scan QR on TV (or type code) → Name → Room → Add video → paste/search → add.
- **Playback:** TV reports "ended" or "error" → server advances the queue → all phones update.
- **Control:** a phone sends play/pause/skip → server checks permission → TV obeys.
