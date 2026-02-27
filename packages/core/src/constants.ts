import type { AgentLensConfig, ActionType, CursorConfig, ExecutionConfig, SpotlightConfig, TimingConfig } from './types';

export const ACTION_TYPES: ActionType[] = [
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

export const DEFAULT_CURSOR_CONFIG: CursorConfig = {
  size: 24,
  color: '#a855f7',
  glowColor: 'rgba(168, 85, 247, 0.6)',
  glowSpread: 15,
  trailLength: 0,
  trailDecay: 0.3,
  initiallyVisible: false,
  speed: 1
};

export const DEFAULT_SPOTLIGHT_CONFIG: SpotlightConfig = {
  overlayColor: 'rgba(0, 0, 0, 0.7)',
  borderColor: '#a855f7',
  borderWidth: 2,
  borderRadius: 8,
  padding: 8,
  boxShadow: '0 0 15px rgba(168,85,247,0.5)',
  animate: true,
  animationDuration: 300,
  showPopover: true,
  popoverPosition: 'auto'
};

export const DEFAULT_TIMING_CONFIG: TimingConfig = {
  preAnimationDelay: 200,
  cursorAnimationDuration: 600,
  preExecutionDelay: 300,
  postActionSpotlightDuration: 800,
  interActionDelay: 400,
  typingSpeed: 50,
  speedMultiplier: 1
};

export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  executeActions: true,
  scrollIntoView: true,
  scrollBehavior: 'smooth',
  dispatchEvents: true,
  clearBeforeFill: true,
  retry: { attempts: 3, delay: 500 },
  selectorTimeout: 5000
};

export const DEFAULT_CONFIG: AgentLensConfig = {
  cursor: DEFAULT_CURSOR_CONFIG,
  spotlight: DEFAULT_SPOTLIGHT_CONFIG,
  timing: DEFAULT_TIMING_CONFIG,
  execution: DEFAULT_EXECUTION_CONFIG,
  on: {},
  zIndexBase: 100000
};
