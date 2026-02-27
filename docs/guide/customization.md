# Customization

Use config and CSS variables to customize visuals.

```ts
const lens = new AgentLens({
  cursor: { color: '#22c55e', size: 20, trailLength: 3 },
  spotlight: { borderColor: '#22c55e', padding: 12 }
});
```

```css
:root {
  --agentlens-cursor-color: #22c55e;
  --agentlens-spotlight-border-color: #22c55e;
}
```
