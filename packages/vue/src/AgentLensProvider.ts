import { AgentLens, type AgentLensConfig } from 'agentlens';
import { defineComponent, type PropType, provide, watch, onBeforeUnmount } from 'vue';
import { AgentLensKey } from './context';

export const AgentLensProvider = defineComponent({
  name: 'AgentLensProvider',
  props: {
    config: {
      type: Object as PropType<AgentLensConfig | undefined>,
      required: false
    }
  },
  setup(props, { slots }) {
    const lens = new AgentLens(props.config);
    provide(AgentLensKey, lens);

    watch(
      () => props.config,
      (nextConfig) => {
        if (nextConfig) lens.configure(nextConfig);
      },
      { deep: true }
    );

    onBeforeUnmount(() => {
      lens.destroy();
    });

    return () => slots.default?.();
  }
});
