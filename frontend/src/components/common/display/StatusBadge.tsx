import { memo } from 'react';
import { Badge, type MantineColor, type MantineSize } from '@mantine/core';
import {
  COURSE_PUBLICATION_COLORS,
  COURSE_LEVEL_COLORS,
  ENROLLMENT_STATUS_COLORS,
  LESSON_TYPE_COLORS,
  PROGRESS_STATUS_COLORS,
} from '../../../constants/colors';

type StatusType = 'course' | 'level' | 'enrollment' | 'lessonType' | 'progress';

const colorMaps: Record<StatusType, Record<string, string>> = {
  course: COURSE_PUBLICATION_COLORS,
  level: COURSE_LEVEL_COLORS,
  enrollment: ENROLLMENT_STATUS_COLORS,
  lessonType: LESSON_TYPE_COLORS,
  progress: PROGRESS_STATUS_COLORS,
};

export interface StatusBadgeProps {
  type: StatusType;
  value: string;
  label: string;
  variant?: 'light' | 'filled' | 'outline' | 'dot' | 'default';
  size?: MantineSize;
  colorOverride?: MantineColor;
}

export const StatusBadge = memo(function StatusBadge({
  type,
  value,
  label,
  variant = 'light',
  size = 'sm',
  colorOverride,
}: StatusBadgeProps) {
  const colorMap = colorMaps[type];
  const color = colorOverride || colorMap[value] || 'gray';

  return (
    <Badge variant={variant} color={color} size={size}>
      {label}
    </Badge>
  );
});

export default StatusBadge;
