import { describe, expect, it, vi } from 'vitest';
import {
  createBrowserSessionResumptionStore,
  createGeminiLiveActionTools,
  executeGeminiLiveToolCalls
} from './geminiLive';

describe('geminiLive helpers', () => {
  it('creates native Gemini Live tool declarations', () => {
    const tools = createGeminiLiveActionTools();

    expect(tools).toHaveLength(1);
    expect(tools[0].functionDeclarations.some((declaration) => declaration.name === 'agentlens_click')).toBe(true);
    expect(tools[0].functionDeclarations.some((declaration) => declaration.name === 'agentlens_navigate')).toBe(true);
  });

  it('executes Gemini Live tool calls through AgentLens', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const lens = { execute };

    const responses = await executeGeminiLiveToolCalls(lens, [
      {
        id: 'call-1',
        name: 'agentlens_click',
        args: {
          selector: '[data-agent-id="settings-item-travel-policy"]',
          description: 'Open the travel policy settings'
        }
      },
      {
        id: 'call-2',
        name: 'agentlens_navigate',
        args: {
          url: '/dashboard/settings'
        }
      }
    ]);

    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: 'click',
        selector: '[data-agent-id="settings-item-travel-policy"]',
        description: 'Open the travel policy settings'
      })
    );
    expect(execute).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        type: 'navigate',
        selector: 'body',
        url: '/dashboard/settings'
      })
    );
    expect(responses.map((response) => response.response.status)).toEqual(['ok', 'ok']);
  });

  it('stores and clears resumable session handles', () => {
    const backingStore = new Map<string, string>();
    const storage = {
      getItem: (key: string) => backingStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        backingStore.set(key, value);
      },
      removeItem: (key: string) => {
        backingStore.delete(key);
      }
    } as Storage;

    const store = createBrowserSessionResumptionStore('agentlens:test-handle', storage);

    expect(store.getHandle()).toBeNull();
    store.setHandle('resume-token-123');
    expect(store.getHandle()).toBe('resume-token-123');
    store.clearHandle();
    expect(store.getHandle()).toBeNull();
  });
});
