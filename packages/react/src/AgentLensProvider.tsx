import { AgentLens, type AgentLensConfig } from 'agentlens-core';
import { createContext, type ReactNode, useEffect, useRef } from 'react';

export const AgentLensContext = createContext<AgentLens | null>(null);

export interface AgentLensProviderProps {
  config?: AgentLensConfig;
  children: ReactNode;
}

export function AgentLensProvider({ config, children }: AgentLensProviderProps) {
  const lensRef = useRef<AgentLens | null>(null);
  const deferredDestroyRef = useRef<number | null>(null);

  if (!lensRef.current && typeof document !== 'undefined') {
    lensRef.current = new AgentLens(config);
  }

  useEffect(() => {
    if (deferredDestroyRef.current !== null) {
      window.clearTimeout(deferredDestroyRef.current);
      deferredDestroyRef.current = null;
    }

    return () => {
      const lens = lensRef.current;
      deferredDestroyRef.current = window.setTimeout(() => {
        lens?.destroy();
        if (lensRef.current === lens) {
          lensRef.current = null;
        }
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (lensRef.current && config) {
      lensRef.current.configure(config);
    }
  }, [config]);

  return <AgentLensContext.Provider value={lensRef.current}>{children}</AgentLensContext.Provider>;
}
