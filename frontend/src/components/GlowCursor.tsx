import React, { useRef, useEffect, type HTMLAttributes, type ReactNode } from 'react';
import './GlowCursor.css';

type BlendMode = 'normal' | 'screen' | 'plus-lighter';

export interface GlowCursorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  color?: string;
  secondaryColor?: string;
  trailLength?: number;
  trailWidth?: number;
  trailTaper?: number;
  followSpeed?: number;
  glowIntensity?: number;
  glowSpread?: number;
  hotspot?: number;
  brightness?: number;
  opacity?: number;
  pulseSpeed?: number;
  noiseStrength?: number;
  idleFade?: boolean;
  idleTimeout?: number;
  fadeDuration?: number;
  blendMode?: BlendMode;
  maxDevicePixelRatio?: number;
  enabled?: boolean;
  children?: ReactNode;
}

const hexToRgba = (hex: string, alpha: number): string => {
  let value = (hex || '').replace('#', '').trim();
  if (value.length === 3) {
    value = value.split('').map((c) => c + c).join('');
  }
  const num = parseInt(value || 'ffffff', 16);
  if (isNaN(num)) return `rgba(255, 255, 255, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const GlowCursor: React.FC<GlowCursorProps> = ({
  color = '#FFFFFF',
  secondaryColor = '#A3A3A3',
  glowIntensity = 1.8,
  glowSpread = 1.2,
  opacity = 1,
  idleFade = true,
  idleTimeout = 800,
  blendMode = 'screen',
  enabled = true,
  children,
  className = '',
  style,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const primaryRgba = hexToRgba(color, 0.12 * glowIntensity * opacity);
    const secondaryRgba = hexToRgba(secondaryColor, 0.04 * glowIntensity * opacity);
    const glowRadius = Math.round(450 * glowSpread);

    el.style.setProperty('--glow-color', primaryRgba);
    el.style.setProperty('--glow-secondary', secondaryRgba);
    el.style.setProperty('--glow-size', `${glowRadius}px`);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
      el.style.setProperty('--glow-opacity', '1');

      if (idleFade) {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
          el.style.setProperty('--glow-opacity', '0');
        }, idleTimeout);
      }
    };

    const handlePointerLeave = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      el.style.setProperty('--glow-opacity', '0');
    };

    el.addEventListener('pointermove', handlePointerMove, { passive: true });
    el.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [color, secondaryColor, glowIntensity, glowSpread, opacity, idleFade, idleTimeout, enabled]);

  return (
    <div
      ref={containerRef}
      className={`glow-cursor${className ? ` ${className}` : ''}`}
      style={style}
      {...rest}
    >
      <div
        className="glow-cursor__spotlight"
        style={{ mixBlendMode: blendMode === 'normal' ? 'normal' : 'screen' }}
        aria-hidden="true"
      />
      <div className="glow-cursor__border" aria-hidden="true" />
      {children && <div className="glow-cursor__content">{children}</div>}
    </div>
  );
};

export default GlowCursor;
