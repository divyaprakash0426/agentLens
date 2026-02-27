# Actions

AgentLens supports these action types:

- `click`
- `fill`
- `highlight`
- `scroll`
- `hover`
- `select`
- `navigate`
- `wait`
- `assert`

```ts
lens.enqueue({ type: 'highlight', selector: '.hero', description: 'Highlighting hero section' });
```
