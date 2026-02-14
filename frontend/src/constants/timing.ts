export const DEBOUNCE = {
  SEARCH: 300,
  VALIDATION: 200,
  RESIZE: 150,
} as const;

export const TRANSITION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
} as const;

export const AUTO_DISMISS = {
  MUTATION: 2000,
  SUCCESS: 3000,
  NOTIFICATION: 4000,
  TOAST: 5000,
} as const;

export const TRANSITION_CSS = {
  FAST: 'all 0.15s ease',
  NORMAL: 'all 0.2s ease',
  SLOW: 'all 0.3s ease',
} as const;
