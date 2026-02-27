export type ActionType =
  | 'click'
  | 'fill'
  | 'highlight'
  | 'scroll'
  | 'hover'
  | 'select'
  | 'navigate'
  | 'wait'
  | 'assert';

export type ParserFormat = 'gemini' | 'openai' | 'anthropic' | 'generic';

export interface AgentAction {
  id?: string;
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

export interface AgentLensConfig {
  cursor?: CursorConfig;
  spotlight?: SpotlightConfig;
  timing?: TimingConfig;
  execution?: ExecutionConfig;
  on?: EventCallbacks;
  selectorResolver?: (selector: string) => HTMLElement | null;
  zIndexBase?: number;
  container?: HTMLElement;
}

export interface CursorConfig {
  size?: number;
  color?: string;
  glowColor?: string;
  glowSpread?: number;
  trailLength?: number;
  trailDecay?: number;
  element?: HTMLElement | string;
  initiallyVisible?: boolean;
  speed?: number;
}

export interface SpotlightConfig {
  overlayColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  boxShadow?: string;
  animate?: boolean;
  animationDuration?: number;
  showPopover?: boolean;
  popoverPosition?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  renderPopover?: (action: AgentAction, element: HTMLElement) => HTMLElement | string;
}

export interface TimingConfig {
  preAnimationDelay?: number;
  cursorAnimationDuration?: number;
  preExecutionDelay?: number;
  postActionSpotlightDuration?: number;
  interActionDelay?: number;
  typingSpeed?: number;
  speedMultiplier?: number;
}

export interface ExecutionConfig {
  executeActions?: boolean;
  scrollIntoView?: boolean;
  scrollBehavior?: 'smooth' | 'instant';
  dispatchEvents?: boolean;
  clearBeforeFill?: boolean;
  retry?: { attempts: number; delay: number };
  selectorTimeout?: number;
}

export interface EventCallbacks {
  onQueueStart?: () => void;
  onQueueEmpty?: () => void;
  onActionStart?: (action: AgentAction, element: HTMLElement | null) => boolean | void;
  onActionComplete?: (action: AgentAction, element: HTMLElement) => void;
  onActionError?: (action: AgentAction, error: AgentLensError) => void;
  onCursorMove?: (x: number, y: number) => void;
  onSpotlight?: (action: AgentAction, element: HTMLElement) => void;
  onClick?: (element: HTMLElement) => void;
  onType?: (element: HTMLElement, char: string, currentValue: string) => void;
  onNavigate?: (url: string) => void;
  onSelectorNotFound?: (selector: string, action: AgentAction) => void;
}

export class AgentLensError extends Error {
  constructor(
    message: string,
    public code: 'SELECTOR_NOT_FOUND' | 'EXECUTION_FAILED' | 'INVALID_ACTION' | 'TIMEOUT' | 'ABORTED',
    public action?: AgentAction,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AgentLensError';
  }
}
