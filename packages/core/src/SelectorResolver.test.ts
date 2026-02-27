import { describe, expect, it } from 'vitest';
import { SelectorResolver } from './SelectorResolver';
import type { ExecutionConfig } from './types';

const executionConfig: ExecutionConfig = {
  retry: { attempts: 1, delay: 0 },
  selectorTimeout: 50
};

describe('SelectorResolver', () => {
  it('resolves standard CSS selectors', async () => {
    document.body.innerHTML = `<button id="save-btn">Save</button>`;
    const resolver = new SelectorResolver(executionConfig);
    const element = await resolver.resolve('#save-btn');
    expect(element?.id).toBe('save-btn');
  });

  it('resolves text selector strategy', async () => {
    document.body.innerHTML = `<button>Submit Application</button>`;
    const resolver = new SelectorResolver(executionConfig);
    const element = await resolver.resolve('text:Submit Application');
    expect(element?.tagName).toBe('BUTTON');
  });

  it('resolves data-agentlens strategy', async () => {
    document.body.innerHTML = `<button data-agentlens="cta">Go</button>`;
    const resolver = new SelectorResolver(executionConfig);
    const element = await resolver.resolve('data-agentlens:cta');
    expect(element?.getAttribute('data-agentlens')).toBe('cta');
  });

  it('resolves XPath selectors', async () => {
    document.body.innerHTML = `<div><button id="x-btn">XPath</button></div>`;
    const resolver = new SelectorResolver(executionConfig);
    const element = await resolver.resolve('xpath://button[@id="x-btn"]');
    expect(element?.id).toBe('x-btn');
  });

  it('resolves fuzzy text selectors', async () => {
    document.body.innerHTML = `<button>Continue to checkout</button>`;
    const resolver = new SelectorResolver(executionConfig);
    const element = await resolver.resolve('fuzzy:checkout');
    expect(element?.tagName).toBe('BUTTON');
  });
});
