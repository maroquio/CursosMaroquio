import { memo, useState } from 'react';
import { Badge, Button, Group, Image, Stack, Text } from '@mantine/core';
import { IconClock, IconUsers, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ThemedPaper } from '../common/ThemedPaper';
import { formatDurationSpaced, formatPrice } from '../../utils/formatters';
import { COURSE_LEVEL_COLORS } from '../../constants/colors';
import type { Course } from '../../types/course.types';

export interface HomeCourseCardProps {
  course: Course;
  isAuthenticated: boolean;
  isEnrolled: boolean;
  onEnroll: (courseId: string) => Promise<void>;
}

export const HomeCourseCard = memo(function HomeCourseCard({
  course,
  isAuthenticated,
  isEnrolled,
  onEnroll,
}: HomeCourseCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);

  const handleCardClick = () => {
    navigate(`/courses/${course.slug}`);
  };

  const handleEnrollClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/' } });
      return;
    }
    setEnrolling(true);
    try {
      await onEnroll(course.id);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <ThemedPaper p={0} hoverable onClick={handleCardClick} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Image
        src={course.thumbnailUrl || '/placeholder-course.jpg'}
        alt={course.title}
        height={160}
        fallbackSrc="https://placehold.co/400x160/1e293b/94a3b8?text=Course"
      />
      <Stack p="md" gap="sm" style={{ flex: 1 }}>
        <Group justify="space-between" wrap="nowrap">
          {course.category && (
            <Badge variant="light" color="violet" size="sm">
              {course.category}
            </Badge>
          )}
          {course.level && (
            <Badge variant="dot" color={COURSE_LEVEL_COLORS[course.level as keyof typeof COURSE_LEVEL_COLORS]} size="sm">
              {t(`courses.level.${course.level}`)}
            </Badge>
          )}
        </Group>

        <Text fw={600} size="lg" lineClamp={2} style={{ minHeight: '3.5em' }}>
          {course.title}
        </Text>

        {course.shortDescription && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {course.shortDescription}
          </Text>
        )}

        <Group gap="md" mt="xs">
          {course.duration && (
            <Group gap={4}>
              <IconClock size={14} />
              <Text size="xs" c="dimmed">
                {formatDurationSpaced(course.duration)}
              </Text>
            </Group>
          )}
          <Group gap={4}>
            <IconUsers size={14} />
            <Text size="xs" c="dimmed">
              {course.totalEnrollments}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {course.totalLessons} {t('courses.lessons')}
          </Text>
        </Group>

        <Group justify="space-between" mt="sm">
          <Text fw={700} size="lg" c="violet">
            {formatPrice(course.price, course.currency, t('courses.free'))}
          </Text>
        </Group>

        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          {isEnrolled ? (
            <Badge
              color="green"
              variant="light"
              size="lg"
              leftSection={<IconCheck size={14} />}
              fullWidth
              style={{ textTransform: 'none' }}
            >
              {t('home.alreadyEnrolled')}
            </Badge>
          ) : (
            <Button
              fullWidth
              variant="gradient"
              gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
              loading={enrolling}
              onClick={handleEnrollClick}
            >
              {enrolling ? t('home.enrolling') : t('home.wantToEnroll')}
            </Button>
          )}
        </div>
      </Stack>
    </ThemedPaper>
  );
});

export default HomeCourseCard;
