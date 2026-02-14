import { memo } from 'react';
import { SimpleGrid, Skeleton, Stack, Text, Center } from '@mantine/core';
import { IconMoodEmpty } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { CourseCard } from './CourseCard';
import type { Course } from '../../types/course.types';

export interface CourseGridProps {
  courses: Course[];
  isLoading?: boolean;
  showStatus?: boolean;
  emptyMessage?: string;
  skeletonCount?: number;
  onCourseClick?: (course: Course) => void;
}

export const CourseGrid = memo(function CourseGrid({
  courses,
  isLoading = false,
  showStatus = false,
  emptyMessage,
  skeletonCount = 6,
  onCourseClick,
}: CourseGridProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <Skeleton key={index} height={340} radius="lg" />
        ))}
      </SimpleGrid>
    );
  }

  if (courses.length === 0) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <IconMoodEmpty size={48} stroke={1.5} color="gray" />
          <Text c="dimmed" ta="center">
            {emptyMessage || t('courses.noCourses')}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          showStatus={showStatus}
          onClick={onCourseClick ? () => onCourseClick(course) : undefined}
        />
      ))}
    </SimpleGrid>
  );
});

export default CourseGrid;
