// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { QueueItem } from '../../shared/types';
import { formatDuration, QueueRow } from './QueueRow';

const item: QueueItem = {
  id: 'item-1',
  videoId: 'dQw4w9WgXcQ',
  title: 'Dogs who forgot how to dog',
  channel: 'Channel',
  durationSec: 252,
  thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
  addedBy: 'ana-12345',
  addedByName: 'Ana',
  color: 'mint',
  addedAt: 0,
};

function renderRow(props: { isMine?: boolean; canRemove?: boolean } = {}) {
  const onRemove = vi.fn();
  render(
    <ul>
      <QueueRow
        item={item}
        isMine={props.isMine ?? false}
        canRemove={props.canRemove ?? false}
        onRemove={onRemove}
      />
    </ul>,
  );
  return { onRemove };
}

describe('QueueRow', () => {
  it('shows the title, who added it and the duration', () => {
    renderRow();
    expect(screen.getByText('Dogs who forgot how to dog')).toBeInTheDocument();
    expect(screen.getByText('Ana · 4:12')).toBeInTheDocument();
  });

  it('says "You" for your own video', () => {
    renderRow({ isMine: true, canRemove: true });
    expect(screen.getByText('You · 4:12')).toBeInTheDocument();
  });

  it('hides the remove button when you can’t remove it', () => {
    renderRow({ canRemove: false });
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('calls onRemove with the item id', async () => {
    const { onRemove } = renderRow({ canRemove: true });
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove Dogs who forgot how to dog' }),
    );
    expect(onRemove).toHaveBeenCalledWith('item-1');
  });
});

describe('formatDuration', () => {
  it.each([
    [45, '0:45'],
    [252, '4:12'],
    [3723, '1:02:03'],
  ])('%i → %s', (sec, text) => {
    expect(formatDuration(sec)).toBe(text);
  });
});
