import { z } from 'zod';
import type { Video } from '../shared/types';

const API = 'https://www.googleapis.com/youtube/v3';

const videosResponseSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        snippet: z.object({
          title: z.string(),
          channelTitle: z.string(),
          thumbnails: z.record(z.string(), z.object({ url: z.string() })),
        }),
        contentDetails: z.object({ duration: z.string() }),
        status: z.object({ embeddable: z.boolean(), privacyStatus: z.string() }),
      }),
    )
    .default([]),
});

export type VideoLookup =
  | { ok: true; video: Video }
  | { ok: false; reason: 'not_found' | 'not_embeddable' | 'api_error' };

/** Converts an ISO 8601 duration like `PT1H2M3S` to seconds. Unknown formats give 0. */
export function parseIsoDuration(iso: string): number {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso);
  if (!match) return 0;
  const [, d = '0', h = '0', m = '0', s = '0'] = match;
  return Number(d) * 86400 + Number(h) * 3600 + Number(m) * 60 + Number(s);
}

/**
 * Looks up one video's title, channel, duration and thumbnail, and checks it can be played in
 * our embedded player (requirement R2.4). Results are cached at the edge for an hour, since
 * friends often re-add the same videos and each lookup costs API quota.
 */
export async function fetchVideo(videoId: string, apiKey: string): Promise<VideoLookup> {
  const url = new URL(`${API}/videos`);
  url.searchParams.set('part', 'snippet,contentDetails,status');
  url.searchParams.set('id', videoId);
  url.searchParams.set('key', apiKey);

  let res: Response;
  try {
    res = await fetch(url, { cf: { cacheTtl: 3600, cacheEverything: true } });
  } catch {
    return { ok: false, reason: 'api_error' };
  }
  if (!res.ok) return { ok: false, reason: 'api_error' };

  const parsed = videosResponseSchema.safeParse(await res.json());
  if (!parsed.success) return { ok: false, reason: 'api_error' };

  const item = parsed.data.items[0];
  if (!item || item.status.privacyStatus === 'private') return { ok: false, reason: 'not_found' };
  if (!item.status.embeddable) return { ok: false, reason: 'not_embeddable' };

  const thumbs = item.snippet.thumbnails;
  const thumbnailUrl = thumbs.medium?.url ?? thumbs.high?.url ?? thumbs.default?.url ?? '';

  return {
    ok: true,
    video: {
      videoId: item.id,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      durationSec: parseIsoDuration(item.contentDetails.duration),
      thumbnailUrl,
    },
  };
}
