import { describe, expect, it } from 'vitest';
import { parseGeminiActions } from './gemini';

describe('parseGeminiActions', () => {
  it('parses ACTION-tag JSON payloads', () => {
    const text = `Hello [ACTION]{"type":"click","selector":"#save"}[/ACTION] world`;
    const actions = parseGeminiActions(text);
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: 'click', selector: '#save' });
  });
});
