import type { AgentAction } from './types';
import { extractNestedActions, parseJsonObjects, safeParseJSON, uniqueActions } from './shared';
import { parseGeminiActions } from './gemini';

export function parseGenericActions(text: string): AgentAction[] {
  const actions: AgentAction[] = [];

  actions.push(...parseGeminiActions(text));

  const fencedPattern = /```(?:action|json)?\s*([\s\S]*?)```/g;
  for (const match of text.matchAll(fencedPattern)) {
    const payload = match[1]?.trim();
    if (!payload) continue;
    actions.push(...extractNestedActions(safeParseJSON(payload)));
  }

  for (const candidate of parseJsonObjects(text)) {
    actions.push(...extractNestedActions(candidate));
  }

  return uniqueActions(actions);
}
