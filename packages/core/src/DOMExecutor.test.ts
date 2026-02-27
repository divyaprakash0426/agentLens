import { describe, expect, it } from 'vitest';
import { DOMExecutor } from './DOMExecutor';
import type { AgentAction, ExecutionConfig } from './types';

const executionConfig: ExecutionConfig = {
  dispatchEvents: true,
  clearBeforeFill: true
};

describe('DOMExecutor', () => {
  it('dispatches click events', async () => {
    document.body.innerHTML = `<button id="clicker">Click</button>`;
    const button = document.querySelector<HTMLButtonElement>('#clicker');
    expect(button).toBeTruthy();
    let clicked = false;
    button!.addEventListener('click', () => {
      clicked = true;
    });

    const executor = new DOMExecutor(executionConfig);
    const action: AgentAction = { type: 'click', selector: '#clicker' };
    await executor.execute(action, button!);
    expect(clicked).toBe(true);
  });

  it('fills input values with typing simulation', async () => {
    document.body.innerHTML = `<input id="email" />`;
    const input = document.querySelector<HTMLInputElement>('#email');
    expect(input).toBeTruthy();

    const executor = new DOMExecutor(executionConfig, { typingSpeed: 0 });
    const action: AgentAction = { type: 'fill', selector: '#email', value: 'user@example.com' };
    await executor.execute(action, input!);
    expect(input!.value).toBe('user@example.com');
  });

  it('selects option by value', async () => {
    document.body.innerHTML = `
      <select id="role">
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
    `;
    const select = document.querySelector<HTMLSelectElement>('#role');
    expect(select).toBeTruthy();

    const executor = new DOMExecutor(executionConfig);
    const action: AgentAction = { type: 'select', selector: '#role', option: 'admin' };
    await executor.execute(action, select!);
    expect(select!.value).toBe('admin');
  });

  it('handles wait and assert actions', async () => {
    document.body.innerHTML = `<div id="status" data-state="ready">Ready now</div>`;
    const status = document.querySelector<HTMLElement>('#status');
    expect(status).toBeTruthy();

    const executor = new DOMExecutor(executionConfig);
    await executor.execute({ type: 'wait', selector: 'body', duration: 0 }, document.body);
    await executor.execute(
      {
        type: 'assert',
        selector: '#status',
        assert: { text: 'Ready', attribute: { name: 'data-state', value: 'ready' }, visible: true }
      },
      status!
    );
  });

  it('uses onNavigate hook for same-origin navigation', async () => {
    let navigatedTo: string | null = null;
    const executor = new DOMExecutor(executionConfig, {
      onNavigate: (url) => {
        navigatedTo = url;
      }
    });

    await executor.execute({ type: 'navigate', selector: 'body', url: '/checkout' }, document.body);
    expect(navigatedTo).toContain('/checkout');
  });
});
