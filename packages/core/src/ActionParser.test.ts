import { describe, expect, it } from 'vitest';
import { ActionParser } from './ActionParser';

describe('ActionParser', () => {
  it('parses Gemini ACTION blocks', () => {
    const text = 'Hello [ACTION]{"type":"click","selector":"#submit"}[/ACTION] world';
    const actions = ActionParser.parse(text, 'gemini');

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: 'click', selector: '#submit' });
  });

  it('parses OpenAI tool payloads embedded in text', () => {
    const text =
      '{"tool":"browser_action","input":{"type":"fill","selector":"#email","value":"user@example.com"}}';
    const actions = ActionParser.parse(text, 'openai');

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: 'fill', selector: '#email', value: 'user@example.com' });
  });

  it('parses OpenAI function call payloads', () => {
    const actions = ActionParser.parseOpenAI([
      {
        function: {
          name: 'browser_action',
          arguments: '{"type":"click","selector":"#checkout"}'
        }
      }
    ]);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: 'click', selector: '#checkout' });
  });

  it('parses Anthropic tool_use payloads', () => {
    const actions = ActionParser.parseAnthropic([
      {
        type: 'tool_use',
        name: 'browser_action',
        input: { type: 'highlight', selector: '.summary' }
      }
    ]);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: 'highlight', selector: '.summary' });
  });

  it('extracts JSON actions from generic blocks and ignores invalid JSON', () => {
    const text = `
      invalid {"type":"click"}
      \`\`\`json
      {"type":"wait","duration":200,"selector":"body"}
      \`\`\`
      {"tool":"browser_action","input":{"type":"click","selector":"#pay"}}
    `;

    const actions = ActionParser.parse(text, 'generic');
    expect(actions.some((action) => action.type === 'wait')).toBe(true);
    expect(actions.some((action) => action.selector === '#pay')).toBe(true);
  });
});
