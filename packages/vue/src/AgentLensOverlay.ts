import { defineComponent } from 'vue';
import { useAgentLens } from './useAgentLens';

export const AgentLensOverlay = defineComponent({
  name: 'AgentLensOverlay',
  setup() {
    useAgentLens();
    return () => null;
  }
});
