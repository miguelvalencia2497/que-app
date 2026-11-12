// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { RoomCodeInput, sanitizeRoomCode } from './RoomCodeInput';

function Harness() {
  const [code, setCode] = useState('');
  return <RoomCodeInput value={code} onChange={setCode} />;
}

describe('sanitizeRoomCode', () => {
  it('upper-cases, drops invalid characters and caps the length', () => {
    expect(sanitizeRoomCode('kw z-p!')).toBe('KWZP');
    expect(sanitizeRoomCode('abcdef')).toBe('ABCD');
    expect(sanitizeRoomCode('oil')).toBe('');
  });
});

describe('RoomCodeInput', () => {
  it('turns typed text into a clean code', async () => {
    render(<Harness />);
    const input = screen.getByRole('textbox', { name: 'Room code' });
    await userEvent.type(input, 'kw1zpq');
    expect(input).toHaveValue('KWZP');
  });

  it('accepts a pasted code', async () => {
    render(<Harness />);
    const input = screen.getByRole('textbox', { name: 'Room code' });
    await userEvent.click(input);
    await userEvent.paste(' kwzp ');
    expect(input).toHaveValue('KWZP');
  });
});
