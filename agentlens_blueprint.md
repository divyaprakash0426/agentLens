# AgentLens — Technical Blueprint

> **A framework-agnostic JavaScript library that renders visible, real-time AI agent actions directly on a live web page — animated cursor, element spotlight, and DOM execution — so users can watch an AI interact with their UI.**

---

## 1. Problem Statement

Today, AI browser agents operate in two modes:

1. **Headless / cloud-hosted** (Playwright, Puppeteer, Nova Act, Browser Use) — the user never sees what the AI is doing. Actions happen in a hidden browser instance.
2. **Screen control** (Computer Use, desktop agents) — the AI takes over the user's entire screen. Invasive and risky.

**Neither lets users watch AI actions happen visually inside their own live browser tab**, with a smooth animated cursor, highlighted elements, and real DOM interactions — like pair programming with an AI that you can see.

**AgentLens** fills this gap: a lightweight JS library that any developer can drop into their web app to visualize and execute AI-driven actions with full user visibility.

---

## 2. Core Concepts

```
┌─────────────────────────────────────────────────────┐
│                   YOUR WEB APP                      │
│                                                     │
│  ┌──────────────┐    ┌────────────────────────────┐ │
│  │  Your LLM    │───▶│       AgentLens            │ │
│  │  (any model) │    │                            │ │
│  │              │    │  ┌──────────┐ ┌─────────┐  │ │
│  │  Outputs:    │    │  │ Spotlight│ │ Cursor  │  │ │
│  │  {action}    │    │  │ Engine   │ │ Engine  │  │ │
│  │  JSON        │    │  └──────────┘ └─────────┘  │ │
│  └──────────────┘    │  ┌──────────┐ ┌─────────┐  │ │
│                      │  │   DOM    │ │ Action  │  │ │
│                      │  │ Executor │ │  Queue  │  │ │
│                      │  └──────────┘ └─────────┘  │ │
│                      └────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **LLM-agnostic**: AgentLens does NOT talk to any AI model. It receives structured action objects and executes them visually. The developer chooses their own LLM.
- **Framework-agnostic**: Vanilla JS core. Works with React, Vue, Svelte, Angular, or plain HTML pages. Optional framework adapters provided.
- **Non-invasive**: The cursor is a DOM overlay (`position: fixed; pointer-events: none`). It never replaces the user's real cursor. The spotlight uses a backdrop overlay that auto-dismisses.
- **Sequential execution**: Actions are queued and processed one at a time with configurable delays, so users can follow along.

---

## 3. Project Setup & Tooling

### 3.1 Repository Structure

```
agentlens/
├── packages/
│   ├── core/                      # Main library (vanilla JS/TS)
│   │   ├── src/
│   │   │   ├── index.ts           # Public API exports
│   │   │   ├── AgentLens.ts       # Main orchestrator class
│   │   │   ├── ActionQueue.ts     # FIFO action queue with event emitters
│   │   │   ├── CursorEngine.ts    # Animated virtual cursor
│   │   │   ├── SpotlightEngine.ts # Element highlighting/spotlight
│   │   │   ├── DOMExecutor.ts     # Click, fill, scroll, navigate execution
│   │   │   ├── ActionParser.ts    # Parse action blocks from LLM text
│   │   │   ├── SelectorResolver.ts # Smart element resolution with fallbacks
│   │   │   ├── types.ts           # All TypeScript interfaces
│   │   │   ├── constants.ts       # Default timing, colors, z-index values
│   │   │   ├── utils.ts           # DOM helpers, geometry, easing functions
│   │   │   └── styles/
│   │   │       ├── cursor.css     # Virtual cursor styles
│   │   │       ├── spotlight.css  # Spotlight/highlight overlay styles
│   │   │       └── index.css      # Combined entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── react/                     # React adapter (@agentlens/react)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── AgentLensProvider.tsx  # Context provider
│   │   │   ├── useAgentLens.ts       # Hook returning lens instance
│   │   │   ├── useActionParser.ts    # Hook for parsing LLM text
│   │   │   └── AgentLensOverlay.tsx  # Drop-in component
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── vue/                       # Vue adapter (@agentlens/vue)
│   │   └── ...
│   │
│   └── parsers/                   # LLM-specific parsers (@agentlens/parsers)
│       ├── src/
│       │   ├── index.ts
│       │   ├── gemini.ts          # Parse Gemini [ACTION] blocks
│       │   ├── openai.ts          # Parse OpenAI function_call / tool_use
│       │   ├── anthropic.ts       # Parse Claude tool_use blocks
│       │   └── generic.ts         # Generic JSON action parser
│       └── package.json
│
├── examples/
│   ├── vanilla-demo/              # Plain HTML + JS demo
│   ├── react-demo/                # React app demo
│   ├── gemini-live-demo/          # Full Gemini Live integration demo
│   └── openai-realtime-demo/      # OpenAI Realtime API demo
│
├── docs/                          # Documentation site (VitePress)
│   ├── guide/
│   │   ├── getting-started.md
│   │   ├── actions.md
│   │   ├── customization.md
│   │   ├── llm-integration.md
│   │   └── framework-adapters.md
│   └── api/
│       ├── agentlens.md
│       ├── action-queue.md
│       ├── cursor-engine.md
│       ├── spotlight-engine.md
│       └── dom-executor.md
│
├── package.json                   # Workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── vitest.config.ts
├── .changeset/                    # Changesets for versioning
├── LICENSE                        # MIT
└── README.md
```

### 3.2 Build Tooling

| Tool | Purpose |
|------|---------|
| **pnpm workspaces** | Monorepo package management |
| **TypeScript 5.x** | Type safety, [.d.ts](file:///home/modernyogi/Projects/timekeeper/TimekeeperX/frontend/node_modules/perfect-cursors/dist/types/index.d.ts) generation |
| **Vite (library mode)** | Bundles to ESM + CJS + UMD. Tree-shakeable. |
| **Vitest** | Unit + integration testing |
| **Playwright** | E2E browser tests (visual action verification) |
| **Changesets** | Automated versioning and changelogs |
| **VitePress** | Documentation site |
| **GitHub Actions** | CI/CD: lint, test, build, publish to npm |

### 3.3 Build Outputs (per package)

```
dist/
├── index.mjs          # ESM (tree-shakeable, for bundlers)
├── index.cjs          # CommonJS (Node.js, legacy bundlers)
├── index.umd.js       # UMD (CDN / script tag usage)
├── index.d.ts         # TypeScript declarations
└── styles/
    └── agentlens.css  # Pre-built CSS (importable or linkable)
