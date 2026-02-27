import { describe, expect, it } from 'vitest';
import { AgentLens } from './AgentLens';

describe('AgentLens', () => {
  it('processes queue and fires callbacks', async () => {
    document.body.innerHTML = `<button id="submit">Submit</button>`;
    let completed = 0;

    await new Promise<void>((resolve) => {
      const lens = new AgentLens({
        execution: {
          executeActions: false,
          scrollIntoView: false,
          retry: { attempts: 1, delay: 0 },
          selectorTimeout: 100
        },
        timing: {
          preAnimationDelay: 0,
          cursorAnimationDuration: 0,
          preExecutionDelay: 0,
          postActionSpotlightDuration: 0,
          interActionDelay: 0
        },
        on: {
          onActionComplete: () => {
            completed += 1;
          },
          onQueueEmpty: () => {
            lens.destroy();
            resolve();
          }
        }
      });

      lens.enqueue({ type: 'click', selector: '#submit' });
    });

    expect(completed).toBe(1);
  });
});
