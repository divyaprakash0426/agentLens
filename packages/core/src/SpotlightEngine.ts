import { driver, type Driver } from 'driver.js';
import type { AgentAction, SpotlightConfig } from './types';

export class SpotlightEngine {
  private driverInstance: Driver | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private visible = false;

  constructor(
    private config: SpotlightConfig,
    private container: HTMLElement = document.body,
    private zIndexBase = 100000
  ) {
    this.injectStyles();
    this.applyCssVariables();
  }

  show(element: HTMLElement, action?: AgentAction): void {
    this.ensureDriver();
    this.applyCssVariables();
    if (!this.driverInstance) return;

    const description = action?.description?.trim();
    const shouldShowPopover = this.config.showPopover ?? true;
    const popover =
      shouldShowPopover && (description || this.config.renderPopover)
        ? {
            title: 'AgentLens',
            description: description ?? '',
            side: this.mapPopoverSide(this.config.popoverPosition),
            align: 'center' as const,
            showButtons: [],
            showProgress: false,
            onPopoverRender: (dom: { title: HTMLElement; description: HTMLElement; wrapper: HTMLElement }) => {
              dom.wrapper.classList.add('agentlens-spotlight');
              if (!this.config.renderPopover) return;
              const resolvedAction =
                action ?? ({ type: 'highlight', selector: this.selectorFor(element), description } as AgentAction);
              const custom = this.config.renderPopover(resolvedAction, element);
              dom.description.innerHTML = '';
              if (typeof custom === 'string') {
                dom.description.innerHTML = custom;
              } else {
                dom.description.appendChild(custom);
              }
            }
          }
        : undefined;

    this.driverInstance.highlight({
      element,
      popover
    });

    this.visible = true;
  }

  showBySelector(selector: string, options?: { description?: string }): void {
    const root = this.container ?? document.body;
    const element = root.querySelector<HTMLElement>(selector) ?? document.querySelector<HTMLElement>(selector);
    if (!element) return;
    this.show(element, {
      type: 'highlight',
      selector,
      description: options?.description
    });
  }

  hide(): void {
    this.driverInstance?.destroy();
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible && Boolean(this.driverInstance?.isActive());
  }

  updateConfig(config: Partial<SpotlightConfig>): void {
    this.config = { ...this.config, ...config };
    this.applyCssVariables();
    this.driverInstance?.setConfig(this.getDriverConfig());
  }

  destroy(): void {
    this.driverInstance?.destroy();
    this.driverInstance = null;
    this.styleElement?.remove();
    this.styleElement = null;
    this.visible = false;
  }

  private ensureDriver(): void {
    if (this.driverInstance) return;
    this.driverInstance = driver(this.getDriverConfig());
  }

  private getDriverConfig() {
    return {
      animate: this.config.animate ?? true,
      allowClose: false,
      overlayClickBehavior: 'close' as const,
      stagePadding: this.config.padding ?? 8,
      stageRadius: this.config.borderRadius ?? 8,
      disableActiveInteraction: false,
      showButtons: [],
      showProgress: false,
      overlayColor: '#000',
      popoverClass: 'agentlens-spotlight'
    };
  }

  private mapPopoverSide(position?: SpotlightConfig['popoverPosition']) {
    if (!position || position === 'auto') return undefined;
    return position;
  }

  private selectorFor(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    return element.tagName.toLowerCase();
  }

  private applyCssVariables(): void {
    const root = document.documentElement;
    root.style.setProperty('--agentlens-spotlight-overlay', this.config.overlayColor ?? 'rgba(0, 0, 0, 0.7)');
    root.style.setProperty('--agentlens-spotlight-border-color', this.config.borderColor ?? '#a855f7');
    root.style.setProperty('--agentlens-spotlight-border-width', `${this.config.borderWidth ?? 2}px`);
    root.style.setProperty('--agentlens-spotlight-border-radius', `${this.config.borderRadius ?? 8}px`);
    root.style.setProperty('--agentlens-spotlight-glow-color', this.getGlowColor(this.config.boxShadow));
    root.style.setProperty('--agentlens-z-base', String(this.zIndexBase));
  }

  private getGlowColor(boxShadow?: string): string {
    if (!boxShadow) return 'rgba(168, 85, 247, 0.5)';
    const rgbaMatch = boxShadow.match(/rgba?\([^)]+\)/);
    return rgbaMatch?.[0] ?? 'rgba(168, 85, 247, 0.5)';
  }

  private injectStyles(): void {
    if (this.styleElement) return;
    const style = document.createElement('style');
    style.id = 'agentlens-driver-overrides';
    style.textContent = `
      .agentlens-spotlight.driver-popover {
        z-index: calc(var(--agentlens-z-base, 100000) + 2) !important;
      }
      .driver-overlay {
        z-index: var(--agentlens-z-base, 100000) !important;
      }
      .driver-stage {
        z-index: calc(var(--agentlens-z-base, 100000) + 1) !important;
      }
    `;
    document.head.appendChild(style);
    this.styleElement = style;
  }
}
