import { memo, useState } from 'react';
import { Badge, Button, Group, Stack, Text, Loader } from '@mantine/core';
import { IconPlayerPlay, IconCheck, IconShoppingCart, IconCircleCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ThemedPaper } from '../common/ThemedPaper';
import { useNotification } from '../../hooks';
import { enrollmentsApi } from '../../api/enrollments.api';
import { formatPrice } from '../../utils/formatters';
import type { Course, Enrollment } from '../../types/course.types';

export interface EnrollButtonProps {
  course: Course;
  enrollment?: Enrollment | null;
  isAuthenticated: boolean;
  onEnrollSuccess?: (enrollment: Enrollment) => void;
  nextLessonSlug?: string | null;
}

export const EnrollButton = memo(function EnrollButton({
  course,
  enrollment,
  isAuthenticated,
  onEnrollSuccess,
  nextLessonSlug,
}: EnrollButtonProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notification = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${course.slug}` } });
      return;
    }

    setIsLoading(true);
    try {
      const response = await enrollmentsApi.enroll(course.id);
      if (response.success && response.data) {
        notification.success({
          title: t('courses.enrollSuccess'),
          message: t('courses.enrollSuccessMessage'),
        });
        // API returns enrollment directly in data, not nested in data.enrollment
        const enrollmentData = 'enrollment' in response.data
          ? response.data.enrollment
          : response.data as unknown as Enrollment;
        onEnrollSuccess?.(enrollmentData);
      } else {
        throw new Error(response.error || t('courses.enrollError'));
      }
    } catch (error) {
      notification.error({
        title: t('courses.enrollError'),
        message: error instanceof Error ? error.message : t('courses.enrollErrorMessage'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (nextLessonSlug) {
      navigate(`/courses/${course.slug}/lessons/${nextLessonSlug}`);
    } else {
      // Fallback: go to first lesson
      navigate(`/courses/${course.slug}/lessons`);
    }
  };

  const handleStartLearning = () => {
    navigate(`/courses/${course.slug}/lessons`);
  };

  if (enrollment) {
    return (
      <ThemedPaper p="lg">
        <Stack gap="md">
          <Badge
            size="lg"
            variant="light"
            color="green"
            leftSection={<IconCircleCheck size={16} />}
            fullWidth
            style={{ textTransform: 'none' }}
          >
            {t('courses.alreadyEnrolled')}
          </Badge>

          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              {t('courses.yourProgress')}
            </Text>
            <Text fw={600} c="violet">
              {enrollment.progress}%
            </Text>
          </Group>

          <div
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${enrollment.progress}%`,
                backgroundColor: '#8b5cf6',
                borderRadius: 4,
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {(enrollment.completedLessons !== undefined && enrollment.totalLessons !== undefined) && (
            <Text size="sm" c="dimmed" ta="center">
              {enrollment.completedLessons} / {enrollment.totalLessons} {t('courses.lessonsCompleted')}
            </Text>
          )}

          <Button
            size="lg"
            fullWidth
            leftSection={enrollment.progress > 0 ? <IconPlayerPlay size={20} /> : <IconCheck size={20} />}
            onClick={enrollment.progress > 0 ? handleContinue : handleStartLearning}
          >
            {enrollment.progress > 0 ? t('courses.continue') : t('courses.startLearning')}
          </Button>
        </Stack>
      </ThemedPaper>
    );
  }

  return (
    <ThemedPaper p="lg">
      <Stack gap="md">
        <Group justify="space-between" align="flex-end">
          <Stack gap={0}>
            <Text size="xs" c="dimmed" tt="uppercase">
              {t('courses.price')}
            </Text>
            <Text size="2rem" fw={700} c="violet" style={{ fontFamily: '"Outfit", sans-serif' }}>
              {formatPrice(course.price, course.currency, t('courses.free'))}
            </Text>
          </Stack>
        </Group>

        <Button
          size="lg"
          fullWidth
          leftSection={
            isLoading ? (
              <Loader size="sm" color="white" />
            ) : course.price > 0 ? (
              <IconShoppingCart size={20} />
            ) : (
              <IconPlayerPlay size={20} />
            )
          }
          onClick={handleEnroll}
          disabled={isLoading}
        >
          {isLoading
            ? t('courses.enrolling')
            : course.price > 0
              ? t('courses.buy')
              : t('courses.enrollFree')}
        </Button>

        {!isAuthenticated && (
          <Text size="xs" c="dimmed" ta="center">
            {t('courses.loginToEnroll')}
          </Text>
        )}
      </Stack>
    </ThemedPaper>
  );
});

export default EnrollButton;
