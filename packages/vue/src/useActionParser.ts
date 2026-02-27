import type { AgentAction, ParserFormat } from 'agentlens-core';
import { useAgentLens } from './useAgentLens';

export function useActionParser(format: ParserFormat = 'generic') {
  const lens = useAgentLens();
  return (text: string): AgentAction[] => lens.parseAndEnqueue(text, format);
}
