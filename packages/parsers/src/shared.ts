import type { ActionType, AgentAction } from './types';

const ACTION_TYPES = new Set<ActionType>([
  'click',
  'fill',
  'highlight',
  'scroll',
  'hover',
  'select',
  'navigate',
  'wait',
  'assert'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function safeParseJSON(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function parseJsonObjects(text: string): unknown[] {
  const objects: unknown[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaping = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (char === '\\') {
        escaping = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        const parsed = safeParseJSON(text.slice(start, i + 1));
        if (parsed) objects.push(parsed);
        start = -1;
      }
    }
  }

  return objects;
}

export function normalizeAction(candidate: unknown): AgentAction | null {
  if (!isRecord(candidate)) return null;

  const action = { ...candidate };
  if ((action.type === 'navigate' || action.type === 'wait') && typeof action.selector !== 'string') {
    action.selector = 'body';
  }

  if (!isRecord(action)) return null;
  if (typeof action.type !== 'string' || !ACTION_TYPES.has(action.type as ActionType)) return null;
  if (typeof action.selector !== 'string' || action.selector.trim().length === 0) return null;

  if (action.type === 'fill' && typeof action.value !== 'string') return null;
  if (action.type === 'select' && typeof action.option !== 'string') return null;
  if (action.type === 'navigate' && typeof action.url !== 'string') return null;
  if (action.type === 'wait' && typeof action.duration !== 'number') return null;

  const normalized: AgentAction = {
    type: action.type as ActionType,
    selector: action.selector.trim() || 'body'
  };

  if (typeof action.id === 'string') normalized.id = action.id;
  if (typeof action.value === 'string') normalized.value = action.value;
  if (typeof action.url === 'string') normalized.url = action.url;
  if (isRecord(action.scroll)) normalized.scroll = action.scroll as AgentAction['scroll'];
  if (typeof action.option === 'string') normalized.option = action.option;
  if (isRecord(action.assert)) normalized.assert = action.assert as AgentAction['assert'];
  if (typeof action.duration === 'number') normalized.duration = action.duration;
  if (typeof action.description === 'string') normalized.description = action.description;
  if (isRecord(action.meta)) normalized.meta = action.meta;

  return normalized;
}

export function uniqueActions(actions: AgentAction[]): AgentAction[] {
  const seen = new Set<string>();
  const output: AgentAction[] = [];
  for (const action of actions) {
    const key = JSON.stringify(action);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(action);
  }
  return output;
}

export function extractNestedActions(value: unknown): AgentAction[] {
  if (Array.isArray(value)) return value.flatMap((item) => extractNestedActions(item));

  const normalized = normalizeAction(value);
  if (normalized) return [normalized];

  if (!isRecord(value)) return [];
  const nested: AgentAction[] = [];

  if ('input' in value) nested.push(...extractNestedActions(value.input));
  if ('action' in value) nested.push(...extractNestedActions(value.action));
  if ('actions' in value) nested.push(...extractNestedActions(value.actions));

  if ('arguments' in value && typeof value.arguments === 'string') {
    nested.push(...extractNestedActions(safeParseJSON(value.arguments)));
  }

  if ('function' in value && isRecord(value.function) && 'arguments' in value.function) {
    nested.push(...extractNestedActions(value.function.arguments));
    if (typeof value.function.arguments === 'string') {
      nested.push(...extractNestedActions(safeParseJSON(value.function.arguments)));
    }
  }

  return nested;
}
