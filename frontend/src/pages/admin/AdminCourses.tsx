import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Box, Stack, Group, TextInput, Select, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconPlus, IconFilter } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PageHeader, ConfirmModal } from '../../components/common';
import { CourseTable } from '../../components/admin';
import { CoursePagination } from '../../components/courses';
import { adminApi } from '../../api/admin.api';
import { useNotification } from '../../hooks';
import type { Course, CourseFilters } from '../../types/course.types';

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived', label: 'Arquivado' },
];

export function AdminCourses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notification = useNotification();

  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<CourseFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
  });

  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.listCourses(filters);
      if (response.success && response.data) {
        setCourses(response.data.courses);
        setTotal(response.data.total);
        setPage(response.data.page);
        setTotalPages(response.data.totalPages);
      }
    } catch {
      notification.error({
        title: t('admin.courses.fetchError'),
        message: t('admin.courses.fetchErrorMessage'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, notification, t]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusChange = (value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      status: value ? (value as CourseFilters['status']) : undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleEdit = (course: Course) => {
    navigate(`/admin/courses/${course.id}/edit`);
  };

  const handleDelete = (course: Course) => {
    setCourseToDelete(course);
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    try {
      const response = await adminApi.deleteCourse(courseToDelete.id);
      if (response.success) {
        notification.success({
          title: t('admin.courses.deleteSuccess'),
          message: t('admin.courses.deleteSuccessMessage'),
        });
        fetchCourses();
      } else {
        throw new Error(response.error);
      }
    } catch {
      notification.error({
        title: t('admin.courses.deleteError'),
        message: t('admin.courses.deleteErrorMessage'),
      });
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
      setCourseToDelete(null);
    }
  };

  const handlePublish = async (course: Course) => {
    try {
      const response = await adminApi.publishCourse(course.id);
      if (response.success) {
        notification.success({
          title: t('admin.courses.publishSuccess'),
          message: t('admin.courses.publishSuccessMessage'),
        });
        fetchCourses();
      } else {
        throw new Error(response.error);
      }
    } catch {
      notification.error({
        title: t('admin.courses.publishError'),
        message: t('admin.courses.publishErrorMessage'),
      });
    }
  };

  const handleUnpublish = async (course: Course) => {
    try {
      const response = await adminApi.unpublishCourse(course.id);
      if (response.success) {
        notification.success({
          title: t('admin.courses.unpublishSuccess'),
          message: t('admin.courses.unpublishSuccessMessage'),
        });
        fetchCourses();
      } else {
        throw new Error(response.error);
      }
    } catch {
      notification.error({
        title: t('admin.courses.unpublishError'),
        message: t('admin.courses.unpublishErrorMessage'),
      });
    }
  };

  return (
    <Box p="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <PageHeader
            title={t('admin.courses.title')}
            subtitle={t('admin.courses.subtitle')}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={() => navigate('/admin/courses/new')}>
            {t('admin.courses.newCourse')}
          </Button>
        </Group>

        <Group>
          <TextInput
            placeholder={t('admin.courses.searchPlaceholder')}
            leftSection={<IconSearch size={16} />}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder={t('admin.courses.filterByStatus')}
            leftSection={<IconFilter size={16} />}
            data={statusOptions}
            value={filters.status || ''}
            onChange={handleStatusChange}
            w={180}
            clearable
          />
        </Group>

        <CourseTable
          courses={courses}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
        />

        <CoursePagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={filters.limit || 10}
          onPageChange={handlePageChange}
        />
      </Stack>

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={t('admin.courses.deleteConfirmTitle')}
        message={t('admin.courses.deleteConfirmMessage', { title: courseToDelete?.title })}
        confirmLabel={t('common.delete')}
        confirmColor="red"
        isLoading={isDeleting}
      />
    </Box>
  );
}

export default AdminCourses;
