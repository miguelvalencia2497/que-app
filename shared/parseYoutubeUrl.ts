const VIDEO_ID = /^[\w-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);
const PATH_PREFIXES = ['/shorts/', '/embed/', '/live/', '/v/'];

/**
 * Pulls the video id out of anything a friend might paste: watch links, youtu.be short links,
 * Shorts, embeds, live links, mobile/music links, or a bare 11-character id.
 * Returns `null` when the text isn't a YouTube video link.
 */
export function parseYoutubeUrl(input: string): string | null {
  const text = input.trim();
  if (VIDEO_ID.test(text)) return text;

  let url: URL;
  try {
    // People often paste links without the scheme ("youtu.be/abc…").
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  let candidate: string | null = null;

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    candidate = url.pathname.split('/')[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === '/watch') {
      candidate = url.searchParams.get('v');
    } else {
      const prefix = PATH_PREFIXES.find((p) => url.pathname.startsWith(p));
      if (prefix) candidate = url.pathname.slice(prefix.length).split('/')[0] ?? null;
    }
  }

  return candidate && VIDEO_ID.test(candidate) ? candidate : null;
}
