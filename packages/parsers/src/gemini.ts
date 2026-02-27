import type { AgentAction } from './types';
import { extractNestedActions, safeParseJSON, uniqueActions } from './shared';

export function parseGeminiActions(text: string): AgentAction[] {
  const pattern = /\[ACTION\]([\s\S]*?)\[\/ACTION\]/g;
  const actions: AgentAction[] = [];

  for (const match of text.matchAll(pattern)) {
    const payload = match[1]?.trim();
    if (!payload) continue;
    const parsed = safeParseJSON(payload);
    actions.push(...extractNestedActions(parsed));
  }

  return uniqueActions(actions);
}
