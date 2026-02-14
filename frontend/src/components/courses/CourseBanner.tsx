import { memo } from 'react';
import {
  BackgroundImage,
  Badge,
  Box,
  Group,
  Overlay,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconClock, IconUsers, IconStar, IconBook } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { formatDurationSpaced } from '../../utils/formatters';
import { COURSE_LEVEL_COLORS } from '../../constants/colors';
import type { Course } from '../../types/course.types';

export interface CourseBannerProps {
  course: Course;
}

export const CourseBanner = memo(function CourseBanner({ course }: CourseBannerProps) {
  const { t } = useTranslation();

  return (
    <BackgroundImage
      src={course.bannerUrl || course.thumbnailUrl || 'https://placehold.co/1200x400/1e293b/94a3b8?text=Course'}
      radius="lg"
      style={{ minHeight: 280, position: 'relative', overflow: 'hidden' }}
    >
      <Overlay gradient="linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.8) 100%)" radius="lg">
        <Box p="xl" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 280 }}>
          <Stack gap="md">
            <Group gap="sm">
              {course.category && (
                <Badge variant="filled" color="violet" size="lg">
                  {course.category}
                </Badge>
              )}
              {course.level && (
                <Badge variant="filled" color={COURSE_LEVEL_COLORS[course.level as keyof typeof COURSE_LEVEL_COLORS]} size="lg">
                  {t(`courses.level.${course.level}`)}
                </Badge>
              )}
            </Group>

            <Title order={1} c="white" size="h2">
              {course.title}
            </Title>

            {course.shortDescription && (
              <Text c="gray.3" size="lg" maw={600}>
                {course.shortDescription}
              </Text>
            )}

            <Group gap="xl" mt="sm">
              {course.instructorName && (
                <Text c="white" fw={500}>
                  {t('courses.by')} {course.instructorName}
                </Text>
              )}
              {course.duration && (
                <Group gap={6}>
                  <IconClock size={18} color="white" />
                  <Text c="white" size="sm">
                    {formatDurationSpaced(course.duration)}
                  </Text>
                </Group>
              )}
              <Group gap={6}>
                <IconBook size={18} color="white" />
                <Text c="white" size="sm">
                  {course.totalLessons} {t('courses.lessons', { count: course.totalLessons })}
                </Text>
              </Group>
              <Group gap={6}>
                <IconUsers size={18} color="white" />
                <Text c="white" size="sm">
                  {course.totalEnrollments} {t('courses.students', { count: course.totalEnrollments })}
                </Text>
              </Group>
              {course.averageRating && (
                <Group gap={6}>
                  <IconStar size={18} color="#fbbf24" fill="#fbbf24" />
                  <Text c="white" size="sm">
                    {course.averageRating.toFixed(1)}
                  </Text>
                </Group>
              )}
            </Group>
          </Stack>
        </Box>
      </Overlay>
    </BackgroundImage>
  );
});

export default CourseBanner;
