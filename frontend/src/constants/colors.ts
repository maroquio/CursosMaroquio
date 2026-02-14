export const PRIORITY_COLORS = {
  urgent: 'red',
  high: 'rose',
  medium: 'amber',
  low: 'slate',
} as const;

export const STATUS_COLORS = {
  pending: 'slate',
  in_progress: 'indigo',
  completed: 'emerald',
  cancelled: 'rose',
} as const;

export const COURSE_STATUS_COLORS = {
  not_started: 'slate',
  in_progress: 'indigo',
  completed: 'emerald',
} as const;

/** Colors for course publication status (admin) */
export const COURSE_PUBLICATION_COLORS = {
  draft: 'gray',
  published: 'green',
  archived: 'orange',
} as const;

/** Colors for course difficulty level */
export const COURSE_LEVEL_COLORS = {
  beginner: 'green',
  intermediate: 'yellow',
  advanced: 'red',
} as const;

/** Colors for enrollment status */
export const ENROLLMENT_STATUS_COLORS = {
  active: 'blue',
  completed: 'green',
  cancelled: 'red',
} as const;

/** Colors for lesson types */
export const LESSON_TYPE_COLORS = {
  video: 'violet',
  text: 'blue',
  quiz: 'orange',
  assignment: 'green',
} as const;

/** Colors for progress status */
export const PROGRESS_STATUS_COLORS = {
  not_started: 'gray',
  in_progress: 'yellow',
  completed: 'green',
} as const;

/** Color thresholds for progress bars */
export const PROGRESS_THRESHOLD_COLORS = {
  complete: 'green',    // 100%
  high: 'violet',       // >= 50%
  medium: 'yellow',     // >= 25%
  low: 'gray',          // < 25%
} as const;

/**
 * Get progress bar color based on percentage
 * @param progress - Progress percentage (0-100)
 * @returns Mantine color string
 */
export const getProgressColor = (progress: number): string => {
  if (progress === 100) return PROGRESS_THRESHOLD_COLORS.complete;
  if (progress >= 50) return PROGRESS_THRESHOLD_COLORS.high;
  if (progress >= 25) return PROGRESS_THRESHOLD_COLORS.medium;
  return PROGRESS_THRESHOLD_COLORS.low;
};

export const PRIMARY_GRADIENT = { from: 'indigo', to: 'violet', deg: 135 } as const;
export const ACCENT_GRADIENT = { from: 'pink', to: 'violet', deg: 135 } as const;
export const HERO_GRADIENT = { from: 'indigo', to: 'pink', deg: 135 } as const;
