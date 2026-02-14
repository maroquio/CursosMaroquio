import { memo } from 'react';
import { useNavigate } from 'react-router';
import { Text, Group, Stack, Badge, ThemeIcon } from '@mantine/core';
import { IconBook2, IconUsers } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ThemedPaper } from '../common/ThemedPaper';
import type { Enrollment } from '../../types/course.types';

export interface EnrollmentCardProps {
  enrollment: Enrollment;
  variant?: 'default' | 'compact';
}

export const EnrollmentCard = memo(function EnrollmentCard({
  enrollment,
  variant = 'default',
}: EnrollmentCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const title = enrollment.courseTitle || enrollment.course?.title || t('courses.untitled');
  const slug = enrollment.courseSlug || enrollment.course?.slug;
  const description = enrollment.course?.shortDescription || enrollment.course?.description || '';
  const totalEnrollments = enrollment.course?.totalEnrollments || 0;

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'emerald';
    if (progress > 0) return 'indigo';
    return 'slate';
  };

  const getProgressLabel = (progress: number) => {
    if (progress === 100) return t('courses.status.completed');
    if (progress > 0) return `${progress}%`;
    return t('courses.status.notStarted');
  };

  const handleClick = () => {
    if (slug) {
      navigate(`/courses/${slug}`);
    }
  };

  if (variant === 'compact') {
    return (
      <ThemedPaper p="lg" hoverable onClick={handleClick}>
        <Stack gap="sm">
          <Text fw={600} lineClamp={1}>
            {title}
          </Text>

          <div
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${enrollment.progress}%`,
                backgroundColor: enrollment.progress === 100 ? '#10b981' : '#8b5cf6',
                borderRadius: 3,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {enrollment.completedLessons}/{enrollment.totalLessons} {t('courses.lessons')}
            </Text>
            <Badge size="sm" variant="light" color={enrollment.progress === 100 ? 'green' : 'violet'}>
              {enrollment.progress}%
            </Badge>
          </Group>
        </Stack>
      </ThemedPaper>
    );
  }

  return (
    <ThemedPaper p="lg" hoverable onClick={handleClick}>
      <Stack gap="md">
        <div>
          <Text fw={600} size="lg" style={{ fontFamily: '"Outfit", sans-serif' }}>
            {title}
          </Text>
          {description && (
            <Text c="dimmed" size="sm" mt="xs" lineClamp={2}>
              {description}
            </Text>
          )}
        </div>

        <Group gap="lg">
          <Group gap="xs">
            <ThemeIcon size="sm" variant="subtle" color="slate">
              <IconBook2 size={14} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              {enrollment.totalLessons} {t('courses.lessons')}
            </Text>
          </Group>
          <Group gap="xs">
            <ThemeIcon size="sm" variant="subtle" color="slate">
              <IconUsers size={14} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              {totalEnrollments}
            </Text>
          </Group>
        </Group>

        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${enrollment.progress}%`,
              backgroundColor: enrollment.progress === 100 ? '#10b981' : '#8b5cf6',
              borderRadius: 3,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <Group justify="space-between" align="center">
          <Badge variant="light" color={getProgressColor(enrollment.progress)}>
            {getProgressLabel(enrollment.progress)}
          </Badge>
          <Text size="xs" c="dimmed">
            {enrollment.completedLessons}/{enrollment.totalLessons} {t('courses.completed', { count: enrollment.completedLessons })}
          </Text>
        </Group>
      </Stack>
    </ThemedPaper>
  );
});

export default EnrollmentCard;
