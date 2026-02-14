import { memo } from 'react';
import { Group, Progress, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconTrophy, IconClock, IconBook, IconCalendar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ThemedPaper } from '../common/ThemedPaper';
import { formatDate, formatTimeFromSeconds } from '../../utils/formatters';
import { getProgressColor } from '../../constants/colors';
import type { EnrollmentWithProgress } from '../../types/course.types';

export interface ProgressCardProps {
  enrollment: EnrollmentWithProgress;
}

export const ProgressCard = memo(function ProgressCard({ enrollment }: ProgressCardProps) {
  const { t } = useTranslation();

  const getTimeSpent = () => {
    const totalSeconds = enrollment.lessonsProgress.reduce(
      (acc, lp) => acc + (lp.watchedSeconds || 0),
      0
    );
    return formatTimeFromSeconds(totalSeconds);
  };

  const progressColor = getProgressColor(enrollment.progress);

  return (
    <ThemedPaper p="lg">
      <Stack gap="lg">
        <Group justify="space-between">
          <Text fw={600}>{t('courses.yourProgress')}</Text>
          <Text fw={700} c={progressColor} size="xl">
            {enrollment.progress}%
          </Text>
        </Group>

        <Progress
          value={enrollment.progress}
          size="lg"
          radius="xl"
          color={progressColor}
          striped={enrollment.progress < 100}
          animated={enrollment.progress < 100 && enrollment.progress > 0}
        />

        <Stack gap="sm">
          <Group gap="md">
            <ThemeIcon size="md" radius="md" variant="light" color="violet">
              <IconBook size={16} />
            </ThemeIcon>
            <Stack gap={0} style={{ flex: 1 }}>
              <Text size="sm" c="dimmed">
                {t('courses.lessonsCompleted')}
              </Text>
              <Text fw={500}>
                {enrollment.completedLessons} / {enrollment.totalLessons}
              </Text>
            </Stack>
          </Group>

          <Group gap="md">
            <ThemeIcon size="md" radius="md" variant="light" color="blue">
              <IconClock size={16} />
            </ThemeIcon>
            <Stack gap={0} style={{ flex: 1 }}>
              <Text size="sm" c="dimmed">
                {t('courses.timeSpent')}
              </Text>
              <Text fw={500}>{getTimeSpent()}</Text>
            </Stack>
          </Group>

          <Group gap="md">
            <ThemeIcon size="md" radius="md" variant="light" color="teal">
              <IconCalendar size={16} />
            </ThemeIcon>
            <Stack gap={0} style={{ flex: 1 }}>
              <Text size="sm" c="dimmed">
                {t('courses.enrolledAt')}
              </Text>
              <Text fw={500}>{formatDate(enrollment.enrolledAt)}</Text>
            </Stack>
          </Group>

          {enrollment.progress === 100 && (
            <Group gap="md">
              <ThemeIcon size="md" radius="md" variant="filled" color="green">
                <IconTrophy size={16} />
              </ThemeIcon>
              <Stack gap={0} style={{ flex: 1 }}>
                <Text size="sm" c="dimmed">
                  {t('courses.completedAt')}
                </Text>
                <Text fw={500} c="green">
                  {enrollment.completedAt ? formatDate(enrollment.completedAt) : '-'}
                </Text>
              </Stack>
            </Group>
          )}
        </Stack>
      </Stack>
    </ThemedPaper>
  );
});

export default ProgressCard;
