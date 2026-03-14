# agentlens-react

## 0.1.4

### Patch Changes

- 6c68ab4: Improve reliability for framework integrations and add Gemini Live helpers for UI action tooling.

  - allow `onNavigate` callbacks to intercept navigation by returning `true`
  - make config merging resilient for non-serializable runtime values (functions, DOM nodes)
  - add React runtime config helper for Server Component setups
  - add exported Gemini Live tool declarations, tool-call execution helpers, and session resumption storage utilities
  - improve React SSR safety and action-parser behavior during aborted queues

- Updated dependencies [6c68ab4]
  - agentlens-core@0.1.4

## 0.1.3

### Patch Changes

- 07e19de: Fix install commands in README (agentlens -> agentlens-core).
- Updated dependencies [07e19de]
  - agentlens-core@0.1.3

## 0.1.2

### Patch Changes

- 98baf70: Add README to all npm packages.
- Updated dependencies [98baf70]
  - agentlens-core@0.1.2

## 0.1.1

### Patch Changes

- ae7b97a: Initial release: AI-driven DOM automation framework with cursor visualization and spotlight highlighting.
- Updated dependencies [ae7b97a]
  - agentlens-core@0.1.1
