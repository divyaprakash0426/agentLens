# Getting Started

## Install

```bash
pnpm add agentlens-core
```

## Initialize

```ts
import { AgentLens } from 'agentlens-core';
import 'agentlens-core/styles';

const lens = new AgentLens({
  cursor: { color: '#a855f7', trailLength: 2 },
  spotlight: { borderColor: '#a855f7' }
});
```

## Run actions

```ts
lens.enqueue([
  { type: 'fill', selector: '#email', value: 'user@example.com' },
  { type: 'click', selector: '#submit' }
]);
```
