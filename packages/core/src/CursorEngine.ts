import { PerfectCursor } from 'perfect-cursors';
import type { CursorConfig } from './types';
import { clamp } from './utils';

export class CursorEngine {
  private cursorElement: HTMLElement;
  private trailElements: HTMLElement[] = [];
  private perfectCursor: PerfectCursor;
  private currentPos: [number, number] = [0, 0];
  private recentPositions: [number, number][] = [];
  private visible = false;
  private destroyed = false;
  private resolveTimer: number | null = null;

  constructor(
    private config: CursorConfig,
    private container: HTMLElement,
    private onMove?: (x: number, y: number) => void
  ) {
    this.cursorElement = this.createCursorElement();
    this.container.appendChild(this.cursorElement);
    this.createTrailElements();
    this.applyConfig(this.config);
    this.perfectCursor = new PerfectCursor((point) => {
      this.applyPosition([point[0], point[1]]);
    });

    const center: [number, number] = [window.innerWidth / 2, window.innerHeight / 2];
    this.applyPosition(center);
    this.perfectCursor.addPoint([center[0], center[1]]);

    if (!this.config.initiallyVisible) this.hide();
  }

  animateTo(target: [number, number], duration?: number): Promise<void> {
    if (this.destroyed) return Promise.resolve();
    this.show();

    const [startX, startY] = this.currentPos;
    const [endX, endY] = target;
    const distance = Math.hypot(endX - startX, endY - startY);
    const speed = this.config.speed ?? 1;
    const computedDuration = duration ?? clamp((distance * 2) / Math.max(speed, 0.1), 120, 1200);
    const controlPoint = this.getControlPoint([startX, startY], [endX, endY]);

    this.perfectCursor.addPoint([controlPoint[0], controlPoint[1]]);
    this.perfectCursor.addPoint([endX, endY]);

    return new Promise((resolve) => {
      if (this.resolveTimer) {
        window.clearTimeout(this.resolveTimer);
      }
      this.resolveTimer = window.setTimeout(() => {
        this.resolveTimer = null;
        this.applyPosition([endX, endY]);
        resolve();
      }, Math.ceil(computedDuration + 80));
    });
  }

  setPosition(pos: [number, number]): void {
    this.perfectCursor.addPoint([pos[0], pos[1]]);
    this.applyPosition(pos);
  }

  show(): void {
    this.visible = true;
    this.cursorElement.style.opacity = '1';
    for (const trail of this.trailElements) {
      trail.style.opacity = '0.2';
    }
  }

  hide(): void {
    this.visible = false;
    this.cursorElement.style.opacity = '0';
    for (const trail of this.trailElements) {
      trail.style.opacity = '0';
    }
  }

  getPosition(): [number, number] {
    return this.currentPos;
  }

  updateConfig(config: Partial<CursorConfig>): void {
    this.config = { ...this.config, ...config };
    this.applyConfig(this.config);

    const desiredLength = clamp(this.config.trailLength ?? 0, 0, 10);
    if (desiredLength !== this.trailElements.length) {
      for (const trail of this.trailElements) trail.remove();
      this.trailElements = [];
      this.createTrailElements();
    }
  }

  destroy(): void {
    this.destroyed = true;
    if (this.resolveTimer) window.clearTimeout(this.resolveTimer);
    this.perfectCursor.dispose();
    this.cursorElement.remove();
    for (const trail of this.trailElements) trail.remove();
    this.trailElements = [];
  }

  private createCursorElement(): HTMLElement {
    const cursor = document.createElement('div');
    cursor.className = 'agentlens-cursor';

    if (typeof this.config.element === 'string') {
      cursor.innerHTML = this.config.element;
      return cursor;
    }

    if (this.config.element instanceof HTMLElement) {
      cursor.appendChild(this.config.element.cloneNode(true));
      return cursor;
    }

    const dot = document.createElement('div');
    dot.className = 'agentlens-cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'agentlens-cursor-ring';
    cursor.append(dot, ring);
    return cursor;
  }

  private createTrailElements(): void {
    const trailLength = clamp(this.config.trailLength ?? 0, 0, 10);
    for (let index = 0; index < trailLength; index += 1) {
      const trail = document.createElement('div');
      trail.className = 'agentlens-cursor-trail-dot';
      trail.style.opacity = '0';
      this.container.appendChild(trail);
      this.trailElements.push(trail);
    }
  }

  private updateTrail(): void {
    if (!this.visible) return;
    const decay = clamp(this.config.trailDecay ?? 0.3, 0.05, 1);

    this.trailElements.forEach((trail, index) => {
      const positionIndex = (index + 1) * 2;
      const position = this.recentPositions[positionIndex] ?? this.currentPos;
      const opacity = Math.max(0, decay - index * (decay / (this.trailElements.length + 1)));
      trail.style.transform = `translate(${position[0]}px, ${position[1]}px)`;
      trail.style.opacity = opacity.toFixed(2);
    });
  }

  private applyPosition(pos: [number, number]): void {
    this.currentPos = pos;
    const [x, y] = pos;
    this.cursorElement.style.transform = `translate(${x}px, ${y}px)`;
    this.recentPositions.unshift(pos);
    this.recentPositions = this.recentPositions.slice(0, 40);
    this.updateTrail();
    this.onMove?.(x, y);
  }

  private getControlPoint(from: [number, number], to: [number, number]): [number, number] {
    const [x1, y1] = from;
    const [x2, y2] = to;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / distance;
    const normalY = dx / distance;
    const bend = clamp(distance * 0.08, 6, 30);
    return [midX + normalX * bend, midY + normalY * bend];
  }

  private applyConfig(config: CursorConfig): void {
    const size = `${config.size ?? 24}px`;
    const color = config.color ?? '#a855f7';
    const glowColor = config.glowColor ?? 'rgba(168, 85, 247, 0.6)';
    const glowSpread = `${config.glowSpread ?? 15}px`;

    this.cursorElement.style.setProperty('--agentlens-cursor-size', size);
    this.cursorElement.style.setProperty('--agentlens-cursor-color', color);
    this.cursorElement.style.setProperty('--agentlens-cursor-glow-color', glowColor);
    this.cursorElement.style.setProperty('--agentlens-cursor-glow-spread', glowSpread);
    this.cursorElement.style.zIndex = '100001';

    for (const trail of this.trailElements) {
      trail.style.setProperty('--agentlens-cursor-size', size);
      trail.style.setProperty('--agentlens-cursor-color', color);
      trail.style.zIndex = '100000';
    }
  }
}
