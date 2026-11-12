// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddVideoForm } from './AddVideoForm';

function setup() {
  const onAdd = vi.fn();
  render(<AddVideoForm onAdd={onAdd} />);
  const input = screen.getByRole('textbox', { name: 'YouTube link' });
  const submit = screen.getByRole('button', { name: 'Add a video' });
  return { onAdd, input, submit };
}

describe('AddVideoForm', () => {
  it('sends the video id from a pasted link and clears the field', async () => {
    const { onAdd, input, submit } = setup();
    await userEvent.type(input, 'https://youtu.be/dQw4w9WgXcQ');
    await userEvent.click(submit);
    expect(onAdd).toHaveBeenCalledWith('dQw4w9WgXcQ');
    expect(input).toHaveValue('');
  });

  it('asks for a link when the field is empty', async () => {
    const { onAdd, submit } = setup();
    await userEvent.click(submit);
    expect(screen.getByRole('alert')).toHaveTextContent('Paste a YouTube link first.');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('explains when the text isn’t a YouTube link, and clears the error on edit', async () => {
    const { onAdd, input, submit } = setup();
    await userEvent.type(input, 'cat piano');
    await userEvent.click(submit);
    expect(screen.getByRole('alert')).toHaveTextContent('isn’t a YouTube video link');
    expect(onAdd).not.toHaveBeenCalled();
    await userEvent.type(input, 's');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
