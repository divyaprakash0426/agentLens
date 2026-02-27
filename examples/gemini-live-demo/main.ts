import { AgentLens, ActionParser } from 'agentlens-core';
import 'agentlens/styles';

const lens = new AgentLens({
  cursor: { color: '#a855f7', trailLength: 3 },
  spotlight: { showPopover: true }
});

const startButton = document.querySelector<HTMLButtonElement>('#start');
startButton?.addEventListener('click', () => {
  const ws = new WebSocket('wss://generativelanguage.googleapis.com/...');

  ws.addEventListener('open', () => {
    ws.send(
      JSON.stringify({
        setup: {
          model: 'models/gemini-2.0-flash-exp',
          systemInstruction: {
            parts: [{ text: `You are an assistant.\n${ActionParser.getSystemPrompt('gemini')}` }]
          }
        }
      })
    );
  });

  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    const textParts = data.serverContent?.modelTurn?.parts
      ?.filter((part: { text?: string }) => part.text)
      ?.map((part: { text: string }) => part.text)
      ?.join('');

    if (textParts) lens.parseAndEnqueue(textParts, 'gemini');
  });

  ws.addEventListener('close', () => lens.destroy());
});
