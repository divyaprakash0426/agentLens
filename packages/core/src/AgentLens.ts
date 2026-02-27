import { ActionParser } from './ActionParser';
import { ActionQueue, type QueueState } from './ActionQueue';
import { DEFAULT_CONFIG, DEFAULT_CURSOR_CONFIG, DEFAULT_EXECUTION_CONFIG, DEFAULT_SPOTLIGHT_CONFIG, DEFAULT_TIMING_CONFIG } from './constants';
import { CursorEngine } from './CursorEngine';
import { DOMExecutor } from './DOMExecutor';
import { SelectorResolver } from './SelectorResolver';
import { SpotlightEngine } from './SpotlightEngine';
import { AgentLensError, type AgentAction, type AgentLensConfig, type EventCallbacks, type ParserFormat } from './types';
import { delay, generateActionId, mergeConfig, normalizeSelector, toArray } from './utils';

interface InternalConfig {
  cursor: NonNullable<AgentLensConfig['cursor']>;
  spotlight: NonNullable<AgentLensConfig['spotlight']>;
  timing: NonNullable<AgentLensConfig['timing']>;
  execution: NonNullable<AgentLensConfig['execution']>;
  on: EventCallbacks;
  selectorResolver?: (selector: string) => HTMLElement | null;
  zIndexBase: number;
  container: HTMLElement;
}

export class AgentLens {
  private queue = new ActionQueue();
  private cursor: CursorEngine;
  private spotlight: SpotlightEngine;
  private executor: DOMExecutor;
  private resolver: SelectorResolver;
  private config: InternalConfig;
  private isProcessing = false;
  private isPaused = false;
  private isDestroyed = false;
  private abortController: AbortController | null = null;

  constructor(config: AgentLensConfig = {}) {
    this.config = this.resolveConfig(config);
    this.cursor = new CursorEngine(this.config.cursor, this.config.container, this.config.on.onCursorMove);
    this.spotlight = new SpotlightEngine(this.config.spotlight, this.config.container, this.config.zIndexBase);
    this.executor = new DOMExecutor(this.config.execution, {
      typingSpeed: this.config.timing.typingSpeed,
      onClick: this.config.on.onClick,
      onType: this.config.on.onType,
      onNavigate: this.config.on.onNavigate
    });
    this.resolver = new SelectorResolver(this.config.execution, this.config.selectorResolver);

    this.queue.on('enqueue', () => {
      if (!this.isProcessing && !this.isPaused && !this.isDestroyed) {
        void this.processQueue();
      }
    });
  }

  enqueue(actions: AgentAction | AgentAction[]): void {
    this.assertNotDestroyed();
    const normalized = toArray(actions).map((action) => this.prepareAction(action));
    this.queue.enqueue(normalized);
    if (!this.isProcessing && !this.isPaused) void this.processQueue();
  }

  parseAndEnqueue(text: string, format: ParserFormat = 'generic'): AgentAction[] {
    this.assertNotDestroyed();
    const actions = ActionParser.parse(text, format).map((action) => this.prepareAction(action));
    if (actions.length > 0) this.enqueue(actions);
    return actions;
  }

  async execute(action: AgentAction): Promise<void> {
    this.assertNotDestroyed();
    const abortController = new AbortController();
    await this.executeAction(this.prepareAction(action), abortController.signal);
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.assertNotDestroyed();
    this.isPaused = false;
    if (!this.isProcessing && this.queue.hasNext()) {
      void this.processQueue();
    }
  }

  abort(): void {
    this.abortController?.abort();
    this.queue.clear();
    this.queue.completeCurrent();
    this.isPaused = false;
    this.isProcessing = false;
    this.spotlight.hide();
    this.cursor.hide();
  }

  clearQueue(): void {
    this.queue.clear();
  }

  getQueueState(): QueueState {
    return this.queue.getState();
  }

  moveCursorTo(x: number, y: number): Promise<void> {
    this.assertNotDestroyed();
    return this.cursor.animateTo([x, y], this.scaledDuration(this.config.timing.cursorAnimationDuration ?? 600));
  }

  async spotlightElement(
    selector: string,
    options: { duration?: number; description?: string } = {}
  ): Promise<void> {
    this.assertNotDestroyed();
    const element = await this.resolver.resolve(selector);
    if (!element) {
      throw new AgentLensError(`Could not find selector "${selector}".`, 'SELECTOR_NOT_FOUND', {
        type: 'highlight',
        selector
      });
    }
    this.spotlight.show(element, {
      type: 'highlight',
      selector,
      description: options.description
    });
    await delay(options.duration ?? this.config.timing.postActionSpotlightDuration ?? 800);
    this.spotlight.hide();
  }

  configure(config: Partial<AgentLensConfig>): void {
    this.assertNotDestroyed();
    this.config = this.resolveConfig(config, this.config);

    this.cursor.updateConfig(this.config.cursor);
    this.spotlight.updateConfig(this.config.spotlight);
    this.executor.updateConfig(this.config.execution, {
      typingSpeed: this.config.timing.typingSpeed,
      onClick: this.config.on.onClick,
      onType: this.config.on.onType,
      onNavigate: this.config.on.onNavigate
    });
    this.resolver = new SelectorResolver(this.config.execution, this.config.selectorResolver);
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.abort();
    this.queue.removeAllListeners();
    this.cursor.destroy();
    this.spotlight.destroy();
    this.isDestroyed = true;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.isDestroyed || this.isPaused) return;

