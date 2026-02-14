import { Box, Stack, Group, Button, Modal } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PageHeader, ConfirmModal } from '../../components/common';
import { CategoryForm, CategoryTable } from '../../components/admin';
import { adminApi } from '../../api/admin.api';
import { useCrudPage } from '../../hooks';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../types/course.types';

const categoryMessages = {
  fetchError: 'admin.categories.fetchError',
  fetchErrorMessage: 'admin.categories.fetchErrorMessage',
  createSuccess: 'admin.categories.createSuccess',
  createSuccessMessage: 'admin.categories.createSuccessMessage',
  createError: 'admin.categories.createError',
  createErrorMessage: 'admin.categories.createErrorMessage',
  updateSuccess: 'admin.categories.updateSuccess',
  updateSuccessMessage: 'admin.categories.updateSuccessMessage',
  updateError: 'admin.categories.updateError',
  updateErrorMessage: 'admin.categories.updateErrorMessage',
  deleteSuccess: 'admin.categories.deleteSuccess',
  deleteSuccessMessage: 'admin.categories.deleteSuccessMessage',
  deleteError: 'admin.categories.deleteError',
  deleteErrorMessage: 'admin.categories.deleteErrorMessage',
};

const categoryApi = {
  list: adminApi.listCategories,
  create: adminApi.createCategory,
  update: (id: string, data: UpdateCategoryRequest) => adminApi.updateCategory(id, data),
  delete: adminApi.deleteCategory,
};

export function AdminCategories() {
  const { t } = useTranslation();

  const {
    items: categories,
    isLoading,
    formModalOpened,
    deleteModalOpened,
    itemToEdit: categoryToEdit,
    itemToDelete: categoryToDelete,
    isSubmitting,
    isDeleting,
    handleCreate,
    handleEdit,
    handleDelete,
    handleFormSubmit,
    confirmDelete,
    closeFormModal,
    closeDeleteModal,
  } = useCrudPage<Category, CreateCategoryRequest, UpdateCategoryRequest>({
    api: categoryApi,
    messages: categoryMessages,
    getId: (c) => c.id,
  });

  return (
    <Box p="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <PageHeader
            title={t('admin.categories.title')}
            subtitle={t('admin.categories.subtitle')}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
            {t('admin.categories.newCategory')}
          </Button>
        </Group>

        <CategoryTable
          categories={categories}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Stack>

      <Modal
        opened={formModalOpened}
        onClose={closeFormModal}
        title={categoryToEdit ? t('admin.categories.editCategory') : t('admin.categories.newCategory')}
      >
        <CategoryForm
          initialValues={categoryToEdit || undefined}
          onSubmit={handleFormSubmit}
          onCancel={closeFormModal}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={t('admin.categories.deleteConfirmTitle')}
        message={t('admin.categories.deleteConfirmMessage', { name: categoryToDelete?.name })}
        confirmLabel={t('common.delete')}
        confirmColor="red"
        isLoading={isDeleting}
      />
    </Box>
  );
}

export default AdminCategories;
