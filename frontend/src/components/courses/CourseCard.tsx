import { memo } from 'react';
import { Badge, Group, Image, Stack, Text } from '@mantine/core';
import { IconClock, IconUsers, IconStar } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ThemedPaper } from '../common/ThemedPaper';
import { formatDurationSpaced, formatPrice } from '../../utils/formatters';
import { COURSE_LEVEL_COLORS } from '../../constants/colors';
import type { Course } from '../../types/course.types';

export interface CourseCardProps {
  course: Course;
  showStatus?: boolean;
  onClick?: () => void;
}

export const CourseCard = memo(function CourseCard({
  course,
  showStatus = false,
  onClick,
}: CourseCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/courses/${course.slug}`);
    }
  };

  return (
    <ThemedPaper p={0} hoverable onClick={handleClick} style={{ overflow: 'hidden' }}>
      <Image
        src={course.thumbnailUrl || '/placeholder-course.jpg'}
        alt={course.title}
        height={160}
        fallbackSrc="https://placehold.co/400x160/1e293b/94a3b8?text=Course"
      />
      <Stack p="md" gap="sm">
        <Group justify="space-between" wrap="nowrap">
          {course.category && (
            <Badge variant="light" color="violet" size="sm">
              {course.category}
            </Badge>
          )}
          {showStatus && (
            <Badge
              variant="light"
              color={course.status === 'published' ? 'green' : course.status === 'draft' ? 'gray' : 'orange'}
              size="sm"
            >
              {t(`courses.status.${course.status}`)}
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
          {course.level && (
            <Badge variant="dot" color={COURSE_LEVEL_COLORS[course.level as keyof typeof COURSE_LEVEL_COLORS]} size="sm">
              {t(`courses.level.${course.level}`)}
            </Badge>
          )}
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
          {course.averageRating && (
            <Group gap={4}>
              <IconStar size={14} style={{ color: '#fbbf24' }} />
              <Text size="xs" c="dimmed">
                {course.averageRating.toFixed(1)}
              </Text>
            </Group>
          )}
        </Group>

        <Group justify="space-between" mt="sm">
          <Text fw={700} size="lg" c="violet">
            {formatPrice(course.price, course.currency, t('courses.free'))}
          </Text>
          <Text size="xs" c="dimmed">
            {course.totalLessons} {t('courses.lessons')}
          </Text>
        </Group>
      </Stack>
    </ThemedPaper>
  );
});

export default CourseCard;
