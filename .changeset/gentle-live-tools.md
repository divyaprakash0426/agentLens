"agentlens-core": minor
"agentlens-react": minor
---

Improve reliability for framework integrations and add Gemini Live helpers for UI action tooling.

- allow `onNavigate` callbacks to intercept navigation by returning `true`
- make config merging resilient for non-serializable runtime values (functions, DOM nodes)
- add React runtime config helper for Server Component setups
- add exported Gemini Live tool declarations, tool-call execution helpers, and session resumption storage utilities
- improve React SSR safety and action-parser behavior during aborted queues
