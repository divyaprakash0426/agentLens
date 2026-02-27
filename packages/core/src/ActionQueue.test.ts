import { describe, expect, it } from 'vitest';
import { ActionQueue } from './ActionQueue';
import type { AgentAction } from './types';

const click = (selector: string): AgentAction => ({ type: 'click', selector });

describe('ActionQueue', () => {
  it('keeps FIFO ordering', () => {
    const queue = new ActionQueue();
    queue.enqueue([click('#a'), click('#b')]);

    expect(queue.dequeue()?.selector).toBe('#a');
    queue.completeCurrent();
    expect(queue.dequeue()?.selector).toBe('#b');
    queue.completeCurrent();
    expect(queue.hasNext()).toBe(false);
  });

  it('supports prepend for priority actions', () => {
    const queue = new ActionQueue();
    queue.enqueue(click('#normal'));
    queue.prepend(click('#priority'));

    expect(queue.dequeue()?.selector).toBe('#priority');
    queue.completeCurrent();
    expect(queue.dequeue()?.selector).toBe('#normal');
  });

  it('emits empty after clear with no current action', () => {
    const queue = new ActionQueue();
    let emptyEvents = 0;
    queue.on('empty', () => {
      emptyEvents += 1;
    });

    queue.enqueue([click('#a'), click('#b')]);
    queue.clear();

    expect(queue.length).toBe(0);
    expect(emptyEvents).toBeGreaterThan(0);
  });
});
