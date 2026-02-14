import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { Box, Stack, Group, Select, Skeleton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PageHeader, ConfirmModal } from '../../components/common';
import { EnrollmentTable } from '../../components/admin';
import { CoursePagination } from '../../components/courses';
import { adminApi } from '../../api/admin.api';
import { useNotification, useBreadcrumbs } from '../../hooks';
import type { Course, EnrollmentDetails } from '../../types/course.types';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Ativo' },
  { value: 'completed', label: 'Completo' },
  { value: 'cancelled', label: 'Cancelado' },
];

export function AdminEnrollments() {
  const { id: courseId } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const notification = useNotification();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [enrollmentToRemove, setEnrollmentToRemove] = useState<EnrollmentDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useBreadcrumbs([
    { label: t('admin.dashboard.title'), path: '/admin' },
    { label: t('admin.courses.title'), path: '/admin/courses' },
    { label: course?.title || t('admin.courses.editCourse'), path: `/admin/courses/${courseId}/edit` },
    { label: t('admin.enrollments.title') },
  ]);

  const fetchData = useCallback(async () => {
    if (!courseId) return;

    setIsLoading(true);
    try {
      const [courseResponse, enrollmentsResponse] = await Promise.all([
        adminApi.getCourse(courseId),
        adminApi.listEnrollments(courseId, {
          page,
          limit: 10,
          status: statusFilter || undefined,
        }),
      ]);

      if (courseResponse.success && courseResponse.data) {
        setCourse(courseResponse.data);
      }
      if (enrollmentsResponse.success && enrollmentsResponse.data) {
        setEnrollments(enrollmentsResponse.data.enrollments);
        setTotal(enrollmentsResponse.data.total);
        setTotalPages(enrollmentsResponse.data.totalPages);
      }
    } catch {
      notification.error({
        title: t('admin.enrollments.fetchError'),
        message: t('admin.enrollments.fetchErrorMessage'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [courseId, page, statusFilter, notification, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (value: string | null) => {
    setStatusFilter(value || '');
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRemove = (enrollment: EnrollmentDetails) => {
    setEnrollmentToRemove(enrollment);
    openDeleteModal();
  };

  const confirmRemove = async () => {
    if (!courseId || !enrollmentToRemove) return;

    setIsDeleting(true);
    try {
      const response = await adminApi.removeEnrollment(courseId, enrollmentToRemove.id);
      if (response.success) {
        notification.success({
          title: t('admin.enrollments.removeSuccess'),
          message: t('admin.enrollments.removeSuccessMessage'),
        });
        closeDeleteModal();
        fetchData();
      } else {
        throw new Error(response.error);
      }
    } catch {
      notification.error({
        title: t('admin.enrollments.removeError'),
        message: t('admin.enrollments.removeErrorMessage'),
      });
    } finally {
      setIsDeleting(false);
      setEnrollmentToRemove(null);
    }
  };

  if (isLoading && !enrollments.length) {
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
        <Group justify="space-between" align="flex-start">
          <PageHeader
            title={t('admin.enrollments.title')}
            subtitle={course?.title}
          />
          <Select
            placeholder={t('admin.enrollments.filterByStatus')}
            leftSection={<IconFilter size={16} />}
            data={statusOptions}
            value={statusFilter}
            onChange={handleStatusChange}
            w={180}
            clearable
          />
        </Group>

        <EnrollmentTable
          enrollments={enrollments}
          isLoading={isLoading}
          onRemove={handleRemove}
        />

        <CoursePagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={10}
          onPageChange={handlePageChange}
        />
      </Stack>

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={confirmRemove}
        title={t('admin.enrollments.removeConfirmTitle')}
        message={t('admin.enrollments.removeConfirmMessage', {
          email: enrollmentToRemove?.user?.email,
        })}
        confirmLabel={t('common.remove')}
        confirmColor="red"
        isLoading={isDeleting}
      />
    </Box>
  );
}

export default AdminEnrollments;
