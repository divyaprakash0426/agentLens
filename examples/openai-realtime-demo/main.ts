import { AgentLens } from 'agentlens';
import 'agentlens/styles';

const lens = new AgentLens();

document.querySelector<HTMLButtonElement>('#connect')?.addEventListener('click', () => {
  console.info('Connect this demo to OpenAI Realtime and route tool calls to AgentLens.');
});

document.querySelector<HTMLButtonElement>('#checkout')?.addEventListener('click', () => {
  lens.enqueue([
    { type: 'fill', selector: '#email', value: 'user@example.com', description: 'Typing email address' },
    { type: 'click', selector: '#submit', description: 'Submitting form' }
  ]);
});
