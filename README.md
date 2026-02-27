# AgentLens

<p align="center">
  <strong>See what your AI sees. Watch what your AI does.</strong>
</p>

<p align="center">
  <a href="https://github.com/divyaprakash0426/agentLens/actions/workflows/ci.yml"><img src="https://github.com/divyaprakash0426/agentLens/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/framework-agnostic-brightgreen" alt="Framework Agnostic">
</p>

AgentLens is a framework-agnostic browser library that makes AI-driven page interactions **visible**. It renders every action your AI agent takes — clicking, typing, scrolling, navigating — as an animated cursor with spotlight highlighting, giving users and developers a clear window into what the AI is doing on the page.

---

## Table of Contents

- [Why AgentLens](#why-agentlens)
- [Features](#features)
- [Packages](#packages)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Action Types](#action-types)
- [Configuration](#configuration)
- [Event Callbacks](#event-callbacks)
- [React](#react)
- [Vue](#vue)
- [LLM Integration](#llm-integration)
- [CSS Customization](#css-customization)
- [Development](#development)
- [License](#license)

---

## Why AgentLens

When AI agents automate browser tasks, users lose trust because they can't see what the AI is doing. AgentLens solves this by:

- **Showing cursor movement** — a smooth animated cursor travels to every element before acting on it
- **Spotlighting elements** — the target element is highlighted with a customizable overlay before each action
- **Describing actions** — optional popovers explain what the AI is doing at each step
- **Executing actions** — optionally performs the real DOM actions (click, fill, scroll, etc.) so you get both visualization and execution in one

---

## Features

- 🖱️ Smooth animated cursor with configurable speed, color, glow, and trail
- 🔦 Element spotlight with overlay, border, padding, and popover support
- ⚡ Full action execution engine: click, fill, scroll, hover, select, navigate, wait, assert
- 🤖 LLM-agnostic: parse action sequences from Gemini, OpenAI, Anthropic, or any custom format
- ⚛️ First-class React and Vue adapters (provider + hooks/composables)
- 🎨 Fully customizable via config and CSS variables
- 🧩 Framework-agnostic core — works with vanilla JS or any UI framework
- ⏸️ Pause, resume, and abort mid-sequence
- 📡 Rich event callbacks for every stage of execution

---

## Packages

| Package | Description |
|---|---|
| `agentlens-core` | Core library — cursor, spotlight, action queue, DOM executor |
| `agentlens-parsers` | LLM output parsers for Gemini, OpenAI, Anthropic, and generic formats |
| `agentlens-react` | React provider + `useAgentLens` hook + overlay component |
| `agentlens-vue` | Vue 3 provider + `useAgentLens` composable + overlay component |

---

## Installation

```bash
# Core only
npm install agentlens-core

# With LLM parsers
npm install agentlens-core agentlens-parsers

# React adapter
npm install agentlens-core agentlens-react

# Vue adapter
npm install agentlens-core agentlens-vue
```

---

## Quick Start

### Vanilla JS / TypeScript

```ts
import { AgentLens } from 'agentlens-core';
import 'agentlens-core/styles'; // import default styles

const lens = new AgentLens({
  cursor: { color: '#a855f7', trailLength: 2 },
  spotlight: { borderColor: '#a855f7', showPopover: true },
});

// Enqueue a sequence of actions
lens.enqueue([
  { type: 'fill',  selector: '#email',    value: 'user@example.com', description: 'Entering email' },
  { type: 'fill',  selector: '#password', value: 'secret',           description: 'Entering password' },
  { type: 'click', selector: '#login',                               description: 'Logging in' },
]);
```

### Single action

```ts
lens.enqueue({ type: 'highlight', selector: '.hero', description: 'Look here!' });
```

### Control playback

```ts
lens.pause();
lens.resume();
lens.abort();
lens.destroy(); // clean up all DOM elements and listeners
```

---

## Action Types

| Type | Description | Key Fields |
|---|---|---|
| `click` | Click an element | `selector` |
| `fill` | Type text into an input | `selector`, `value` |
| `hover` | Hover over an element | `selector` |
| `highlight` | Spotlight element without action | `selector`, `description` |
| `scroll` | Scroll page or element | `selector`, `scroll.x/y`, `scroll.behavior` |
| `select` | Select a `<select>` option | `selector`, `option` |
| `navigate` | Navigate to a URL | `url` |
| `wait` | Pause for a duration | `duration` (ms) |
| `assert` | Assert element state | `selector`, `assert.visible`, `assert.text`, `assert.attribute` |

```ts
// All fields shown
lens.enqueue([
  // Navigate first
  { type: 'navigate', selector: '', url: 'https://example.com' },

  // Scroll smoothly
  { type: 'scroll', selector: '#feed', scroll: { y: 500, behavior: 'smooth' } },

  // Select a dropdown option
  { type: 'select', selector: '#country', option: 'India' },

  // Assert text content
  { type: 'assert', selector: '#status', assert: { text: 'Active' } },

  // Wait 1 second
  { type: 'wait', selector: '', duration: 1000 },
]);
```

---

## Configuration

Pass a config object to `new AgentLens(config)`:

### Cursor

```ts
cursor: {
  color: '#a855f7',          // cursor dot color
  size: 16,                  // dot size in px
  glowColor: '#a855f7',      // glow effect color
  glowSpread: 12,            // glow blur radius
  trailLength: 2,            // number of trail dots (0 = off)
  trailDecay: 0.8,           // trail opacity decay per dot
  speed: 1,                  // playback speed multiplier
  initiallyVisible: false,   // show cursor before first action
}
```

### Spotlight

```ts
spotlight: {
  overlayColor: 'rgba(0,0,0,0.4)',  // overlay backdrop color
  borderColor: '#a855f7',            // highlight border color
  borderWidth: 2,                    // border thickness in px
  borderRadius: 8,                   // border radius in px
  padding: 8,                        // padding around element in px
  animate: true,                     // entrance animation
  animationDuration: 300,            // ms
  showPopover: true,                 // show description popover
  popoverPosition: 'auto',           // 'auto' | 'top' | 'bottom' | 'left' | 'right'
  renderPopover: (action, el) => `<strong>${action.description}</strong>`, // custom HTML
}
```

### Timing

```ts
timing: {
  preAnimationDelay: 100,           // delay before cursor starts moving (ms)
  cursorAnimationDuration: 600,     // cursor travel time (ms)
  preExecutionDelay: 200,           // delay between cursor arrival and action (ms)
  postActionSpotlightDuration: 800, // how long spotlight stays after action (ms)
  interActionDelay: 300,            // gap between actions (ms)
  typingSpeed: 60,                  // ms per character when filling inputs
  speedMultiplier: 1,               // global speed multiplier (2 = 2x faster)
}
```

### Execution

```ts
execution: {
  executeActions: true,      // actually perform DOM actions
  scrollIntoView: true,      // auto-scroll target into viewport
  scrollBehavior: 'smooth',  // 'smooth' | 'instant'
  dispatchEvents: true,      // fire native input/change/click events
  clearBeforeFill: true,     // clear input before typing
  retry: { attempts: 3, delay: 500 }, // retry on selector not found
  selectorTimeout: 5000,     // max wait for selector to appear (ms)
}
```

---

## Event Callbacks

```ts
const lens = new AgentLens({
  on: {
    onQueueStart:        ()                            => console.log('Queue started'),
    onQueueEmpty:        ()                            => console.log('All done'),
    onActionStart:       (action, element)             => console.log('Starting', action.type),
    onActionComplete:    (action, element)             => console.log('Done', action.type),
    onActionError:       (action, error)               => console.error(error.code, error.message),
    onSelectorNotFound:  (selector, action)            => console.warn('Not found:', selector),
    onCursorMove:        (x, y)                        => {},
    onSpotlight:         (action, element)             => {},
    onClick:             (element)                     => {},
    onType:              (element, char, currentValue) => {},
    onNavigate:          (url)                         => {},
  },
});
```

> `onActionStart` can return `false` to skip a specific action.

---

## React

```bash
npm install agentlens-core agentlens-react
```

Wrap your app with `AgentLensProvider` and render `AgentLensOverlay`:

```tsx
import { AgentLensProvider, AgentLensOverlay, useAgentLens } from 'agentlens-react';
import 'agentlens-core/styles';

function AIControls() {
  const lens = useAgentLens();

  const runDemo = () => lens.enqueue([
    { type: 'fill',  selector: '#name',  value: 'Alice', description: 'Filling name' },
    { type: 'click', selector: '#submit',                description: 'Submitting' },
  ]);

  return <button onClick={runDemo}>Run AI Demo</button>;
}

export default function App() {
  return (
    <AgentLensProvider config={{ cursor: { color: '#a855f7' }, spotlight: { showPopover: true } }}>
      {/* your app */}
      <form>
        <input id="name" placeholder="Name" />
        <button id="submit" type="submit">Submit</button>
      </form>
      <AIControls />
      <AgentLensOverlay /> {/* renders cursor + spotlight layer */}
    </AgentLensProvider>
  );
}
```

---

## Vue

```bash
npm install agentlens-core agentlens-vue
```

```vue
<script setup lang="ts">
import { AgentLensProvider, AgentLensOverlay, useAgentLens } from 'agentlens-vue';

const config = { cursor: { color: '#a855f7' }, spotlight: { showPopover: true } };
</script>

<template>
  <AgentLensProvider :config="config">
    <!-- your app -->
    <AgentLensOverlay />
  </AgentLensProvider>
</template>
```

Access the instance inside a child component:

```vue
<script setup lang="ts">
import { useAgentLens } from 'agentlens-vue';
const lens = useAgentLens();

const run = () => lens.enqueue([
  { type: 'fill',  selector: '#email', value: 'test@example.com' },
  { type: 'click', selector: '#send' },
]);
</script>
```

---

## LLM Integration

AgentLens can parse raw LLM output into actions. Include the system prompt in your model request so it knows how to format its response:

```ts
import { ActionParser } from 'agentlens-core';

// Get the system prompt to send to your model
const systemPrompt = ActionParser.getSystemPrompt('gemini'); // or 'openai' | 'anthropic' | 'generic'

// Parse the model's response directly into the queue
lens.parseAndEnqueue(modelResponseText, 'gemini');
```

### Gemini Live (WebSocket)

```ts
import { AgentLens, ActionParser } from 'agentlens-core';

const lens = new AgentLens({ cursor: { color: '#a855f7' }, spotlight: { showPopover: true } });

const ws = new WebSocket('wss://generativelanguage.googleapis.com/...');

ws.addEventListener('open', () => {
  ws.send(JSON.stringify({
    setup: {
      model: 'models/gemini-2.0-flash-exp',
      systemInstruction: {
        parts: [{ text: `You are a helpful assistant.\n${ActionParser.getSystemPrompt('gemini')}` }],
      },
    },
  }));
});

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  const text = data.serverContent?.modelTurn?.parts
    ?.filter((p: any) => p.text)
    ?.map((p: any) => p.text)
    ?.join('');

  if (text) lens.parseAndEnqueue(text, 'gemini');
});

ws.addEventListener('close', () => lens.destroy());
```

### OpenAI Realtime

```ts
import { AgentLens, ActionParser } from 'agentlens-core';
import { parseOpenAIActions } from 'agentlens-parsers';

const lens = new AgentLens();

// Use the parsers package for provider-specific response handling
const actions = parseOpenAIActions(openAIResponse);
lens.enqueue(actions);
```

### Provider-specific parsers (`agentlens-parsers`)

```ts
import { parseGeminiActions, parseOpenAIActions, parseAnthropicActions, parseGenericActions } from 'agentlens-parsers';

const actions = parseGeminiActions(rawGeminiResponse);
lens.enqueue(actions);
```

---

## CSS Customization

Import the default styles and override via CSS variables:

```html
<link rel="stylesheet" href="node_modules/agentlens-core/dist/styles/agentlens.css" />
```

```css
:root {
  --agentlens-cursor-color: #a855f7;
  --agentlens-cursor-size: 16px;
  --agentlens-cursor-glow: rgba(168, 85, 247, 0.4);
  --agentlens-spotlight-border-color: #a855f7;
  --agentlens-spotlight-overlay: rgba(0, 0, 0, 0.45);
  --agentlens-popover-bg: #1e1e2e;
  --agentlens-popover-text: #cdd6f4;
  --agentlens-z-index: 9999;
}
```

---

## Development

```bash
# Install dependencies
pnpm install

# Type checking
pnpm typecheck

# Run tests
pnpm test

# Build all packages
pnpm build

# Local docs dev server
pnpm docs:dev

# Build docs for production
pnpm docs:build
```

### Project Structure

```
agentLens/
├── packages/
│   ├── core/          # agentlens-core — cursor, spotlight, queue, executor
│   ├── parsers/       # agentlens-parsers — LLM output parsers
│   ├── react/         # agentlens-react — React adapter
│   └── vue/           # agentlens-vue — Vue 3 adapter
├── examples/
│   ├── vanilla-demo/
│   ├── react-demo/
│   ├── gemini-live-demo/
│   └── openai-realtime-demo/
├── docs/              # VitePress documentation site
└── tests/e2e/         # Playwright end-to-end tests
```

---

## License

MIT © [Divyaprakash Dhurandhar](https://github.com/divyaprakash0426)
