import type { AgentAction, AgentLens as AgentLensType, ParserFormat } from 'agentlens-core';
import { useContext } from 'react';
import { AgentLensContext } from './AgentLensProvider';

const serverQueueState = {
  pending: [],
  current: null,
  processed: 0
};

const serverLensStub: AgentLensType = {
  enqueue: () => {},
  parseAndEnqueue: (_text: string, _format?: ParserFormat): AgentAction[] => [],
  execute: async () => {},
  pause: () => {},
  resume: () => {},
  abort: () => {},
  clearQueue: () => {},
  getQueueState: () => serverQueueState,
  moveCursorTo: async () => {},
  spotlightElement: async () => {},
  configure: () => {},
  destroy: () => {}
} as AgentLensType;

export function useAgentLens() {
  const lens = useContext(AgentLensContext);
  if (!lens) {
    if (typeof window === 'undefined') {
      return serverLensStub;
    }
    throw new Error('useAgentLens must be used within an AgentLensProvider.');
  }
  return lens;
}
