import type { ExecutionConfig } from './types';
import { delay, getElementCenter, isElementDisabled, isElementVisible } from './utils';

export class SelectorResolver {
  constructor(
    private config: ExecutionConfig,
    private customResolver?: (selector: string) => HTMLElement | null
  ) {}

  async resolve(selector: string): Promise<HTMLElement | null> {
    const retry = this.config.retry ?? { attempts: 3, delay: 500 };
    const timeout = this.config.selectorTimeout ?? 5000;
    const attempts = Math.max(1, retry.attempts);
    const startedAt = Date.now();

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const element = this.resolveOnce(selector);
      if (element && this.isInteractable(element)) return element;

      const elapsed = Date.now() - startedAt;
      const remaining = timeout - elapsed;
      if (remaining <= 0 || attempt === attempts) break;
      await delay(Math.min(retry.delay, remaining));
    }

    return null;
  }

  resolveAll(selector: string): HTMLElement[] {
    const normalized = selector.trim();
    if (normalized.startsWith('xpath:')) {
      const found = this.queryXPathAll(normalized.slice(6).trim());
      return found;
    }

    if (normalized.startsWith('text:')) {
      const element = this.resolveByText(normalized.slice(5).trim(), false);
      return element ? [element] : [];
    }

    if (normalized.startsWith('fuzzy:')) {
      const element = this.resolveByText(normalized.slice(6).trim(), true);
      return element ? [element] : [];
    }

    return Array.from(document.querySelectorAll<HTMLElement>(normalized));
  }

  private resolveOnce(selector: string): HTMLElement | null {
    const normalized = selector.trim();

    if (this.customResolver) {
      const custom = this.customResolver(normalized);
      if (custom) return custom;
    }

    if (normalized.startsWith('data-agentlens:')) {
      const value = normalized.slice('data-agentlens:'.length).trim();
      if (value) return document.querySelector<HTMLElement>(`[data-agentlens="${this.escapeSelectorValue(value)}"]`);
    }

    if (normalized.startsWith('xpath:')) {
      return this.queryXPath(normalized.slice(6).trim());
    }

    if (normalized.startsWith('text:')) {
      return this.resolveByText(normalized.slice(5).trim(), false);
    }

    if (normalized.startsWith('fuzzy:')) {
      return this.resolveByText(normalized.slice(6).trim(), true);
    }

    const cssMatch = document.querySelector<HTMLElement>(normalized);
    if (cssMatch) return cssMatch;

    const ariaLabel = document.querySelector<HTMLElement>(`[aria-label="${this.escapeSelectorValue(normalized)}"]`);
    if (ariaLabel) return ariaLabel;

    const testId = document.querySelector<HTMLElement>(`[data-testid="${this.escapeSelectorValue(normalized)}"]`);
    if (testId) return testId;

    return null;
  }

  private queryXPath(xpath: string): HTMLElement | null {
    if (!xpath) return null;
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue instanceof HTMLElement ? result.singleNodeValue : null;
  }

  private queryXPathAll(xpath: string): HTMLElement[] {
    if (!xpath) return [];
    const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    const nodes: HTMLElement[] = [];
    for (let index = 0; index < result.snapshotLength; index += 1) {
      const node = result.snapshotItem(index);
      if (node instanceof HTMLElement) nodes.push(node);
    }
    return nodes;
  }

  private resolveByText(targetText: string, fuzzy: boolean): HTMLElement | null {
    if (!targetText) return null;
    const wanted = fuzzy ? targetText.toLowerCase() : targetText;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let best: HTMLElement | null = null;

    let current = walker.nextNode();
    while (current) {
      if (current instanceof HTMLElement) {
        const text = (current.innerText ?? current.textContent ?? '').trim();
        if (text) {
          const candidate = fuzzy ? text.toLowerCase() : text;
          const matches = fuzzy ? candidate.includes(wanted) : candidate === wanted;
          if (matches && (!best || current.textContent!.length < best.textContent!.length)) {
            best = current;
          }
        }
      }
      current = walker.nextNode();
    }

    return best;
  }

  private isInteractable(element: HTMLElement): boolean {
    if (!isElementVisible(element) || isElementDisabled(element)) return false;

    if (typeof document.elementFromPoint !== 'function') return true;
    const [x, y] = SelectorResolver.getElementCenter(element);
    const topElement = document.elementFromPoint(x, y);
    if (!topElement) return true;

    return topElement === element || element.contains(topElement);
  }

  private escapeSelectorValue(value: string): string {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(value);
    }
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  static getElementCenter(element: HTMLElement): [number, number] {
    return getElementCenter(element);
  }
}