```

### 3.4 package.json (core)

```json
{
  "name": "agentlens",
  "version": "0.1.0",
  "description": "Visualize AI agent actions on your live web page — animated cursor, element spotlight, DOM execution",
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/styles/agentlens.css"
  },
  "files": ["dist"],
  "sideEffects": ["*.css"],
  "keywords": ["ai", "agent", "browser", "automation", "overlay", "cursor", "spotlight", "llm", "gemini", "openai"],
  "license": "MIT",
  "peerDependencies": {},
  "dependencies": {
    "driver.js": "^1.4.0",
    "perfect-cursors": "^1.0.5"
  }
}
```

---

## 4. Dependencies & Rationale

| Dependency | Version | Why | What It Does |
|------------|---------|-----|-------------|
| **driver.js** | ^1.4.0 | Battle-tested, lightweight (5KB gzip), highly customizable spotlight/popover library. MIT license. | Creates a backdrop overlay with a "cutout" around the target element, with optional popover tooltips. Supports custom CSS theming. |
| **perfect-cursors** | ^1.0.5 | Catmull-Rom spline interpolation for buttery-smooth cursor paths. Used by tldraw. ~2KB. | Takes a sequence of `[x, y]` points and animates between them with natural-looking curves, not straight lines. |

### Dependencies NOT included (and why)

| Library | Why Excluded |
|---------|-------------|
| **Puppeteer / Playwright** | Server-side; can't run in browser. AgentLens is frontend-only. |
| **react-animated-cursor** | Replaces the real cursor globally. AgentLens adds a SEPARATE overlay cursor. |
| **anime.js / GSAP** | Overkill. `perfect-cursors` + CSS transitions cover all animation needs. |

---

## 5. TypeScript Interfaces (types.ts)

```typescript
// ─── Action Types ─────────────────────────────────────────

/** The action types AgentLens can execute */
export type ActionType = 'click' | 'fill' | 'highlight' | 'scroll' | 'hover' | 'select' | 'navigate' | 'wait' | 'assert';

/** A single action for AgentLens to execute */
export interface AgentAction {
  /** Unique ID, auto-generated if not provided */
  id?: string;

  /** The type of DOM action to perform */
  type: ActionType;

  /** CSS selector to target the element. Supports:
   *  - Standard CSS: '#id', '.class', 'button[aria-label="Save"]'
   *  - data-agentlens: '[data-agentlens="save-button"]'
   *  - XPath (prefixed): 'xpath://div[@id="main"]/button'
   *  - Text content: 'text:Submit Application'
   */
  selector: string;

  /** Value for 'fill' actions (text to type) */
  value?: string;

  /** URL for 'navigate' actions */
  url?: string;

  /** Scroll direction/amount for 'scroll' actions */
  scroll?: { x?: number; y?: number; behavior?: 'smooth' | 'instant' };

  /** Option value for 'select' actions (dropdowns) */
  option?: string;

  /** Assertion check for 'assert' actions */
  assert?: { visible?: boolean; text?: string; attribute?: { name: string; value: string } };

  /** Duration in ms for 'wait' actions */
  duration?: number;

  /** Popover message shown during this action (e.g., "Clicking the save button") */
  description?: string;

  /** Additional metadata (passed through to event callbacks) */
  meta?: Record<string, unknown>;
}

// ─── Configuration ────────────────────────────────────────

export interface AgentLensConfig {
  /** Cursor appearance */
  cursor?: CursorConfig;

  /** Spotlight/highlight appearance */
  spotlight?: SpotlightConfig;

  /** Timing configuration */
  timing?: TimingConfig;

  /** DOM execution behavior */
  execution?: ExecutionConfig;

  /** Event callbacks */
  on?: EventCallbacks;

  /** Custom selector resolver (override default resolution) */
  selectorResolver?: (selector: string) => HTMLElement | null;

  /** Z-index base for all overlays (default: 100000) */
  zIndexBase?: number;

  /** Container element for the overlay (default: document.body) */
  container?: HTMLElement;
}

export interface CursorConfig {
  /** Cursor size in pixels (default: 24) */
  size?: number;

  /** Cursor color, any CSS color value (default: '#a855f7') */
  color?: string;

  /** Glow effect color (default: same as color with opacity) */
  glowColor?: string;

  /** Glow spread radius in pixels (default: 15) */
  glowSpread?: number;

  /** Trail effect: number of trailing ghost cursors (default: 0, max: 10) */
  trailLength?: number;

  /** Trail opacity decay factor per step (default: 0.3) */
  trailDecay?: number;

  /** Custom cursor element (replaces default dot cursor) */
  element?: HTMLElement | string; // string = innerHTML

  /** Whether cursor should start visible (default: false, shows on first action) */
  initiallyVisible?: boolean;

  /** Animation speed multiplier (default: 1.0, higher = faster) */
  speed?: number;
}

export interface SpotlightConfig {
  /** Spotlight overlay color with opacity (default: 'rgba(0, 0, 0, 0.7)') */
  overlayColor?: string;

  /** Border color around highlighted element (default: '#a855f7') */
  borderColor?: string;

  /** Border width in pixels (default: 2) */
  borderWidth?: number;

  /** Border radius for the highlight cutout in pixels (default: 8) */
  borderRadius?: number;

  /** Padding around the highlighted element in pixels (default: 8) */
  padding?: number;

  /** Glow/shadow effect around the cutout (default: '0 0 15px rgba(168,85,247,0.5)') */
  boxShadow?: string;

  /** Animate the spotlight entrance (default: true) */
  animate?: boolean;

  /** Animation duration in ms (default: 300) */
  animationDuration?: number;

