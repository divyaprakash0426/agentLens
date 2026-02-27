import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'AgentLens',
  description: 'Visualize AI-driven browser actions on live pages',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API', link: '/api/agentlens' },
      { text: 'Examples', link: '/examples/gemini-live' }
    ],
    sidebar: {
      '/guide/': [
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Actions', link: '/guide/actions' },
        { text: 'Customization', link: '/guide/customization' },
        { text: 'LLM Integration', link: '/guide/llm-integration' },
        { text: 'Framework Adapters', link: '/guide/framework-adapters' },
        { text: 'Selector Strategies', link: '/guide/selector-strategies' },
        { text: 'Advanced', link: '/guide/advanced' }
      ],
      '/api/': [
        { text: 'AgentLens', link: '/api/agentlens' },
        { text: 'ActionQueue', link: '/api/action-queue' },
        { text: 'CursorEngine', link: '/api/cursor-engine' },
        { text: 'SpotlightEngine', link: '/api/spotlight-engine' },
        { text: 'DOMExecutor', link: '/api/dom-executor' },
        { text: 'ActionParser', link: '/api/action-parser' },
        { text: 'SelectorResolver', link: '/api/selector-resolver' },
        { text: 'Types', link: '/api/types' }
      ],
      '/examples/': [
        { text: 'Gemini Live', link: '/examples/gemini-live' },
        { text: 'OpenAI Realtime', link: '/examples/openai-realtime' },
        { text: 'Guided Tour', link: '/examples/guided-tour' },
        { text: 'Testing', link: '/examples/testing' }
      ]
    }
  }
});