    this.isProcessing = true;
    this.abortController = new AbortController();
    this.config.on.onQueueStart?.();

    try {
      while (this.queue.hasNext() && !this.isDestroyed) {
        await this.waitIfPaused(this.abortController.signal);
        if (this.abortController.signal.aborted) break;

        const action = this.queue.dequeue();
        if (!action) break;

        try {
          await this.executeAction(action, this.abortController.signal);
        } catch (error) {
          if (this.isAbortError(error)) break;
          const agentError =
            error instanceof AgentLensError
              ? error
              : new AgentLensError('Failed while processing action.', 'EXECUTION_FAILED', action, error as Error);
          this.config.on.onActionError?.(action, agentError);
        } finally {
          this.queue.completeCurrent();
        }

        if (this.abortController.signal.aborted) break;
        await delay(this.scaledDuration(this.config.timing.interActionDelay ?? 400), this.abortController.signal);
      }
    } finally {
      this.isProcessing = false;
      this.abortController = null;
      this.cursor.hide();
      this.spotlight.hide();
      this.config.on.onQueueEmpty?.();
    }
  }

  private async executeAction(action: AgentAction, signal?: AbortSignal): Promise<void> {
    const requiresElement = !['navigate', 'wait'].includes(action.type);
    const element = requiresElement ? await this.resolver.resolve(action.selector) : document.body;

    if (!element) {
      this.config.on.onSelectorNotFound?.(action.selector, action);
      throw new AgentLensError(`Selector not found: ${action.selector}`, 'SELECTOR_NOT_FOUND', action);
    }

    const proceed = this.config.on.onActionStart?.(action, element);
    if (proceed === false) return;

    if (requiresElement && this.config.execution.scrollIntoView !== false) {
      element.scrollIntoView({
        behavior: this.config.execution.scrollBehavior === 'instant' ? 'auto' : 'smooth',
        block: 'center',
        inline: 'center'
      });
      await delay(this.scaledDuration(250), signal);
    }

    if (requiresElement) {
      this.spotlight.show(element, action);
      this.config.on.onSpotlight?.(action, element);
      await delay(this.scaledDuration(this.config.timing.preAnimationDelay ?? 200), signal);
      await this.cursor.animateTo(
        SelectorResolver.getElementCenter(element),
        this.scaledDuration(this.config.timing.cursorAnimationDuration ?? 600)
      );
      await delay(this.scaledDuration(this.config.timing.preExecutionDelay ?? 300), signal);
    }

    if (this.config.execution.executeActions !== false) {
      await this.executor.execute(action, element);
    }

    if (requiresElement) {
      await delay(this.scaledDuration(this.config.timing.postActionSpotlightDuration ?? 800), signal);
      this.spotlight.hide();
    }

    this.config.on.onActionComplete?.(action, element);
  }

  private prepareAction(action: AgentAction): AgentAction {
    const withSelector = normalizeSelector(action);
    return {
      ...withSelector,
      id: withSelector.id ?? generateActionId()
    };
  }

  private scaledDuration(duration: number): number {
    const speed = this.config.timing.speedMultiplier ?? 1;
    return Math.max(0, duration / Math.max(speed, 0.1));
  }

  private async waitIfPaused(signal: AbortSignal): Promise<void> {
    while (this.isPaused && !signal.aborted && !this.isDestroyed) {
      await delay(50, signal);
    }
  }

  private resolveConfig(next: Partial<AgentLensConfig>, base?: InternalConfig): InternalConfig {
    const baseline = base ?? {
      cursor: { ...DEFAULT_CURSOR_CONFIG },
      spotlight: { ...DEFAULT_SPOTLIGHT_CONFIG },
      timing: { ...DEFAULT_TIMING_CONFIG },
      execution: { ...DEFAULT_EXECUTION_CONFIG },
      on: { ...(DEFAULT_CONFIG.on ?? {}) },
      selectorResolver: DEFAULT_CONFIG.selectorResolver,
      zIndexBase: DEFAULT_CONFIG.zIndexBase ?? 100000,
      container: DEFAULT_CONFIG.container ?? document.body
    };

    const merged = mergeConfig(
      baseline as unknown as Record<string, unknown>,
      next as unknown as Partial<Record<string, unknown>>
    ) as unknown as InternalConfig;

    merged.execution.retry = {
      ...(base?.execution.retry ?? DEFAULT_EXECUTION_CONFIG.retry ?? { attempts: 3, delay: 500 }),
      ...(next.execution?.retry ?? {})
    };
    merged.container = next.container ?? baseline.container ?? document.body;
    merged.zIndexBase = next.zIndexBase ?? baseline.zIndexBase ?? 100000;
    merged.on = { ...(baseline.on ?? {}), ...(next.on ?? {}) };

    return merged;
  }

  private assertNotDestroyed(): void {
    if (this.isDestroyed) {
      throw new AgentLensError('AgentLens instance was destroyed.', 'ABORTED');
    }
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
  }
}
