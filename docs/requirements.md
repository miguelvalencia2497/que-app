# YouTube Hangout Queue — MVP Requirements

## Context
At a hangout, everyone wants to put videos on the TV, but one person ends up holding the remote and typing in requests. This app lets each friend join a "room" from their phone with a short code and add YouTube videos to a shared queue. A TV page plays the queue in order without anyone touching it.

This document covers **requirements only**. Next steps, in order: (1) agree on these requirements, (2) design (screens, flows, look), (3) tech stack, then build.

### Decisions made
- **Playback:** our own TV page using YouTube's embedded player (no Google sign-in, no real YouTube playlist).
- **Adding videos:** paste a link **or** search inside the app (needs a YouTube Data API key).
- **Order:** first come, first served (FIFO).
- **Hosting:** deployed online at a public URL; works over Wi-Fi or mobile data.

## Users / roles
| Role | Device | What they do |
|---|---|---|
| **Host** | Phone or laptop | Creates the room, opens the TV view, has extra controls (skip, remove any video). |
| **Guest** | Phone | Joins with the room code, enters a display name, adds videos, sees the queue. |
| **TV view** | TV browser / laptop on HDMI / Cast tab | Plays the queue full screen, shows the room code so people can join. |

No accounts or passwords. Identity is a display name stored on the device.

## Functional requirements

### 1. Rooms
- **R1.1** Host creates a room with one tap and gets a short code (4–5 letters, no lookalikes like O/0, I/1).
- **R1.2** Guests join by typing the code on the home page, or by opening a join link / scanning a QR code.
- **R1.3** On first join, a guest enters a display name (remembered on that device).
- **R1.4** A room expires after a period with no activity (e.g. 12 hours). No history is kept beyond that.
- **R1.5** The host role stays with the device that created the room (survives page refresh).

### 2. Adding videos
- **R2.1** Paste a YouTube URL (youtube.com/watch, youtu.be, Shorts, mobile links); the app extracts the video ID and shows title + thumbnail before confirming.
- **R2.2** Search by keyword; show a list of results (thumbnail, title, channel, duration); tap to add.
- **R2.3** Each queued item records who added it and when.
- **R2.4** Reject invalid links, and videos that can't be embedded, with a clear message.
- **R2.5** Optional per-person limit on how many videos one person can have queued at once (see R5.2). When reached, the guest sees "You have N videos queued; wait for one to play."

### 3. Queue
- **R3.1** Videos play in the order added (FIFO).
- **R3.2** Everyone sees the live queue: now playing, then up next, with who added each one. Updates appear within ~1–2 seconds without refreshing.
- **R3.3** A guest can remove their own queued videos.
- **R3.4** The host can remove any video and skip the current one.
- **R3.5** The host can drag and drop to reorder upcoming videos (touch-friendly on phones). FIFO is the default order; a manual reorder overrides it, and new videos still go to the end.
- **R3.6** Played videos drop off the queue (a short "recently played" list is nice-to-have).

### 5. Room settings (host only)
A settings panel the host can open at any time; changes apply right away for everyone in the room.
- **R5.1** **Guest playback controls** (toggle, default off): when on, guests also get play/pause and skip on their phones. When off, only the host has them.
- **R5.2** **Per-person queue limit** (default: no limit; options e.g. 1–10 or "no limit"): caps how many unplayed videos one person can have in the queue. Lowering it doesn't remove videos already queued; it just blocks new ones until the person is under the limit. The host is exempt.
- **R5.3** Settings are stored with the room and survive page refreshes.
- **R5.4** Playback controls (play/pause, skip) from any allowed phone act on the TV view within ~2 seconds.

### 4. TV view
- **R4.1** Host opens the TV view at a dedicated URL for the room (e.g. `/tv/ABCD`).
- **R4.2** Plays the current video full screen via the YouTube embedded player and automatically moves to the next video when one ends.
- **R4.3** If a video fails to play (removed, region-blocked, embed-disabled), skip it automatically.
- **R4.4** When the queue is empty, show an idle screen with the room code, join URL and QR code.
- **R4.5** While playing, show a small overlay with the room code and "up next."
- **R4.6** Needs one click/tap to start (browsers block autoplay with sound until the user interacts).
- **R4.7** If the TV page reloads, it picks up from the current video.

## Non-functional requirements
- **Mobile-first:** guest pages built for phones; TV view built for a 16:9 screen read from across the room.
- **Real-time:** queue changes show up on every device within ~2 seconds.
- **Scale:** small. ~1–20 people per room, a handful of rooms at once.
- **Cost:** runs on free or near-free hosting. YouTube search quota (10,000 units/day by default; one search costs 100) means ~100 searches/day, which is fine for a hangout. Cache results and debounce typing.
- **Privacy:** no accounts, no personal data beyond display names; rooms are deleted when they expire.
- **Browsers:** current Chrome, Safari (iOS) and Edge, plus TV browsers that support the YouTube embed.

## Out of scope for MVP
- User accounts, sign-in, saving playlists across sessions.
- Syncing to a real YouTube playlist or controlling the YouTube TV app.
- Voting, guest reordering, round-robin fairness, chat, reactions.
- Playing in sync on multiple screens; audio-only mode.
- Native mobile apps.

## Acceptance check (how we'll know the MVP works)
1. Host creates a room on a laptop and opens the TV view on a second screen.
2. Two phones (one on mobile data) join by code and by QR scan.
3. Phone A pastes a link, phone B searches and adds a video; both appear on all three screens within ~2 s, in order.
4. TV plays video 1, then moves to video 2 automatically when it ends.
5. Host skips a video, drags a video to the top of the queue, and a guest removes their own queued video; changes show everywhere.
5a. Host turns on guest playback controls; a guest pauses the TV from their phone. Host turns it off; the guest's controls disappear.
5b. Host sets the per-person limit to 2; a guest's third add is blocked with a message.
6. Adding a non-embeddable video is rejected or auto-skipped on the TV.
7. Refreshing the TV page resumes the current video.

## Next steps
1. Confirm or edit these requirements.
2. **Design:** screen list (Home, Join/Name, Room/Queue, Search, Host settings, TV idle, TV playing), user flows, and mockups.
3. **Tech stack:** front end, real-time layer, storage for rooms, hosting, YouTube API setup.
