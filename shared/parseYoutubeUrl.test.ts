import { describe, expect, it } from 'vitest';
import { parseYoutubeUrl } from './parseYoutubeUrl';

const ID = 'dQw4w9WgXcQ';

describe('parseYoutubeUrl', () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}`],
    [`https://youtube.com/watch?v=${ID}&t=42s`],
    [`https://m.youtube.com/watch?v=${ID}`],
    [`https://music.youtube.com/watch?v=${ID}&list=abc`],
    [`https://youtu.be/${ID}`],
    [`https://youtu.be/${ID}?si=share123`],
    [`youtu.be/${ID}`],
    [`www.youtube.com/watch?v=${ID}`],
    [`https://www.youtube.com/shorts/${ID}`],
    [`https://www.youtube.com/embed/${ID}`],
    [`https://www.youtube.com/live/${ID}?feature=share`],
    [`https://www.youtube-nocookie.com/embed/${ID}`],
    [ID],
    [`  ${ID}  `],
  ])('finds the id in %s', (input) => {
    expect(parseYoutubeUrl(input)).toBe(ID);
  });

  it.each([
    [''],
    ['cat piano'],
    ['https://vimeo.com/123456'],
    ['https://www.youtube.com/'],
    ['https://www.youtube.com/watch?v=short'],
    ['https://www.youtube.com/@somechannel'],
    ['https://notyoutube.com/watch?v=dQw4w9WgXcQ'],
    ['https://www.youtube.com/playlist?list=PL123'],
  ])('returns null for %s', (input) => {
    expect(parseYoutubeUrl(input)).toBeNull();
  });
});
