import {easeInOutCubic, easeOutExpo} from '@motion-canvas/core';

// All animation durations (seconds) and curves live here.
// Algorithms must not know about time. Scenes pick timing from this file.
export const timing = {
  fast: 0.3,
  normal: 0.6,
  slow: 1.2,
} as const;

export const ease = {
  standard: easeInOutCubic,
  snap: easeOutExpo,
} as const;
