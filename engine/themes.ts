import type { ThemeName } from '@/lib/types';

/**
 * Colour systems for the stage. Triplet strings ("r,g,b") are composed into
 * rgba() with effect-driven alphas inside the renderer.
 */
export interface Theme {
  /** Aurora blob colours. */
  blobA: string;
  blobB: string;
  blobC: string;
  /** Particle/spectrum hue range (degrees) + saturation. */
  hueMin: number;
  hueMax: number;
  particleSat: number;
  /** Active-word vertical gradient. */
  gradTop: string;
  gradMid: string;
  gradBottom: string;
  sung: string;
  unsung: string;
  glow: string;
  glowSoft: string;
  /** Accent pair (progress bar, rings, outlines). */
  accentA: string;
  accentB: string;
  /** God rays + shockwaves + beat flash ("r,g,b"). */
  rays: string;
  flash: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  aurora: {
    blobA: '64,92,255',
    blobB: '168,64,255',
    blobC: '24,210,220',
    hueMin: 195,
    hueMax: 285,
    particleSat: 90,
    gradTop: '#9ef3ff',
    gradMid: '#ffffff',
    gradBottom: '#c6a8ff',
    sung: 'rgba(235, 240, 255, 0.96)',
    unsung: 'rgba(160, 172, 205, 0.5)',
    glow: 'rgba(120, 200, 255, 0.95)',
    glowSoft: 'rgba(90, 120, 255, 0.35)',
    accentA: '#36d6ff',
    accentB: '#b36bff',
    rays: '130,170,255',
    flash: '190,220,255',
  },
  inferno: {
    blobA: '255,84,32',
    blobB: '255,160,24',
    blobC: '255,40,96',
    hueMin: 8,
    hueMax: 52,
    particleSat: 95,
    gradTop: '#ffd9a0',
    gradMid: '#ffffff',
    gradBottom: '#ff9e8e',
    sung: 'rgba(255, 240, 226, 0.96)',
    unsung: 'rgba(205, 168, 150, 0.5)',
    glow: 'rgba(255, 170, 90, 0.95)',
    glowSoft: 'rgba(255, 110, 60, 0.35)',
    accentA: '#ffb136',
    accentB: '#ff4d6b',
    rays: '255,150,70',
    flash: '255,210,160',
  },
  velvet: {
    blobA: '255,64,180',
    blobB: '140,64,255',
    blobC: '255,120,220',
    hueMin: 278,
    hueMax: 335,
    particleSat: 92,
    gradTop: '#ffb3e6',
    gradMid: '#ffffff',
    gradBottom: '#d3a8ff',
    sung: 'rgba(252, 234, 248, 0.96)',
    unsung: 'rgba(190, 158, 198, 0.5)',
    glow: 'rgba(255, 130, 220, 0.95)',
    glowSoft: 'rgba(190, 90, 255, 0.35)',
    accentA: '#ff6bd5',
    accentB: '#9b6bff',
    rays: '255,110,220',
    flash: '255,190,235',
  },
  noir: {
    blobA: '180,195,225',
    blobB: '90,105,140',
    blobC: '90,200,230',
    hueMin: 200,
    hueMax: 225,
    particleSat: 22,
    gradTop: '#eaf4ff',
    gradMid: '#ffffff',
    gradBottom: '#b9c6e8',
    sung: 'rgba(238, 242, 250, 0.96)',
    unsung: 'rgba(150, 158, 178, 0.5)',
    glow: 'rgba(220, 235, 255, 0.9)',
    glowSoft: 'rgba(170, 190, 230, 0.3)',
    accentA: '#cfd8ec',
    accentB: '#7fe8ff',
    rays: '200,215,240',
    flash: '230,240,255',
  },
};
