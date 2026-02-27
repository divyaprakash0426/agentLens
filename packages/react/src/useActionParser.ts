import type { AgentAction, ParserFormat } from 'agentlens-core';
import { useCallback } from 'react';
import { useAgentLens } from './useAgentLens';

export function useActionParser(format: ParserFormat = 'generic') {
  const lens = useAgentLens();

  return useCallback(
    (text: string): AgentAction[] => {
      return lens.parseAndEnqueue(text, format);
    },
    [format, lens]
  );
}
