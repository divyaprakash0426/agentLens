# Gemini Live Example

See `examples/gemini-live-demo/main.ts` for a complete websocket integration skeleton:

- Connect to Gemini Live
- Inject `ActionParser.getSystemPrompt('gemini')`
- Parse text responses via `lens.parseAndEnqueue(text, 'gemini')`
