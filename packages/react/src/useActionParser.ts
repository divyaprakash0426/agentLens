import type { AgentAction, ParserFormat } from 'agentlens-core';
import { useCallback } from 'react';
import { useAgentLens } from './useAgentLens';

function isAbortedAgentLensError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as { name?: unknown; code?: unknown };
  return candidate.name === 'AgentLensError' && candidate.code === 'ABORTED';
}

export function useActionParser(format: ParserFormat = 'generic') {
  const lens = useAgentLens();

  return useCallback(
    (text: string): AgentAction[] => {
      try {
        return lens.parseAndEnqueue(text, format);
      } catch (error) {
        if (isAbortedAgentLensError(error)) {
          return [];
        }
        throw error;
      }
    },
    [format, lens]
  );
}
