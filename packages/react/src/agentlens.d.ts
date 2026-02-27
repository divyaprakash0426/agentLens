declare module 'agentlens' {
  export type ParserFormat = 'gemini' | 'openai' | 'anthropic' | 'generic';

  export interface AgentAction {
    id?: string;
    type: 'click' | 'fill' | 'highlight' | 'scroll' | 'hover' | 'select' | 'navigate' | 'wait' | 'assert';
    selector: string;
    value?: string;
    url?: string;
    option?: string;
    duration?: number;
    description?: string;
  }

  export interface AgentLensConfig {
    cursor?: Record<string, unknown>;
    spotlight?: Record<string, unknown>;
    timing?: Record<string, unknown>;
    execution?: Record<string, unknown>;
    on?: Record<string, unknown>;
    selectorResolver?: (selector: string) => HTMLElement | null;
    zIndexBase?: number;
    container?: HTMLElement;
  }

  export class AgentLens {
    constructor(config?: AgentLensConfig);
    configure(config: Partial<AgentLensConfig>): void;
    parseAndEnqueue(text: string, format?: ParserFormat): AgentAction[];
    destroy(): void;
  }
}
