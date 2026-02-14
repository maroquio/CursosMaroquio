import { memo } from 'react';
import { Group, Progress, Text } from '@mantine/core';
import { getProgressColor } from '../../../constants/colors';

export interface CourseProgressBarProps {
  progress: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showPercentage?: boolean;
  percentageWidth?: number;
  striped?: boolean;
  animated?: boolean;
  radius?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const CourseProgressBar = memo(function CourseProgressBar({
  progress,
  size = 'sm',
  showPercentage = true,
  percentageWidth = 40,
  striped,
  animated,
  radius = 'xl',
}: CourseProgressBarProps) {
  const color = getProgressColor(progress);
  const shouldStripe = striped ?? (progress < 100 && progress > 0);
  const shouldAnimate = animated ?? (progress < 100 && progress > 0);

  return (
    <Group gap="sm" wrap="nowrap" style={{ minWidth: showPercentage ? 150 : undefined }}>
      <Progress
        value={progress}
        size={size}
        radius={radius}
        color={color}
        striped={shouldStripe}
        animated={shouldAnimate}
        style={{ flex: 1 }}
      />
      {showPercentage && (
        <Text size="sm" c="dimmed" w={percentageWidth} ta="right">
          {progress}%
        </Text>
      )}
    </Group>
  );
});

export default CourseProgressBar;
