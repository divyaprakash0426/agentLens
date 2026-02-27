import { AgentLensError, type AgentAction, type ExecutionConfig } from './types';
import { delay, getElementCenter, isElementVisible } from './utils';

interface DOMExecutorHooks {
  typingSpeed?: number;
  onClick?: (element: HTMLElement) => void;
  onType?: (element: HTMLElement, char: string, currentValue: string) => void;
  onNavigate?: (url: string) => void;
}

export class DOMExecutor {
  constructor(
    private config: ExecutionConfig,
    private hooks: DOMExecutorHooks = {}
  ) {}

  updateConfig(config: Partial<ExecutionConfig>, hooks: Partial<DOMExecutorHooks> = {}): void {
    this.config = { ...this.config, ...config };
    this.hooks = { ...this.hooks, ...hooks };
  }

  async execute(action: AgentAction, element: HTMLElement): Promise<void> {
    try {
      switch (action.type) {
        case 'click':
          await this.executeClick(element);
          return;
        case 'fill':
          await this.executeFill(element, action.value ?? '');
          return;
        case 'highlight':
          await this.executeHighlight(element, action.duration);
          return;
        case 'scroll':
          await this.executeScroll(element, action.scroll);
          return;
        case 'hover':
          await this.executeHover(element);
          return;
        case 'select':
          if (!(element instanceof HTMLSelectElement)) {
            throw new AgentLensError('Select action requires a <select> element.', 'INVALID_ACTION', action);
          }
          await this.executeSelect(element, action.option ?? '');
          return;
        case 'navigate':
          if (!action.url) throw new AgentLensError('Navigate action requires a url.', 'INVALID_ACTION', action);
          await this.executeNavigate(action.url);
          return;
        case 'wait':
          await this.executeWait(action.duration ?? 1000);
          return;
        case 'assert':
          await this.executeAssert(element, action.assert);
          return;
        default:
          throw new AgentLensError(`Unsupported action type: ${(action as { type: string }).type}`, 'INVALID_ACTION', action);
      }
    } catch (error) {
      if (error instanceof AgentLensError) throw error;
      throw new AgentLensError('Failed to execute action.', 'EXECUTION_FAILED', action, error as Error);
    }
  }

  private async executeClick(element: HTMLElement): Promise<void> {
    if (this.config.dispatchEvents === false) {
      element.click();
      this.hooks.onClick?.(element);
      return;
    }

    this.dispatchMouseEvent(element, 'pointerdown');
    this.dispatchMouseEvent(element, 'mousedown');
    this.dispatchMouseEvent(element, 'pointerup');
    this.dispatchMouseEvent(element, 'mouseup');
    this.dispatchMouseEvent(element, 'click');
    this.hooks.onClick?.(element);
  }

