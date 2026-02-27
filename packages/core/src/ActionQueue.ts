import type { AgentAction } from './types';
import { EventEmitter, toArray } from './utils';

export interface QueueState {
  pending: AgentAction[];
  current: AgentAction | null;
  processed: number;
}

interface QueueEvents {
  enqueue: (actions: AgentAction[], state: QueueState) => void;
  dequeue: (action: AgentAction, state: QueueState) => void;
  clear: (state: QueueState) => void;
  empty: (state: QueueState) => void;
}

export class ActionQueue extends EventEmitter<QueueEvents> {
  private queue: AgentAction[] = [];
  private processedCount = 0;
  private currentAction: AgentAction | null = null;

  enqueue(actions: AgentAction | AgentAction[]): void {
    const list = toArray(actions);
    if (list.length === 0) return;
    this.queue.push(...list);
    this.emit('enqueue', list, this.getState());
  }

  dequeue(): AgentAction | undefined {
    const action = this.queue.shift();
    if (!action) {
      if (this.queue.length === 0 && this.currentAction === null) this.emit('empty', this.getState());
      return undefined;
    }

    this.currentAction = action;
    this.processedCount += 1;
    this.emit('dequeue', action, this.getState());
    return action;
  }

  completeCurrent(): void {
    this.currentAction = null;
    if (this.queue.length === 0) this.emit('empty', this.getState());
  }

  peek(): AgentAction | undefined {
    return this.queue[0];
  }

  hasNext(): boolean {
    return this.queue.length > 0;
  }

  get length(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.emit('clear', this.getState());
    if (this.currentAction === null) this.emit('empty', this.getState());
  }

  prepend(actions: AgentAction | AgentAction[]): void {
    const list = toArray(actions);
    if (list.length === 0) return;
    this.queue = [...list, ...this.queue];
    this.emit('enqueue', list, this.getState());
  }

  getState(): QueueState {
    return {
      pending: [...this.queue],
      current: this.currentAction,
      processed: this.processedCount
    };
  }
}
