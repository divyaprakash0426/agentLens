# AgentLens API

`AgentLens` is the main orchestrator class.

## Methods

- `enqueue(actions)`
- `parseAndEnqueue(text, format?)`
- `execute(action)`
- `pause()`, `resume()`, `abort()`
- `clearQueue()`, `getQueueState()`
- `moveCursorTo(x, y)`
- `spotlightElement(selector, options?)`
- `configure(config)`
- `destroy()`