  /** Show popover with action description (default: true) */
  showPopover?: boolean;

  /** Popover position preference (default: 'auto') */
  popoverPosition?: 'auto' | 'top' | 'bottom' | 'left' | 'right';

  /** Custom popover renderer */
  renderPopover?: (action: AgentAction, element: HTMLElement) => HTMLElement | string;
}

export interface TimingConfig {
  /** Delay before starting cursor animation (ms, default: 200) */
  preAnimationDelay?: number;

  /** Cursor animation duration to reach target (ms, default: 600) */
  cursorAnimationDuration?: number;

  /** Delay between cursor arriving and action executing (ms, default: 300) */
  preExecutionDelay?: number;

  /** How long to show spotlight after action completes (ms, default: 800) */
  postActionSpotlightDuration?: number;

  /** Delay between consecutive actions in queue (ms, default: 400) */
  interActionDelay?: number;

  /** Typing speed for 'fill' actions (ms per character, default: 50) */
  typingSpeed?: number;

  /** Speed multiplier: 0.5 = half speed, 2.0 = double speed (default: 1.0) */
  speedMultiplier?: number;
}

export interface ExecutionConfig {
  /** Actually perform DOM actions, or just visualize (default: true) */
  executeActions?: boolean;

  /** Scroll element into view before acting (default: true) */
  scrollIntoView?: boolean;

  /** Scroll behavior (default: 'smooth') */
  scrollBehavior?: 'smooth' | 'instant';

  /** Dispatch synthetic events after actions: input, change, blur (default: true) */
  dispatchEvents?: boolean;

  /** For 'fill' actions: clear existing value before typing (default: true) */
  clearBeforeFill?: boolean;

  /** Retry selector resolution N times with delay (default: { attempts: 3, delay: 500 }) */
  retry?: { attempts: number; delay: number };

  /** Timeout for selector resolution (ms, default: 5000) */
  selectorTimeout?: number;
}

// ─── Events ───────────────────────────────────────────────

export interface EventCallbacks {
  /** Fired when the queue starts processing (first action dequeued) */
  onQueueStart?: () => void;

  /** Fired when all actions in the queue have been processed */
  onQueueEmpty?: () => void;

  /** Fired before each action begins (return false to skip) */
  onActionStart?: (action: AgentAction, element: HTMLElement | null) => boolean | void;

  /** Fired after each action completes successfully */
  onActionComplete?: (action: AgentAction, element: HTMLElement) => void;

  /** Fired when an action fails (element not found, execution error) */
  onActionError?: (action: AgentAction, error: AgentLensError) => void;

  /** Fired when cursor position updates (for custom cursor rendering) */
  onCursorMove?: (x: number, y: number) => void;

  /** Fired when spotlight is shown on an element */
  onSpotlight?: (action: AgentAction, element: HTMLElement) => void;

  /** Fired when an element is clicked */
  onClick?: (element: HTMLElement) => void;

  /** Fired on each character typed during a 'fill' action */
  onType?: (element: HTMLElement, char: string, currentValue: string) => void;

  /** Fired on navigation */
  onNavigate?: (url: string) => void;

  /** Fired when selector resolution fails after all retries */
  onSelectorNotFound?: (selector: string, action: AgentAction) => void;
}

// ─── Errors ───────────────────────────────────────────────

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
```

---

## 6. Core Modules — Detailed Implementation

### 6.1 AgentLens.ts — Main Orchestrator

This is the public-facing class that users instantiate. It wires all internal engines together.

```typescript
import { ActionQueue } from './ActionQueue';
import { CursorEngine } from './CursorEngine';
import { SpotlightEngine } from './SpotlightEngine';
import { DOMExecutor } from './DOMExecutor';
import { SelectorResolver } from './SelectorResolver';
import type { AgentLensConfig, AgentAction } from './types';

export class AgentLens {
  private queue: ActionQueue;
  private cursor: CursorEngine;
  private spotlight: SpotlightEngine;
  private executor: DOMExecutor;
  private resolver: SelectorResolver;
  private config: Required<AgentLensConfig>; // merged with defaults
  private isProcessing: boolean = false;
  private isDestroyed: boolean = false;
  private abortController: AbortController | null = null;

  constructor(config?: AgentLensConfig);

  // ─── Public API ─────────────────────────────────

  /**
   * Push one or more actions to the queue.
   * Processing starts automatically if not already running.
   *
   * @example
   * lens.enqueue({ type: 'click', selector: '#submit-btn' });
   * lens.enqueue([
   *   { type: 'fill', selector: '#email', value: 'user@example.com' },
   *   { type: 'click', selector: '#submit-btn', description: 'Submitting the form' }
   * ]);
   */
  enqueue(actions: AgentAction | AgentAction[]): void;

  /**
   * Parse raw LLM text for action blocks and enqueue any found.
   * Uses the configured parser or falls back to generic JSON extraction.
   *
   * @returns The actions that were found and enqueued
   *
   * @example
   * const actions = lens.parseAndEnqueue(geminiTextResponse);
   */
  parseAndEnqueue(text: string, format?: 'gemini' | 'openai' | 'anthropic' | 'generic'): AgentAction[];

  /**
   * Execute a single action immediately, skipping the queue.
   *
   * @example
   * await lens.execute({ type: 'click', selector: '#btn' });
   */
  execute(action: AgentAction): Promise<void>;

  /**
   * Pause processing (current action completes, queue freezes)
   */
  pause(): void;

  /**
   * Resume processing after pause
   */
  resume(): void;

  /**
   * Abort current action and clear the queue
   */
  abort(): void;

  /**
   * Clear all pending actions (does not interrupt current action)
   */
  clearQueue(): void;

  /**
   * Get current queue state
   */
  getQueueState(): { pending: AgentAction[]; current: AgentAction | null; processed: number };

  /**
   * Programmatically move the cursor to a position (no action)
   */
  moveCursorTo(x: number, y: number): Promise<void>;

  /**
   * Programmatically spotlight an element (no action)
   */
  spotlightElement(selector: string, options?: { duration?: number; description?: string }): Promise<void>;

