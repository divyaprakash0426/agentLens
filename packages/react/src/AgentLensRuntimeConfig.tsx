import type { AgentLensConfig } from 'agentlens-core';
import { useEffect } from 'react';
import { useAgentLens } from './useAgentLens';

export interface AgentLensRuntimeConfigProps {
  config: Partial<AgentLensConfig>;
}

/**
 * Applies runtime config updates from a client component.
 * Useful in frameworks like Next.js where function props cannot cross
 * the server/client boundary via Server Components.
 */
export function AgentLensRuntimeConfig({ config }: AgentLensRuntimeConfigProps) {
  const lens = useAgentLens();

  useEffect(() => {
    lens.configure(config);
  }, [config, lens]);

  return null;
}
