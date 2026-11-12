import { describe, expect, it } from 'vitest';
import { parseIsoDuration } from './youtube';

describe('parseIsoDuration', () => {
  it.each([
    ['PT4M12S', 252],
    ['PT1H2M3S', 3723],
    ['PT45S', 45],
    ['PT10M', 600],
    ['PT2H', 7200],
    ['P1DT1S', 86401],
    ['P0D', 0],
  ])('%s is %i seconds', (iso, seconds) => {
    expect(parseIsoDuration(iso)).toBe(seconds);
  });

  it('returns 0 for unknown formats', () => {
    expect(parseIsoDuration('nonsense')).toBe(0);
  });
});
