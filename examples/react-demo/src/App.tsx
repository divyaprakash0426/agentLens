import { AgentLensOverlay, AgentLensProvider, useAgentLens } from 'agentlens-react';

function Controls() {
  const lens = useAgentLens();

  return (
    <button
      onClick={() =>
        lens.enqueue([
          { type: 'fill', selector: '#name', value: 'AgentLens', description: 'Typing name' },
          { type: 'click', selector: '#save', description: 'Clicking save' }
        ])
      }
    >
      Run Demo Actions
    </button>
  );
}

export default function App() {
  return (
    <AgentLensProvider
      config={{
        cursor: { color: '#a855f7', trailLength: 3 },
        spotlight: { borderColor: '#a855f7' }
      }}
    >
      <main style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '2rem', display: 'grid', gap: '1rem' }}>
        <h1>AgentLens React Demo</h1>
        <label>
          Name
          <input id="name" />
        </label>
        <button id="save" type="button">
          Save
        </button>
        <Controls />
      </main>
      <AgentLensOverlay />
    </AgentLensProvider>
  );
}
