import { ACTION_TYPES } from './constants';
import type { ActionType, AgentAction, ParserFormat } from './types';

const ACTION_TYPE_SET = new Set<ActionType>(ACTION_TYPES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeParseJSON(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeActionCandidate(candidate: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...candidate };
  if ((normalized.type === 'navigate' || normalized.type === 'wait') && typeof normalized.selector !== 'string') {
    normalized.selector = 'body';
  }
  return normalized;
}

function normalizeParsedAction(action: AgentAction): AgentAction {
  return {
    ...action,
    selector: action.selector.trim() || 'body'
  };
}

function uniqueActions(actions: AgentAction[]): AgentAction[] {
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

function extractJsonObjects(text: string): string[] {
  const blocks: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaping = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

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
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        blocks.push(text.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return blocks;
}

export class ActionParser {
  static parse(text: string, format: ParserFormat = 'generic'): AgentAction[] {
    if (format === 'gemini') return this.parseGemini(text);
    return this.parseGenericText(text);
  }

  static parseGemini(text: string): AgentAction[] {
    const actions: AgentAction[] = [];
    const pattern = /\[ACTION\]([\s\S]*?)\[\/ACTION\]/g;

    for (const match of text.matchAll(pattern)) {
      const payload = match[1]?.trim();
      if (!payload) continue;
      const parsed = safeParseJSON(payload);
      actions.push(...this.extractActions(parsed));
    }

    return uniqueActions(actions);
  }

  static parseOpenAI(toolCalls: Array<{ function: { name: string; arguments: string } }>): AgentAction[] {
    const actions: AgentAction[] = [];
    for (const toolCall of toolCalls) {
      if (toolCall.function.name !== 'browser_action') continue;
      const parsed = safeParseJSON(toolCall.function.arguments);
      actions.push(...this.extractActions(parsed));
    }
    return uniqueActions(actions);
  }

  static parseAnthropic(contentBlocks: Array<{ type: string; name: string; input: unknown }>): AgentAction[] {
    const actions: AgentAction[] = [];
    for (const block of contentBlocks) {
      if (block.type !== 'tool_use' || block.name !== 'browser_action') continue;
      actions.push(...this.extractActions(block.input));
    }
    return uniqueActions(actions);
  }

  static validate(action: unknown): action is AgentAction {
    if (!isRecord(action)) return false;
    if (typeof action.type !== 'string' || !ACTION_TYPE_SET.has(action.type as ActionType)) return false;
    if (typeof action.selector !== 'string' || action.selector.trim().length === 0) return false;

    if (action.type === 'fill' && typeof action.value !== 'string') return false;
    if (action.type === 'select' && typeof action.option !== 'string') return false;
    if (action.type === 'navigate' && typeof action.url !== 'string') return false;
    if (action.type === 'wait' && (typeof action.duration !== 'number' || !Number.isFinite(action.duration))) {
      return false;
    }

    return true;
  }

  static getSystemPrompt(format: 'gemini' | 'openai' | 'anthropic'): string {
    if (format === 'gemini') {
      return [
        'When you want to perform a UI action, include:',
        '[ACTION]{"type":"click","selector":"#element-id","description":"Clicking save"}[/ACTION]',
        'Supported types: click, fill, highlight, scroll, hover, select, navigate, wait, assert.'
      ].join('\n');
    }

    if (format === 'openai') {
      return JSON.stringify(
        {
          type: 'function',
          function: {
            name: 'browser_action',
            description: 'Perform a visible action on the user page',
            parameters: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                selector: { type: 'string' },
                value: { type: 'string' },
                url: { type: 'string' },
                description: { type: 'string' }
              },
              required: ['type', 'selector']
            }
          }
        },
        null,
        2
      );
    }

    return [
      'Use a tool named "browser_action".',
      'Provide input JSON with keys: type, selector, value, url, description.',
      'Emit one tool call per action.'
    ].join('\n');
  }

  private static parseGenericText(text: string): AgentAction[] {
    const actions: AgentAction[] = [];

    actions.push(...this.parseGemini(text));

    const fencedBlockPattern = /```(?:action|json)?\s*([\s\S]*?)```/g;
    for (const match of text.matchAll(fencedBlockPattern)) {
      const payload = match[1]?.trim();
      if (!payload) continue;
      const parsed = safeParseJSON(payload);
      actions.push(...this.extractActions(parsed));
    }

    for (const block of extractJsonObjects(text)) {
      const parsed = safeParseJSON(block);
      actions.push(...this.extractActions(parsed));
    }

    return uniqueActions(actions);
  }

  private static extractActions(value: unknown): AgentAction[] {
    if (Array.isArray(value)) return value.flatMap((item) => this.extractActions(item));
    if (!isRecord(value)) return [];

    const normalizedCandidate = normalizeActionCandidate(value);
    if (this.validate(normalizedCandidate)) return [normalizeParsedAction(normalizedCandidate)];

    const nested: AgentAction[] = [];

    if ('input' in value) nested.push(...this.extractActions(value.input));
    if ('action' in value) nested.push(...this.extractActions(value.action));
    if ('actions' in value) nested.push(...this.extractActions(value.actions));

    if ('arguments' in value && typeof value.arguments === 'string') {
      nested.push(...this.extractActions(safeParseJSON(value.arguments)));
    }

    if ('function' in value && isRecord(value.function)) {
      nested.push(...this.extractActions(value.function.arguments));
      nested.push(...this.extractActions(safeParseJSON(String(value.function.arguments ?? ''))));
    }

    if ('tool' in value && value.tool === 'browser_action' && 'input' in value) {
      nested.push(...this.extractActions(value.input));
    }

    return nested;
  }
}
