import type { AgentAction } from './types';
import { extractNestedActions, uniqueActions } from './shared';

export interface AnthropicBlock {
  type?: string;
  name?: string;
  input?: unknown;
}

export function parseAnthropicActions(contentBlocks: AnthropicBlock[] | unknown): AgentAction[] {
  if (!Array.isArray(contentBlocks)) {
    return uniqueActions(extractNestedActions(contentBlocks));
  }

  const actions: AgentAction[] = [];
  for (const block of contentBlocks) {
    if (block.type === 'tool_use' && block.name && block.name !== 'browser_action') continue;
    actions.push(...extractNestedActions(block.input));
  }
  return uniqueActions(actions);
}
