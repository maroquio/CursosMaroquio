import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { Box, Stack, Skeleton, Badge, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common';
import { CourseContentManager } from '../../components/admin';
import { adminApi } from '../../api/admin.api';
import { useNotification, useBreadcrumbs } from '../../hooks';
import type { CourseWithModules } from '../../types/course.types';

export function AdminLessons() {
  const { id: courseId } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const notification = useNotification();

  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useBreadcrumbs(
    course
      ? [
          { label: t('admin.dashboard.title'), path: '/admin' },
          { label: t('admin.courses.title'), path: '/admin/courses' },
          { label: course.title, path: `/admin/courses/${courseId}/edit` },
          { label: t('admin.courses.content') },
        ]
      : [
          { label: t('admin.dashboard.title'), path: '/admin' },
          { label: t('admin.courses.title'), path: '/admin/courses' },
          { label: t('admin.courses.content') },
        ]
  );

  const fetchData = useCallback(async () => {
    if (!courseId) return;

    setIsLoading(true);
    try {
      const response = await adminApi.getCourse(courseId);
      if (response.success && response.data) {
        setCourse(response.data as CourseWithModules);
      }
    } catch {
      notification.error({
        title: t('admin.courses.fetchError'),
        message: t('admin.courses.fetchErrorMessage'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [courseId, notification, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <Box p="xl">
        <Stack gap="xl">
          <Skeleton height={40} width={300} />
          <Skeleton height={400} />
        </Stack>
      </Box>
    );
  }

  if (!course || !courseId) {
    return null;
  }

  return (
    <Box p="xl">
      <Stack gap="xl">
        <PageHeader
          title={course.title}
          subtitle={
            (course.category || (course.tags && course.tags.length > 0)) ? (
              <Group gap="xs">
                {course.category && (
                  <Badge variant="light" color="violet">
                    {course.category}
                  </Badge>
                )}
                {course.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" color="gray">
                    {tag}
                  </Badge>
                ))}
              </Group>
            ) : undefined
          }
        />

        <CourseContentManager
          courseId={courseId}
          modules={course.modules || []}
          onRefresh={fetchData}
        />
      </Stack>
    </Box>
  );
}

export default AdminLessons;
