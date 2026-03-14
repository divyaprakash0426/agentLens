type ActionType =
  | 'click'
  | 'fill'
  | 'highlight'
  | 'scroll'
  | 'hover'
  | 'select'
  | 'navigate'
  | 'wait'
  | 'assert';

interface AgentAction {
  type: ActionType;
  selector: string;
  value?: string;
  url?: string;
  scroll?: { x?: number; y?: number; behavior?: 'smooth' | 'instant' };
  option?: string;
  assert?: { visible?: boolean; text?: string; attribute?: { name: string; value: string } };
  duration?: number;
  description?: string;
  meta?: Record<string, unknown>;
}

interface ExecutableAgentLens {
  execute(action: AgentAction): Promise<void>;
}

type JsonSchema = Record<string, unknown>;

export interface GeminiLiveFunctionDeclaration {
  name: string;
  description: string;
  parameters: JsonSchema;
}

export interface GeminiLiveToolConfig {
  functionDeclarations: GeminiLiveFunctionDeclaration[];
}

export interface GeminiLiveFunctionCall {
  id?: string;
  name?: string;
  args?: unknown;
}

export interface GeminiLiveFunctionResponse {
  id?: string;
  name: string;
  response: {
    status: 'ok' | 'error';
    action?: ActionType;
    selector?: string;
    message?: string;
    errorCode?: string;
  };
}

export interface GeminiLiveToolOptions {
  prefix?: string;
  include?: ActionType[];
}

export interface ExecuteGeminiLiveToolCallOptions {
  continueOnError?: boolean;
}

export interface SessionResumptionStore {
  getHandle(): string | null;
  setHandle(handle?: string | null): void;
  clearHandle(): void;
}

const ALL_ACTION_TYPES: ActionType[] = [
  'click',
  'fill',
  'highlight',
  'scroll',
  'hover',
  'select',
  'navigate',
  'wait',
  'assert'
];

function normalizePrefix(prefix?: string): string {
  return (prefix ?? 'agentlens')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'agentlens';
}