  /**
   * Update configuration at runtime
   */
  configure(config: Partial<AgentLensConfig>): void;

  /**
   * Completely destroy the instance: remove DOM elements, clear queue, remove listeners
   */
  destroy(): void;
}
```

#### Internal Processing Loop (pseudocode)

```
processQueue():
  if isProcessing or isPaused or isDestroyed -> return
  isProcessing = true

  while queue.hasNext():
    action = queue.dequeue()

    // 1. Resolve selector → HTMLElement
    element = await resolver.resolve(action.selector, config.execution.retry)
    if !element:
      emit('onActionError', SELECTOR_NOT_FOUND)
      continue (or abort based on config)

    // 2. Fire onActionStart callback (can cancel)
    if onActionStart(action, element) === false:
      continue

    // 3. Scroll into view
    if config.execution.scrollIntoView:
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      await delay(300) // wait for scroll

    // 4. Show spotlight
    spotlight.show(element, action)
    emit('onSpotlight', action, element)
    await delay(config.timing.preAnimationDelay)

    // 5. Animate cursor to element center
    targetPos = getElementCenter(element)
    await cursor.animateTo(targetPos)
    await delay(config.timing.preExecutionDelay)

    // 6. Execute DOM action
    if config.execution.executeActions:
      await executor.execute(action, element)

    // 7. Post-action spotlight hold
    await delay(config.timing.postActionSpotlightDuration)
    spotlight.hide()

    // 8. Fire onActionComplete
    emit('onActionComplete', action, element)

    // 9. Inter-action delay
    await delay(config.timing.interActionDelay)

  cursor.hide()
  isProcessing = false
  emit('onQueueEmpty')
```

---

### 6.2 ActionQueue.ts — FIFO Action Queue

```typescript
import { EventEmitter } from './utils'; // tiny custom EventEmitter (~30 lines)

export class ActionQueue extends EventEmitter {
  private queue: AgentAction[] = [];
  private processedCount: number = 0;
  private currentAction: AgentAction | null = null;

  /** Add action(s) to the end of the queue */
  enqueue(actions: AgentAction | AgentAction[]): void;

  /** Remove and return the next action from the front */
  dequeue(): AgentAction | undefined;

  /** Look at the next action without removing it */
  peek(): AgentAction | undefined;

  /** Check if queue has pending actions */
  hasNext(): boolean;

  /** Get number of pending actions */
  get length(): number;

  /** Clear all pending actions */
  clear(): void;

  /** Insert action(s) at the front of the queue (priority) */
  prepend(actions: AgentAction | AgentAction[]): void;

  /** Get full queue state */
  getState(): { pending: AgentAction[]; current: AgentAction | null; processed: number };

  // Events emitted: 'enqueue', 'dequeue', 'clear', 'empty'
}
```

---

### 6.3 CursorEngine.ts — Animated Virtual Cursor

**Depends on**: `perfect-cursors`

```typescript
import { PerfectCursor } from 'perfect-cursors';

export class CursorEngine {
  private cursorElement: HTMLElement;      // The visible cursor <div>
  private trailElements: HTMLElement[];    // Optional trail dots
  private perfectCursor: PerfectCursor;
  private currentPos: [number, number] = [0, 0];
  private visible: boolean = false;

  constructor(config: CursorConfig, container: HTMLElement);

  /**
   * Create and inject the cursor DOM element.
   * Default cursor: a 24px circle with gradient + glow + drop-shadow.
   *
   * DOM structure created:
   * <div class="agentlens-cursor" style="position:fixed; pointer-events:none; z-index:100001;">
   *   <div class="agentlens-cursor-dot"></div>       <!-- main cursor -->
   *   <div class="agentlens-cursor-ring"></div>      <!-- pulsing ring -->
   * </div>
   * <div class="agentlens-cursor-trail">...</div>    <!-- if trailLength > 0 -->
   */
  private createCursorElement(): HTMLElement;

  /**
   * Animate cursor from current position to target [x, y].
   * Uses PerfectCursor.addPoint() for spline interpolation.
   *
   * Implementation:
   * 1. Show cursor if hidden
   * 2. Calculate intermediate waypoints (for natural curved path)
   * 3. Feed points to PerfectCursor on a RAF loop
   * 4. PerfectCursor callback updates cursor element transform
   * 5. Resolve promise when animation completes
   */
  animateTo(target: [number, number]): Promise<void>;

  /**
   * Instantly set cursor position (no animation)
   */
  setPosition(pos: [number, number]): void;

  /** Show the cursor */
  show(): void;

  /** Hide the cursor with fade-out */
  hide(): void;

  /** Get current position */
  getPosition(): [number, number];

  /** Update cursor appearance at runtime */
  updateConfig(config: Partial<CursorConfig>): void;

  /** Remove cursor from DOM */
  destroy(): void;
}
```

#### Cursor CSS (cursor.css)

```css
.agentlens-cursor {
  position: fixed;
  pointer-events: none;
  z-index: 100001;
  transition: opacity 0.3s ease;
  will-change: transform;
}

.agentlens-cursor-dot {
  width: var(--agentlens-cursor-size, 24px);
  height: var(--agentlens-cursor-size, 24px);
  border-radius: 50%;
  background: radial-gradient(circle, var(--agentlens-cursor-color, #a855f7), transparent 70%);
  box-shadow: 0 0 var(--agentlens-cursor-glow-spread, 15px) var(--agentlens-cursor-glow-color, rgba(168, 85, 247, 0.6));
  transform: translate(-50%, -50%);
}

.agentlens-cursor-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(var(--agentlens-cursor-size, 24px) * 2);
  height: calc(var(--agentlens-cursor-size, 24px) * 2);
  border-radius: 50%;
  border: 2px solid var(--agentlens-cursor-color, #a855f7);
  opacity: 0.4;
  transform: translate(-50%, -50%);
  animation: agentlens-cursor-pulse 1.5s ease-in-out infinite;
}

@keyframes agentlens-cursor-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.1; }
}

