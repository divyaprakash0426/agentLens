import { AgentLens, type AgentLensConfig } from 'agentlens-core';
import { createContext, type ReactNode, useEffect, useMemo, useRef } from 'react';

export const AgentLensContext = createContext<AgentLens | null>(null);

export interface AgentLensProviderProps {
  config?: AgentLensConfig;
  children: ReactNode;
}

export function AgentLensProvider({ config, children }: AgentLensProviderProps) {
  const lensRef = useRef<AgentLens | null>(null);

  if (!lensRef.current) {
    lensRef.current = new AgentLens(config);
  }

  useEffect(() => {
    if (config) lensRef.current?.configure(config);
  }, [config]);

  useEffect(() => {
    return () => {
      lensRef.current?.destroy();
      lensRef.current = null;
    };
  }, []);

  const value = useMemo(() => lensRef.current, []);
  return <AgentLensContext.Provider value={value}>{children}</AgentLensContext.Provider>;
}
