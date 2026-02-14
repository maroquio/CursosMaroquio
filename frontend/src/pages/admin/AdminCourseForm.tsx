import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Box, Stack, Skeleton } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common';
import { CourseForm } from '../../components/admin';
import { adminApi } from '../../api/admin.api';
import { coursesApi } from '../../api/courses.api';
import { useNotification, useBreadcrumbs } from '../../hooks';
import type { Course, CreateCourseRequest, UpdateCourseRequest, Category } from '../../types/course.types';

export function AdminCourseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const notification = useNotification();

  const isEditMode = !!id;

  const [course, setCourse] = useState<Course | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useBreadcrumbs([
    { label: t('admin.dashboard.title'), path: '/admin' },
    { label: t('admin.courses.title'), path: '/admin/courses' },
    { label: isEditMode ? t('admin.courses.editCourse') : t('admin.courses.newCourse') },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Categories are optional - don't fail if this endpoint doesn't exist
        try {
          const categoriesResponse = await coursesApi.getCategories();
          if (categoriesResponse.success && categoriesResponse.data) {
            setCategories(categoriesResponse.data);
          }
        } catch {
          // Categories endpoint may not exist, continue without categories
        }

        if (isEditMode && id) {
          setIsLoading(true);
          const courseResponse = await adminApi.getCourse(id);
          if (courseResponse.success && courseResponse.data) {
            setCourse(courseResponse.data);
          } else {
            throw new Error(courseResponse.error || 'Course not found');
          }
        }
      } catch {
        notification.error({
          title: t('admin.courses.fetchError'),
          message: t('admin.courses.fetchErrorMessage'),
        });
        navigate('/admin/courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, navigate, notification, t]);

  const handleSubmit = async (data: CreateCourseRequest | UpdateCourseRequest) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        const response = await adminApi.updateCourse(id, data);
        if (response.success) {
          notification.success({
            title: t('admin.courses.updateSuccess'),
            message: t('admin.courses.updateSuccessMessage'),
          });
          navigate('/admin/courses');
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await adminApi.createCourse(data as CreateCourseRequest);
        if (response.success && response.data) {
          notification.success({
            title: t('admin.courses.createSuccess'),
            message: t('admin.courses.createSuccessMessage'),
          });
          navigate(`/admin/courses/${response.data.id}/edit`);
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error) {
      notification.error({
        title: isEditMode ? t('admin.courses.updateError') : t('admin.courses.createError'),
        message: error instanceof Error ? error.message : t('admin.courses.submitErrorMessage'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/courses');
  };

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

  return (
    <Box p="xl">
      <Stack gap="xl">
        <PageHeader
          title={isEditMode ? t('admin.courses.editCourse') : t('admin.courses.newCourse')}
          subtitle={isEditMode ? course?.title : t('admin.courses.newCourseSubtitle')}
        />

        <CourseForm
          course={course || undefined}
          categories={categories}
          isLoading={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </Stack>
    </Box>
  );
}

export default AdminCourseForm;