/* Trail dots */
.agentlens-cursor-trail-dot {
  position: fixed;
  pointer-events: none;
  width: var(--agentlens-cursor-size, 24px);
  height: var(--agentlens-cursor-size, 24px);
  border-radius: 50%;
  background: var(--agentlens-cursor-color, #a855f7);
  transform: translate(-50%, -50%);
  transition: opacity 0.15s ease;
  will-change: transform, opacity;
}
```

---

### 6.4 SpotlightEngine.ts — Element Highlighting

**Depends on**: `driver.js`

```typescript
import { driver, Driver } from 'driver.js';

export class SpotlightEngine {
  private driverInstance: Driver | null = null;
  private config: SpotlightConfig;
  private styleElement: HTMLStyleElement | null = null;

  constructor(config: SpotlightConfig);

  /**
   * Inject custom CSS to override Driver.js default styles
   * with AgentLens theming (neon glow, custom colors, etc.)
   */
  private injectStyles(): void;

  /**
   * Highlight a specific element with a spotlight effect.
   *
   * Implementation:
   * 1. Initialize Driver.js instance (lazy, reuse if exists)
   * 2. Apply spotlight config (colors, padding, animation)
   * 3. Call driver.highlight({ element, popover })
   * 4. If action has a description, show popover with the text
   */
  show(element: HTMLElement, action?: AgentAction): void;

  /**
   * Show spotlight using a CSS selector string
   */
  showBySelector(selector: string, options?: { description?: string }): void;

  /**
   * Remove the spotlight
   */
  hide(): void;

  /**
   * Check if spotlight is currently visible
   */
  isVisible(): boolean;

  /**
   * Update spotlight appearance at runtime
   */
  updateConfig(config: Partial<SpotlightConfig>): void;

  /**
   * Remove from DOM and clean up
   */
  destroy(): void;
}
```

#### Spotlight CSS (spotlight.css)

```css
/* Override Driver.js defaults for AgentLens branding */

.agentlens-spotlight .driver-overlay {
  background: var(--agentlens-spotlight-overlay, rgba(0, 0, 0, 0.7)) !important;
}

.agentlens-spotlight .driver-active-element {
  box-shadow:
    0 0 0 var(--agentlens-spotlight-border-width, 2px) var(--agentlens-spotlight-border-color, #a855f7),
    0 0 15px var(--agentlens-spotlight-glow-color, rgba(168, 85, 247, 0.5)),
    0 0 30px var(--agentlens-spotlight-glow-color, rgba(168, 85, 247, 0.3)) !important;
  border-radius: var(--agentlens-spotlight-border-radius, 8px) !important;
}

.agentlens-spotlight .driver-popover {
  background: rgba(17, 17, 17, 0.95);
  color: #e0e0e0;
  border: 1px solid var(--agentlens-spotlight-border-color, #a855f7);
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
  font-family: 'Inter', system-ui, sans-serif;
}

.agentlens-spotlight .driver-popover-title {
  color: var(--agentlens-spotlight-border-color, #a855f7);
  font-weight: 600;
}

.agentlens-spotlight .driver-popover-description {
  color: #b0b0b0;
}

/* Hide Driver.js navigation buttons — AgentLens controls flow */
.agentlens-spotlight .driver-popover-navigation-btns {
  display: none !important;
}
```

---

### 6.5 DOMExecutor.ts — Action Execution Engine

```typescript
export class DOMExecutor {
  private config: ExecutionConfig;

  constructor(config: ExecutionConfig);

  /**
   * Execute an action on a resolved HTML element.
   *
   * Dispatches appropriate synthetic DOM events so that
   * frameworks (React, Vue, Angular) detect the changes.
   */
  async execute(action: AgentAction, element: HTMLElement): Promise<void>;

  // ─── Individual Action Handlers ─────────────────

  /**
   * Simulate a realistic click:
   * 1. Dispatch 'pointerdown' event
   * 2. Dispatch 'mousedown' event
   * 3. Dispatch 'pointerup' event
   * 4. Dispatch 'mouseup' event
   * 5. Dispatch 'click' event
   * 6. If element is <a href>, let default navigation happen
   * 7. If element has onclick handler, it fires naturally
   *
   * Why all these events: React and other frameworks often listen
   * on specific event types. Just calling element.click() misses
   * pointer events that some UI libraries depend on.
   */
  private executeClick(element: HTMLElement): Promise<void>;

  /**
   * Simulate realistic typing into an input/textarea:
   * 1. element.focus()
   * 2. Dispatch 'focusin' event
   * 3. If clearBeforeFill: set value = '', dispatch 'input'
   * 4. For each character in value:
   *    a. Dispatch 'keydown' with key
   *    b. Append char to element.value
   *    c. Dispatch 'input' event (bubbles, for React)
   *    d. Dispatch 'keyup' with key
   *    e. await delay(typingSpeed) — visible typing effect
   * 5. Dispatch 'change' event
   * 6. Dispatch 'blur' event
   *
   * Special handling:
   * - contentEditable divs: use textContent instead of value
   * - React controlled inputs: use native input value setter
   *   to bypass React's synthetic event system
   */
  private executeFill(element: HTMLElement, value: string): Promise<void>;

  /**
   * Highlight only (no DOM action).
   * The spotlight is already shown by the orchestrator.
   * This just waits for the configured duration.
   */
  private executeHighlight(element: HTMLElement, duration?: number): Promise<void>;

  /**
   * Scroll the page or a specific scrollable container:
   * 1. If action.scroll has x/y offsets, scroll by that amount
   * 2. If targeting an element, scroll it into center of viewport
   * 3. Support both window-level and container-level scrolling
   */
  private executeScroll(element: HTMLElement, scroll?: AgentAction['scroll']): Promise<void>;

  /**
   * Hover over an element:
   * 1. Dispatch 'pointerenter' event
   * 2. Dispatch 'mouseenter' event
   * 3. Dispatch 'mouseover' event
   * 4. Hold for duration, then dispatch 'mouseleave'
   *
   * Useful for triggering tooltips, dropdown menus, etc.
   */
  private executeHover(element: HTMLElement): Promise<void>;

  /**
   * Select an option from a <select> dropdown:
   * 1. Focus the select element
   * 2. Set selectedIndex to match the option value/text
   * 3. Dispatch 'change' event
   * 4. Dispatch 'input' event
   */
  private executeSelect(element: HTMLSelectElement, optionValue: string): Promise<void>;

  /**
   * Navigate to a URL:
   * - If same-origin: use history.pushState + popstate event
   *   (works with SPAs without full reload)
   * - If cross-origin: use window.location.href
   * - Emit onNavigate callback before navigating
   */
  private executeNavigate(url: string): Promise<void>;

  /**
   * Wait for a specified duration (explicit pause in action sequence)
   */
  private executeWait(duration: number): Promise<void>;

  /**
   * Assert that an element matches expected conditions:
   * - visible: check if element is in viewport and not display:none
   * - text: check if element.textContent includes the string
   * - attribute: check if element has attr with expected value
   *
   * Throws AgentLensError if assertion fails.
   */
  private executeAssert(element: HTMLElement, assert: AgentAction['assert']): Promise<void>;

  // ─── Helpers ────────────────────────────────────

  /**
   * React-compatible value setter.
   * React overrides input.value with a getter/setter.
   * To update a React controlled input, we must use the
   * native HTMLInputElement prototype setter directly.
   *
   * Implementation:
   *   const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
   *     HTMLInputElement.prototype, 'value'
   *   )?.set;
   *   nativeInputValueSetter?.call(element, newValue);
   *   element.dispatchEvent(new Event('input', { bubbles: true }));
   */
  private setReactCompatibleValue(element: HTMLInputElement, value: string): void;

  /**
   * Dispatch a realistic pointer/mouse event with correct coordinates
   */
  private dispatchMouseEvent(
    element: HTMLElement,
    type: string,
    options?: { clientX?: number; clientY?: number }
  ): void;
}
```

---

### 6.6 SelectorResolver.ts — Smart Element Resolution

```typescript
export class SelectorResolver {
  private config: ExecutionConfig;
  private customResolver?: (selector: string) => HTMLElement | null;

  constructor(config: ExecutionConfig, customResolver?: (selector: string) => HTMLElement | null);

  /**
   * Resolve a selector string to an HTMLElement.
   * Tries multiple strategies in order with retries.
   *
   * Resolution order:
   *
   * 1. Custom resolver (if provided by user)
   * 2. data-agentlens attribute: [data-agentlens="value"]
   * 3. Standard CSS selector: document.querySelector(selector)
   * 4. XPath (if prefixed with 'xpath:'): document.evaluate()
   * 5. Text content match (if prefixed with 'text:'):
   *    - TreeWalker to find elements containing exact text
   *    - Prefers smallest element containing the text (most specific)
   * 6. Fuzzy text match (if prefixed with 'fuzzy:'):
   *    - Case-insensitive, partial text match
   *    - Useful when LLM doesn't know exact text
   * 7. Aria label: [aria-label="value"] or [aria-labelledby]
   *
   * If all fail, waits retry.delay ms and tries again,
   * up to retry.attempts times. Then throws SELECTOR_NOT_FOUND.
   */
  async resolve(selector: string): Promise<HTMLElement | null>;

  /**
   * Check if an element is interactable:
   * - Not display:none or visibility:hidden
   * - Not zero width/height
   * - Not disabled
   * - Not covered by another element (checked via elementFromPoint)
   */
  private isInteractable(element: HTMLElement): boolean;

  /**
   * Get the visual center point of an element
   */
  static getElementCenter(element: HTMLElement): [number, number];

  /**
   * Get all matching elements for a selector (for debugging/testing)
   */
  resolveAll(selector: string): HTMLElement[];
}
```

---

### 6.7 ActionParser.ts — LLM Text → Actions

```typescript
export class ActionParser {
  /**
   * Parse action blocks from raw LLM output text.
   *
   * Supports multiple formats:
   *
   * Format 1 — Tagged blocks (Gemini style):
   *   [ACTION]{"type":"click","selector":"#btn"}[/ACTION]
   *
   * Format 2 — JSON code blocks:
   *   ```action
   *   {"type":"click","selector":"#btn"}
   *   ```
   *
   * Format 3 — Tool call JSON (OpenAI/Anthropic style):
   *   {"tool": "browser_action", "input": {"type":"click","selector":"#btn"}}
   *
   * Format 4 — Freeform JSON extraction:
   *   Any JSON object containing "type" and "selector" keys
   */
  static parse(text: string, format?: 'gemini' | 'openai' | 'anthropic' | 'generic'): AgentAction[];

  /**
   * Parse specifically for Gemini [ACTION]...[/ACTION] format
   */
  static parseGemini(text: string): AgentAction[];

  /**
   * Parse OpenAI function_call / tool_use format
   */
  static parseOpenAI(toolCalls: Array<{ function: { name: string; arguments: string } }>): AgentAction[];

  /**
   * Parse Anthropic tool_use content blocks
   */
  static parseAnthropic(contentBlocks: Array<{ type: string; name: string; input: unknown }>): AgentAction[];

  /**
   * Validate an action object has required fields
   */
  static validate(action: unknown): action is AgentAction;

  /**
   * Generate a system prompt snippet that instructs an LLM
   * how to emit actions in the correct format.
   *
   * @example
   * const prompt = ActionParser.getSystemPrompt('gemini');
   * // Returns a string you can append to your LLM's system instruction
   */
  static getSystemPrompt(format: 'gemini' | 'openai' | 'anthropic'): string;
}
```

---

## 7. Public API Surface — Quick Reference

```typescript
// ─── Installation ─────────────────────────────────
// npm install agentlens
// import 'agentlens/styles';

import { AgentLens, ActionParser } from 'agentlens';

// ─── Initialize ───────────────────────────────────
const lens = new AgentLens({
  cursor: { color: '#00ff88', size: 20, trailLength: 3 },
  spotlight: { borderColor: '#00ff88', padding: 10 },
  timing: { typingSpeed: 40, speedMultiplier: 1.5 },
  execution: { executeActions: true },
  on: {
    onActionStart: (action) => console.log('Starting:', action.type, action.selector),
    onActionComplete: (action) => console.log('Done:', action.type),
    onActionError: (action, err) => console.error('Failed:', err.message),
    onQueueEmpty: () => console.log('All actions complete'),
  },
});

// ─── Enqueue Actions Manually ─────────────────────
lens.enqueue([
  { type: 'click', selector: '#login-btn', description: 'Opening login form' },
  { type: 'fill', selector: '#email', value: 'user@example.com' },
  { type: 'fill', selector: '#password', value: '••••••••' },
  { type: 'click', selector: '#submit', description: 'Submitting login' },
]);

// ─── Or Parse From LLM Output ─────────────────────
lens.parseAndEnqueue(geminiResponse.text, 'gemini');

// ─── Direct Execution ─────────────────────────────
await lens.execute({ type: 'highlight', selector: '.important-section' });

// ─── Controls ─────────────────────────────────────
lens.pause();
lens.resume();
lens.abort();

// ─── Cleanup ──────────────────────────────────────
lens.destroy();
```

---

## 8. React Adapter API (@agentlens/react)

```tsx
import { AgentLensProvider, useAgentLens, AgentLensOverlay } from '@agentlens/react';

function App() {
  return (
    <AgentLensProvider config={{
      cursor: { color: '#a855f7' },
      spotlight: { borderColor: '#a855f7' },
    }}>
      <Dashboard />
      <AgentLensOverlay />   {/* Renders cursor + spotlight DOM */}
    </AgentLensProvider>
  );
}

function AIChatPanel() {
  const lens = useAgentLens(); // access lens instance from context

  const handleGeminiResponse = (text: string) => {
    lens.parseAndEnqueue(text, 'gemini');
  };

  return <ChatUI onResponse={handleGeminiResponse} />;
}
```

---

## 9. System Prompt Templates (ActionParser.getSystemPrompt)

### 9.1 Gemini Format

```
When you want to perform a UI action, include an ACTION block in your response:

[ACTION]{"type":"click","selector":"#element-id","description":"Clicking the save button"}[/ACTION]

Supported action types:
- click: Click an element. Required: selector.
- fill: Type into an input. Required: selector, value.
- highlight: Visually highlight an element. Required: selector.
- scroll: Scroll the page. Required: selector. Optional: scroll.x, scroll.y.
- hover: Hover over an element. Required: selector.
- select: Choose a dropdown option. Required: selector, option.
- navigate: Go to a URL. Required: url.
- wait: Pause for a duration. Required: duration (ms).

Selector strategies (in order of preference):
1. data-agentlens="name" → [data-agentlens="save-button"]
2. ID → #submit-form
3. Aria label → [aria-label="Close dialog"]
4. Test ID → [data-testid="login-button"]
5. CSS selector → button.primary, input[placeholder="Email"]
6. Text content → text:Submit Application

You MAY include multiple ACTION blocks in a single response.
Continue speaking normally around the action blocks.
```

### 9.2 OpenAI Tool Definition

```json
{
  "type": "function",
  "function": {
    "name": "browser_action",
    "description": "Perform a visible action on the user's web page with animated cursor and spotlight",
    "parameters": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["click", "fill", "highlight", "scroll", "hover", "select", "navigate", "wait"] },
        "selector": { "type": "string", "description": "CSS selector or text:Content or [data-agentlens=name]" },
        "value": { "type": "string", "description": "Value for fill actions" },
        "url": { "type": "string", "description": "URL for navigate actions" },
        "description": { "type": "string", "description": "Human-readable description shown in popover" }
      },
      "required": ["type", "selector"]
    }
  }
}
```

---

## 10. CSS Custom Properties (Theming)

All visual aspects are controllable via CSS custom properties, enabling easy theming without JavaScript:

```css
:root {
  /* Cursor */
  --agentlens-cursor-size: 24px;
  --agentlens-cursor-color: #a855f7;
  --agentlens-cursor-glow-color: rgba(168, 85, 247, 0.6);
  --agentlens-cursor-glow-spread: 15px;

  /* Spotlight */
  --agentlens-spotlight-overlay: rgba(0, 0, 0, 0.7);
  --agentlens-spotlight-border-color: #a855f7;
  --agentlens-spotlight-border-width: 2px;
  --agentlens-spotlight-border-radius: 8px;
  --agentlens-spotlight-glow-color: rgba(168, 85, 247, 0.5);

  /* Popover */
  --agentlens-popover-bg: rgba(17, 17, 17, 0.95);
  --agentlens-popover-text: #e0e0e0;
  --agentlens-popover-border: #a855f7;
  --agentlens-popover-radius: 12px;

  /* Z-index */
  --agentlens-z-base: 100000;
}

/* Example: Green theme */
.agentlens-theme-green {
  --agentlens-cursor-color: #22c55e;
  --agentlens-cursor-glow-color: rgba(34, 197, 94, 0.6);
  --agentlens-spotlight-border-color: #22c55e;
  --agentlens-spotlight-glow-color: rgba(34, 197, 94, 0.5);
  --agentlens-popover-border: #22c55e;
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests (Vitest)

| Module | Test Cases |
|--------|-----------|
| `ActionQueue` | enqueue/dequeue ordering, clear, prepend, event emission, empty state |
| `ActionParser` | Parse Gemini format, OpenAI format, Anthropic format, invalid JSON handling, multiple actions in one text, nested brackets, edge cases |
| `SelectorResolver` | CSS selectors, XPath, text content, fuzzy match, retry logic, interactability checks, custom resolver |
| `DOMExecutor` | Click event dispatch, fill typing simulation, React value setter, select dropdown, navigate, scroll, event order verification |
| `CursorEngine` | Position updates, show/hide, animation completion, trail management, destroy cleanup |
| `SpotlightEngine` | Show/hide, Driver.js integration, custom popover rendering, style injection |
| `AgentLens` | Full orchestration: enqueue → spotlight → cursor → execute → cleanup, pause/resume, abort, destroy, event callbacks |

### 11.2 E2E Tests (Playwright)

```typescript
// Example E2E test
test('click action shows spotlight and cursor, then clicks element', async ({ page }) => {
  await page.goto('/test-app');

  // Inject AgentLens
  await page.evaluate(() => {
    const lens = new window.AgentLens();
    lens.enqueue({ type: 'click', selector: '#test-button' });
  });

  // Verify spotlight appears
  await expect(page.locator('.driver-active-element')).toBeVisible();

  // Verify cursor is visible and moving
  await expect(page.locator('.agentlens-cursor')).toBeVisible();

  // Verify button was clicked
  await expect(page.locator('#click-result')).toHaveText('clicked');

  // Verify cleanup
  await expect(page.locator('.driver-active-element')).not.toBeVisible();
  await expect(page.locator('.agentlens-cursor')).not.toBeVisible();
});
```

### 11.3 Visual Regression

Use Playwright `toHaveScreenshot()` to capture:
- Cursor at rest position
- Cursor mid-animation
- Spotlight active on various element shapes
- Popover positioning
- Multiple themes

---

## 12. Documentation Site Structure (VitePress)

```
docs/
├── index.md                    # Landing page with hero, demo GIF, quickstart
├── guide/
│   ├── getting-started.md      # Install, import, first action
│   ├── actions.md              # All action types with examples
│   ├── customization.md        # Theming, CSS vars, custom cursor/popover
│   ├── llm-integration.md      # System prompts, parsers, real-time APIs
│   ├── framework-adapters.md   # React, Vue adapters
│   ├── selector-strategies.md  # data-agentlens, CSS, XPath, text match
│   └── advanced.md             # Custom resolvers, event hooks, speed control
├── api/
│   ├── agentlens.md            # AgentLens class API reference
│   ├── action-queue.md         # ActionQueue API
│   ├── cursor-engine.md        # CursorEngine API
│   ├── spotlight-engine.md     # SpotlightEngine API
│   ├── dom-executor.md         # DOMExecutor API
│   ├── action-parser.md        # ActionParser API
│   ├── selector-resolver.md    # SelectorResolver API
│   └── types.md                # All TypeScript interfaces
└── examples/
    ├── gemini-live.md          # Full Gemini Live voice + actions demo
    ├── openai-realtime.md      # OpenAI Realtime API demo
    ├── guided-tour.md          # Using AgentLens as an onboarding tour
    └── testing.md              # Using AgentLens for visual test automation
```

---

## 13. Distribution & Publishing

| Item | Value |
|------|-------|
| **npm packages** | `agentlens`, `@agentlens/react`, `@agentlens/vue`, `@agentlens/parsers` |
| **CDN** | Auto-published to unpkg and jsdelivr via npm. UMD build for `<script>` tag usage |
| **License** | MIT |
| **Min browser support** | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| **Bundle size target** | Core < 15KB gzipped (excluding driver.js) |
| **Tree-shaking** | ESM output, `sideEffects: ["*.css"]` in package.json |
| **Semantic versioning** | Managed via Changesets |

### CDN Usage (Zero Build Step)

```html
<link rel="stylesheet" href="https://unpkg.com/agentlens/dist/styles/agentlens.css">
<script src="https://unpkg.com/agentlens/dist/index.umd.js"></script>
<script>
  const lens = new AgentLens.AgentLens({
    cursor: { color: '#00ff88' }
  });
  lens.enqueue({ type: 'click', selector: '#my-button' });
</script>
```

---

## 14. Roadmap (Future Modules)

| Feature | Description |
|---------|-------------|
| **Screen reader** | html2canvas / DOM-to-text serializer that sends page state to LLMs |
| **Recording** | Record action sequences to JSON, replay later (demo/testing) |
| **Annotation mode** | Let users annotate elements for the AI (`data-agentlens` auto-tagger) |
| **Multi-tab** | Coordinate actions across browser tabs via BroadcastChannel |
| **Undo** | Reverse fill/navigate actions (action history stack) |
| **Voice narration** | Optional Web Speech API narration of action descriptions |
| **Accessibility** | ARIA live regions announcing actions for screen reader users |
| **Analytics** | Track action success/failure rates, timing, selector hit rates |
| **Sandbox mode** | `executeActions: false` with full visual playback (safe demo mode) |

---

## 15. Example: Full Gemini Live Integration

```typescript
import { AgentLens, ActionParser } from 'agentlens';
import 'agentlens/styles';

const lens = new AgentLens({
  cursor: { color: '#a855f7', trailLength: 3 },
  spotlight: { showPopover: true },
  timing: { speedMultiplier: 1.2 },
  on: {
    onActionError: (action, err) => {
      console.warn(`Action failed: ${err.message}`, action);
    }
  }
});

// Connect to Gemini Live WebSocket
const ws = new WebSocket(`wss://generativelanguage.googleapis.com/...`);

ws.send(JSON.stringify({
  setup: {
    model: 'models/gemini-2.0-flash-exp',
    systemInstruction: {
      parts: [{
        text: `You are an AI assistant. ${ActionParser.getSystemPrompt('gemini')}`
      }]
    },
    generationConfig: {
      responseModalities: ['AUDIO', 'TEXT'],
    }
  }
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // Handle audio parts → play via AudioContext
  // ...

  // Handle text parts → parse for actions
  const textParts = data.serverContent?.modelTurn?.parts
    ?.filter(p => p.text)
    ?.map(p => p.text)
    ?.join('');

  if (textParts) {
    lens.parseAndEnqueue(textParts, 'gemini');
  }
};

// Cleanup on disconnect
ws.onclose = () => lens.destroy();
```

---

## 16. Naming & Branding

| | |
|---|---|
| **Name** | **AgentLens** |
| **Tagline** | *"See what your AI sees. Watch what your AI does."* |
| **Logo concept** | A magnifying glass (lens) with a cursor arrow inside it, emanating a subtle glow |
| **Primary color** | `#a855f7` (purple/violet — signals AI/intelligence) |
| **Accent** | `#22c55e` (green — signals "go"/execution) |

---

*This blueprint contains everything needed to build AgentLens from scratch. Feed this document to any AI coding agent or development team to produce a production-ready, publishable npm library.*
