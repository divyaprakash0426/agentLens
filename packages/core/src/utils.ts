import type { AgentAction } from './types';

type Listener = (...args: any[]) => void;
export class EventEmitter<Events extends { [K in keyof Events]: Listener }> {
  private listeners = new Map<keyof Events, Set<Listener>>();

  on<K extends keyof Events>(event: K, listener: Events[K]): () => void {
    const current = this.listeners.get(event) ?? new Set<Listener>();
    current.add(listener as Listener);
    this.listeners.set(event, current);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: Events[K]): void {
    const current = this.listeners.get(event);
    if (!current) return;
    current.delete(listener as Listener);
    if (current.size === 0) this.listeners.delete(event);
  }

  emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void {
    const current = this.listeners.get(event);
    if (!current) return;
    for (const listener of current) {
      (listener as (...innerArgs: Parameters<Events[K]>) => void)(...args);
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  if (signal?.aborted) {
    return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'));
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    };

    signal?.addEventListener('abort', onAbort);
  });
}

export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateActionId(prefix = 'action'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeSelector(action: AgentAction): AgentAction {
  if (action.selector?.trim()) return action;
  return {
    ...action,
    selector: 'body'
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function mergeConfig<T extends Record<string, unknown>>(base: T, override?: Partial<T>): T {
  if (!override) return structuredClone(base);

  const result = structuredClone(base) as Record<string, unknown>;

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;

    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeConfig(result[key] as Record<string, unknown>, value);
      continue;
    }

    result[key] = value;
  }

  return result as T;
}

export function getElementCenter(element: HTMLElement): [number, number] {
  const rect = element.getBoundingClientRect();
  return [rect.left + rect.width / 2, rect.top + rect.height / 2];
}

export function isElementVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = element.getBoundingClientRect();
  if (rect.width > 0 || rect.height > 0) return true;
  return element.isConnected;
}

export function isElementDisabled(element: HTMLElement): boolean {
  return 'disabled' in element && Boolean((element as HTMLButtonElement | HTMLInputElement).disabled);
}
