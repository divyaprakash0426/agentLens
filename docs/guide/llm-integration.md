# LLM Integration

AgentLens is model-agnostic. Feed parsed actions from any LLM output.

```ts
import { ActionParser } from 'agentlens-core';

const prompt = ActionParser.getSystemPrompt('gemini');
const actions = lens.parseAndEnqueue(modelResponseText, 'gemini');
```

For provider-specific parsing helpers, use `agentlens-parsers`.
