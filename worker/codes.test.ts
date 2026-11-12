import { describe, expect, it } from 'vitest';
import { roomCodeSchema } from '../shared/schemas';
import { generateRoomCode, generateToken } from './codes';

describe('generateRoomCode', () => {
  it('always produces a valid code without I, L or O', () => {
    for (let i = 0; i < 500; i++) {
      const code = generateRoomCode();
      expect(roomCodeSchema.safeParse(code).success).toBe(true);
      expect(code).not.toMatch(/[ILO]/);
    }
  });

  it('uses the random source it is given', () => {
    expect(generateRoomCode(() => 0)).toBe('AAAA');
  });
});

describe('generateToken', () => {
  it('returns 48 hex characters and differs each time', () => {
    const a = generateToken();
    expect(a).toMatch(/^[0-9a-f]{48}$/);
    expect(generateToken()).not.toBe(a);
  });
});