function toolNameFor(prefix: string, actionType: ActionType): string {
  return `${prefix}_${actionType}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function escapeSelectorValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function parseArgs(args: unknown): Record<string, unknown> {
  if (typeof args === 'string') {
    try {
      const parsed = JSON.parse(args);
      return isRecord(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return isRecord(args) ? args : {};
}

function readString(args: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = args[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readNumber(args: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = args[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function resolveSelector(args: Record<string, unknown>, fallback = 'body'): string {
  const selector = readString(args, 'selector');
  if (selector) return selector;

  const dataAgentId = readString(args, 'dataAgentId', 'data_agent_id');
  if (dataAgentId) {
    return `[data-agent-id="${escapeSelectorValue(dataAgentId)}"]`;
  }

  const dataAgentLens = readString(args, 'dataAgentLens', 'data_agentlens');
  if (dataAgentLens) {
    return `data-agentlens:${dataAgentLens}`;
  }

  const exactText = readString(args, 'text');
  if (exactText) {
    return `text:${exactText}`;
  }

  const fuzzyText = readString(args, 'fuzzyText', 'fuzzy_text');
  if (fuzzyText) {
    return `fuzzy:${fuzzyText}`;
  }

  return fallback;
}

function invalidToolCall(name: string, message: string): GeminiLiveFunctionResponse {
  return {
    name,
    response: {
      status: 'error',
      message,
      errorCode: 'INVALID_TOOL_CALL'
    }
  };
}

function createBaseAction(actionType: ActionType, args: Record<string, unknown>): AgentAction {
  return {
    type: actionType,
    selector: resolveSelector(args, actionType === 'navigate' || actionType === 'wait' ? 'body' : ''),
    description: readString(args, 'description', 'label'),
    meta: isRecord(args.meta) ? args.meta : undefined,
  };
}

function toAssertConfig(args: Record<string, unknown>): AgentAction['assert'] {
  if (isRecord(args.assert)) {
    const attribute = isRecord(args.assert.attribute)
      ? {
          name: readString(args.assert.attribute, 'name') ?? '',
          value: readString(args.assert.attribute, 'value') ?? ''
        }
      : undefined;

    return {
      visible: typeof args.assert.visible === 'boolean' ? args.assert.visible : undefined,
      text: readString(args.assert, 'text'),
      attribute: attribute && attribute.name ? attribute : undefined
    };
  }

  const attributeName = readString(args, 'attributeName', 'attribute_name');
  const attributeValue = readString(args, 'attributeValue', 'attribute_value');

  return {
    visible: typeof args.visible === 'boolean' ? args.visible : undefined,
    text: readString(args, 'text'),
    attribute: attributeName ? { name: attributeName, value: attributeValue ?? '' } : undefined
  };
}

function buildActionFromToolCall(prefix: string, call: GeminiLiveFunctionCall): AgentAction {
  const name = call.name ?? '';
  const args = parseArgs(call.args);

  const actionType = ALL_ACTION_TYPES.find((candidate) => toolNameFor(prefix, candidate) === name);
  if (!actionType) {
    throw new Error(`Unsupported Gemini Live tool: ${name || 'unknown'}`);
  }

  const action = createBaseAction(actionType, args);

  if (!action.selector && !['navigate', 'wait'].includes(action.type)) {
    throw new Error(`Tool "${name}" requires a selector.`);
  }

  switch (actionType) {
    case 'click':
    case 'highlight':
    case 'hover':
      return action;
    case 'fill': {
      const value = readString(args, 'value');
      if (value === undefined) throw new Error(`Tool "${name}" requires a string "value".`);
      return { ...action, value };
    }
    case 'select': {
      const option = readString(args, 'option', 'value');
      if (option === undefined) throw new Error(`Tool "${name}" requires a string "option".`);
      return { ...action, option };
    }
    case 'scroll':
      return {
        ...action,
        selector: action.selector || 'body',
        scroll: {
          x: readNumber(args, 'x'),
          y: readNumber(args, 'y'),
          behavior: readString(args, 'behavior') === 'instant' ? 'instant' : 'smooth'
        }
      };
    case 'navigate': {
      const url = readString(args, 'url');
      if (!url) throw new Error(`Tool "${name}" requires a string "url".`);
      return { ...action, selector: 'body', url };
    }
    case 'wait':
      return {
        ...action,
        selector: 'body',
        duration: readNumber(args, 'duration') ?? 1000
      };
    case 'assert': {
      const assert = toAssertConfig(args);
      return {
        ...action,
        assert
      };
    }
    default:
      return action;
  }
}

function createToolDeclaration(prefix: string, actionType: ActionType): GeminiLiveFunctionDeclaration {
  const commonSelectorDescription = 'CSS selector to target. Prefer stable selectors such as [data-agent-id="..."] or dataAgentId.';
  const commonProperties = {
    selector: { type: 'string', description: commonSelectorDescription },
    dataAgentId: { type: 'string', description: 'Stable data-agent-id value if available.' },
    dataAgentLens: { type: 'string', description: 'Stable data-agentlens value if available.' },
    description: { type: 'string', description: 'Short explanation of what the agent is doing.' },
  } satisfies JsonSchema;

  switch (actionType) {
    case 'click':
      return {
        name: toolNameFor(prefix, actionType),
        description: 'Move the visible AgentLens cursor to an element, highlight it, and click it.',
        parameters: { type: 'object', properties: commonProperties, required: ['selector'] }
      };
    case 'fill':
      return {
        name: toolNameFor(prefix, actionType),
        description: 'Focus an input-like element and type a value into it visibly.',
        parameters: {
          type: 'object',
          properties: {
            ...commonProperties,
            value: { type: 'string', description: 'The text to type into the element.' }
          },
          required: ['selector', 'value']
        }
      };
    case 'highlight':
      return {
        name: toolNameFor(prefix, actionType),
        description: 'Highlight an element without clicking it.',
        parameters: { type: 'object', properties: commonProperties, required: ['selector'] }
      };
    case 'scroll':
      return {
        name: toolNameFor(prefix, actionType),
        description: 'Scroll the page or target element into view.',
        parameters: {
          type: 'object',
          properties: {
            ...commonProperties,
            x: { type: 'number' },
            y: { type: 'number' },
            behavior: { type: 'string', enum: ['smooth', 'instant'] }
          }
        }
      };
    case 'hover':
      return {
        name: toolNameFor(prefix, actionType),
        description: 'Move the visible AgentLens cursor to an element and hover over it.',
        parameters: { type: 'object', properties: commonProperties, required: ['selector'] }
      };
    case 'select':
      return {
        name: toolNameFor(prefix, actionType),
        description: 'Choose an option from a select element.',
        parameters: {
          type: 'object',
          properties: {
            ...commonProperties,
            option: { type: 'string', description: 'The option label or value to select.' }
          },
          required: ['selector', 'option']
        }
      };
    case 'navigate':
      return {
        name: toolNameFor(prefix, actionType),
        description: 'Navigate the current browser session to a URL.',
        parameters: {
          type: 'object',
          properties: {
            ...commonProperties,
            url: { type: 'string', description: 'Absolute or relative URL to navigate to.' }
          },
          required: ['url']
        }
      };
    case 'wait':
      return {
        name: toolNameFor(prefix, actionType),
        description: 'Pause briefly before continuing.',
        parameters: {
          type: 'object',
          properties: {
            description: commonProperties.description,
            duration: { type: 'number', description: 'Wait time in milliseconds.' }
          }
        }
      };
    case 'assert':
      return {
        name: toolNameFor(prefix, actionType),
        description: 'Verify that an element is in the expected state.',
        parameters: {
          type: 'object',
          properties: {
            ...commonProperties,
            visible: { type: 'boolean' },
            text: { type: 'string' },
            attributeName: { type: 'string' },
            attributeValue: { type: 'string' }
          },
          required: ['selector']
        }
      };
  }

  throw new Error(`Unsupported action type: ${actionType}`);
}

export function createGeminiLiveActionTools(options: GeminiLiveToolOptions = {}): GeminiLiveToolConfig[] {
  const prefix = normalizePrefix(options.prefix);
  const included = options.include?.length ? options.include : ALL_ACTION_TYPES;

  return [
    {
      functionDeclarations: included.map((actionType) => createToolDeclaration(prefix, actionType))
    }
  ];
}

export async function executeGeminiLiveToolCalls(
  lens: ExecutableAgentLens,
  functionCalls: GeminiLiveFunctionCall[],
  options: ExecuteGeminiLiveToolCallOptions & GeminiLiveToolOptions = {}
): Promise<GeminiLiveFunctionResponse[]> {
  const prefix = normalizePrefix(options.prefix);
  const continueOnError = options.continueOnError ?? false;
  const responses: GeminiLiveFunctionResponse[] = [];

  for (const call of functionCalls) {
    const name = call.name ?? 'unknown_tool';
    try {
      const action = buildActionFromToolCall(prefix, call);
      await lens.execute(action);
      responses.push({
        id: call.id,
        name,
        response: {
          status: 'ok',
          action: action.type,
          selector: action.selector,
          message: action.description ?? `Executed ${action.type}.`
        }
      });
    } catch (error) {
      const candidate = error as { message?: unknown; code?: unknown };
      responses.push({
        ...invalidToolCall(name, typeof candidate.message === 'string' ? candidate.message : `Failed to execute ${name}.`),
        id: call.id,
        response: {
          status: 'error',
          message: typeof candidate.message === 'string' ? candidate.message : `Failed to execute ${name}.`,
          errorCode: typeof candidate.code === 'string' ? candidate.code : 'EXECUTION_FAILED'
        }
      });
      if (!continueOnError) break;
    }
  }

  return responses;
}

export function createBrowserSessionResumptionStore(
  storageKey = 'agentlens:gemini-live-session-handle',
  storage?: Storage | null
): SessionResumptionStore {
  const resolveStorage = () => {
    if (storage !== undefined) return storage;
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  };

  return {
    getHandle() {
      return resolveStorage()?.getItem(storageKey) ?? null;
    },
    setHandle(handle) {
      const target = resolveStorage();
      if (!target) return;
      if (!handle) {
        target.removeItem(storageKey);
        return;
      }
      target.setItem(storageKey, handle);
    },
    clearHandle() {
      resolveStorage()?.removeItem(storageKey);
    }
  };
}
