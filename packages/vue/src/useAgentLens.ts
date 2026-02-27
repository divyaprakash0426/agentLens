import { inject } from 'vue';
import { AgentLensKey } from './context';

export function useAgentLens() {
  const lens = inject(AgentLensKey);
  if (!lens) {
    throw new Error('useAgentLens must be used within AgentLensProvider.');
  }
  return lens;
}