  private async executeFill(element: HTMLElement, value: string): Promise<void> {
    const typingSpeed = this.hooks.typingSpeed ?? 50;

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.focus();
      element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

      if (this.config.clearBeforeFill !== false) {
        this.setFormElementValue(element, '');
      }

      for (const char of value) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
        this.setFormElementValue(element, `${element.value}${char}`);
        element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
        this.hooks.onType?.(element, char, element.value);
        await delay(typingSpeed);
      }

      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      return;
    }

    if (element.isContentEditable) {
      element.focus();
      if (this.config.clearBeforeFill !== false) element.textContent = '';
      for (const char of value) {
        element.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
        element.textContent = `${element.textContent ?? ''}${char}`;
        element.dispatchEvent(new InputEvent('input', { bubbles: true, data: char }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
        this.hooks.onType?.(element, char, element.textContent ?? '');
        await delay(typingSpeed);
      }
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      return;
    }

    throw new AgentLensError('Fill action requires an input, textarea, or contentEditable element.', 'INVALID_ACTION');
  }

  private async executeHighlight(_element: HTMLElement, duration = 500): Promise<void> {
    await delay(duration);
  }

  private async executeScroll(element: HTMLElement, scroll?: AgentAction['scroll']): Promise<void> {
    const behavior = (scroll?.behavior ?? this.config.scrollBehavior ?? 'smooth') === 'instant' ? 'auto' : 'smooth';
    const x = scroll?.x ?? 0;
    const y = scroll?.y ?? 0;

    if (x !== 0 || y !== 0) {
      if (element === document.body || element === document.documentElement) {
        window.scrollBy({ left: x, top: y, behavior });
      } else {
        element.scrollBy({ left: x, top: y, behavior });
      }
    } else {
      element.scrollIntoView({ behavior, block: 'center', inline: 'center' });
    }

    await delay(250);
  }

  private async executeHover(element: HTMLElement): Promise<void> {
    this.dispatchMouseEvent(element, 'pointerenter');
    this.dispatchMouseEvent(element, 'mouseenter');
    this.dispatchMouseEvent(element, 'mouseover');
    await delay(250);
    this.dispatchMouseEvent(element, 'mouseout');
    this.dispatchMouseEvent(element, 'mouseleave');
  }

  private async executeSelect(element: HTMLSelectElement, optionValue: string): Promise<void> {
    element.focus();
    const options = Array.from(element.options);
    const match = options.find((opt) => opt.value === optionValue || opt.text === optionValue);
    if (!match) throw new AgentLensError(`Option "${optionValue}" was not found in select element.`, 'INVALID_ACTION');

    element.value = match.value;
    if (this.config.dispatchEvents !== false) {
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  private async executeNavigate(url: string): Promise<void> {
    const target = new URL(url, window.location.href);
    this.hooks.onNavigate?.(target.toString());

    if (target.origin === window.location.origin) {
      window.history.pushState({}, '', target.toString());
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }

    window.location.assign(target.toString());
  }

  private async executeWait(duration: number): Promise<void> {
    await delay(Math.max(0, duration));
  }

  private async executeAssert(element: HTMLElement, assert: AgentAction['assert']): Promise<void> {
    if (!assert) return;

    if (assert.visible !== undefined) {
      const visible = isElementVisible(element);
      if (visible !== assert.visible) {
        throw new AgentLensError('Assert visible check failed.', 'EXECUTION_FAILED');
      }
    }

    if (assert.text !== undefined) {
      const text = element.textContent ?? '';
      if (!text.includes(assert.text)) {
        throw new AgentLensError(`Assert text failed. Expected to include "${assert.text}".`, 'EXECUTION_FAILED');
      }
    }

    if (assert.attribute) {
      const attributeValue = element.getAttribute(assert.attribute.name);
      if (attributeValue !== assert.attribute.value) {
        throw new AgentLensError(
          `Assert attribute failed for "${assert.attribute.name}".`,
          'EXECUTION_FAILED'
        );
      }
    }
  }

  private setFormElementValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');

    if (descriptor?.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }

    if (this.config.dispatchEvents !== false) {
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  private dispatchMouseEvent(
    element: HTMLElement,
    type: string,
    options: { clientX?: number; clientY?: number } = {}
  ): void {
    const ownerWindow = element.ownerDocument.defaultView ?? window;
    const [centerX, centerY] = getElementCenter(element);
    const eventInit: MouseEventInit = {
      bubbles: true,
      cancelable: true,
      clientX: options.clientX ?? centerX,
      clientY: options.clientY ?? centerY
    };

    if (type.startsWith('pointer') && typeof ownerWindow.PointerEvent === 'function') {
      element.dispatchEvent(new ownerWindow.PointerEvent(type, { ...eventInit, pointerType: 'mouse' }));
      return;
    }

    const fallbackType = type.startsWith('pointer') ? type.replace('pointer', 'mouse') : type;
    element.dispatchEvent(new ownerWindow.MouseEvent(fallbackType, eventInit));
  }
}
