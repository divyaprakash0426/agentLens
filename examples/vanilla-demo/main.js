import { AgentLens, ActionParser } from 'agentlens';
import 'agentlens/styles';

const lens = new AgentLens({
  cursor: { color: '#22c55e', trailLength: 2 },
  spotlight: { borderColor: '#22c55e' },
  on: {
    onActionError: (action, error) => console.warn('Action error:', action, error)
  }
});

lens.enqueue([
  { type: 'fill', selector: '#email', value: 'demo@example.com', description: 'Typing email' },
  { type: 'fill', selector: '#password', value: 'hunter2', description: 'Typing password' },
  { type: 'click', selector: '#login-btn', description: 'Submitting login form' }
]);

window.parseAgentActions = (text) => {
  const prompt = ActionParser.getSystemPrompt('gemini');
  console.info('System prompt for model:', prompt);
  return lens.parseAndEnqueue(text, 'gemini');
};
