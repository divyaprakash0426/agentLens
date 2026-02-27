import { describe, expect, it } from 'vitest';
import { parseAnthropicActions } from './anthropic';
import { parseGenericActions } from './generic';
import { parseOpenAIActions } from './openai';

describe('@agentlens/parsers adapters', () => {
  it('parses OpenAI tool calls', () => {
    const actions = parseOpenAIActions([
      { function: { name: 'browser_action', arguments: '{"type":"click","selector":"#buy"}' } }
    ]);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: 'click', selector: '#buy' });
  });

  it('parses Anthropic tool blocks', () => {
    const actions = parseAnthropicActions([
      { type: 'tool_use', name: 'browser_action', input: { type: 'fill', selector: '#email', value: 'a@b.com' } }
    ]);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: 'fill', selector: '#email' });
  });

  it('parses generic JSON snippets', () => {
    const actions = parseGenericActions('{"tool":"browser_action","input":{"type":"wait","selector":"body","duration":10}}');
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: 'wait', duration: 10 });
  });
});
