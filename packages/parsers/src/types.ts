export type ActionType =
  | 'click'
  | 'fill'
  | 'highlight'
  | 'scroll'
  | 'hover'
  | 'select'
  | 'navigate'
  | 'wait'
  | 'assert';

export interface AgentAction {
  id?: string;
  type: ActionType;
  selector: string;
  value?: string;
  url?: string;
  scroll?: { x?: number; y?: number; behavior?: 'smooth' | 'instant' };
  option?: string;
  assert?: { visible?: boolean; text?: string; attribute?: { name: string; value: string } };
  duration?: number;
  description?: string;
  meta?: Record<string, unknown>;
}
