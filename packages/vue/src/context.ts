import type { InjectionKey } from 'vue';
import type { AgentLens } from 'agentlens-core';

export const AgentLensKey: InjectionKey<AgentLens> = Symbol('AgentLens');
