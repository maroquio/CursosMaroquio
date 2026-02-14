import { useEffect, useCallback } from 'react';
import { Box, Container, Stack, Title, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { CourseGrid, CourseFilters, CoursePagination } from '../../components/courses';
import { useCoursesStore } from '../../stores/courses.store';
import { useThemedStyles } from '../../hooks';
import type { CourseFilters as CourseFiltersType } from '../../types/course.types';

export function CoursesCatalog() {
  const { t } = useTranslation();
  const { isDark, theme } = useThemedStyles();

  const {
    courses,
    totalCourses,
    currentPage,
    totalPages,
    filters,
    categories,
    isLoading,
    fetchCourses,
    fetchCategories,
    setFilters,
  } = useCoursesStore();

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, [fetchCourses, fetchCategories]);

  const handleFiltersChange = useCallback(
    (newFilters: CourseFiltersType) => {
      setFilters(newFilters);
    },
    [setFilters]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setFilters({ ...filters, page });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [filters, setFilters]
  );

  const handleLimitChange = useCallback(
    (limit: number) => {
      setFilters({ ...filters, limit, page: 1 });
    },
    [filters, setFilters]
  );

  return (
    <Box
      style={{
        background: isDark
          ? theme.colors.slate[9]
          : `linear-gradient(180deg, ${theme.colors.slate[0]} 0%, white 100%)`,
        minHeight: 'calc(100vh - 60px)',
      }}
    >
      <Container size="xl" py="xl">
        <Stack gap="xl">
          <Stack gap="xs">
            <Title order={1} style={{ fontFamily: '"Outfit", sans-serif' }}>
              {t('courses.catalog')}
            </Title>
            <Text c="dimmed" size="lg">
              {t('courses.catalogDescription')}
            </Text>
          </Stack>

          <CourseFilters
            filters={filters}
            categories={categories}
            onFiltersChange={handleFiltersChange}
            onSearch={() => fetchCourses(filters)}
          />

          <CourseGrid
            courses={courses}
            isLoading={isLoading}
            emptyMessage={t('courses.noCoursesFound')}
          />

          <CoursePagination
            page={currentPage}
            totalPages={totalPages}
            total={totalCourses}
            limit={filters.limit || 12}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </Stack>
      </Container>
    </Box>
  );
}

export default CoursesCatalog;
