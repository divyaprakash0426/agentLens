import type { AgentAction } from './types';
import { extractNestedActions, safeParseJSON, uniqueActions } from './shared';

export interface OpenAIToolCall {
  function?: {
    name?: string;
    arguments?: string;
  };
}

export function parseOpenAIActions(toolCalls: OpenAIToolCall[] | string): AgentAction[] {
  if (typeof toolCalls === 'string') {
    return uniqueActions(extractNestedActions(safeParseJSON(toolCalls)));
  }

  const actions: AgentAction[] = [];
  for (const call of toolCalls) {
    if (call.function?.name && call.function.name !== 'browser_action') continue;
    actions.push(...extractNestedActions(safeParseJSON(call.function?.arguments ?? '')));
  }

  return uniqueActions(actions);
}
