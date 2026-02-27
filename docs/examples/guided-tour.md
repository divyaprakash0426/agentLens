# Guided Tour Example

Use AgentLens as a guided UI walkthrough:

```ts
lens.enqueue([
  { type: 'highlight', selector: '#sidebar', description: 'Main navigation' },
  { type: 'highlight', selector: '#search', description: 'Global search' },
  { type: 'click', selector: '#settings', description: 'Open settings' }
]);
```
