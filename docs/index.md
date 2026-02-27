# AgentLens

See what your AI sees. Watch what your AI does.

AgentLens is a framework-agnostic browser library that renders AI actions as a visible animated cursor + spotlight, while optionally executing real DOM interactions.

## Quickstart

```bash
pnpm add agentlens
```

```ts
import { AgentLens } from 'agentlens';
import 'agentlens/styles';

const lens = new AgentLens();
lens.enqueue({ type: 'click', selector: '#submit' });
```

Continue with the [Guide](/guide/getting-started) and [API Reference](/api/agentlens).
