import { useContext } from 'react';
import { AgentLensContext } from './AgentLensProvider';

export function useAgentLens() {
  const lens = useContext(AgentLensContext);
  if (!lens) {
    throw new Error('useAgentLens must be used within an AgentLensProvider.');
  }
  return lens;
}
