import { memo, useMemo, useCallback } from 'react';
import { Text } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DataTable, ActionMenu, type Column, type ActionMenuItem } from '../common';
import type { Category } from '../../types/course.types';

export interface CategoryTableProps {
  categories: Category[];
  isLoading?: boolean;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

export const CategoryTable = memo(function CategoryTable({
  categories,
  isLoading = false,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  const { t } = useTranslation();

  const getActionItems = useCallback(
    (category: Category): ActionMenuItem[] => {
      return [
        {
          key: 'edit',
          label: t('common.edit'),
          icon: <IconEdit size={14} />,
          onClick: () => onEdit?.(category),
        },
        {
          key: 'delete',
          label: t('common.delete'),
          icon: <IconTrash size={14} />,
          color: 'red',
          onClick: () => onDelete?.(category),
        },
      ];
    },
    [t, onEdit, onDelete]
  );

  const columns: Column<Category>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('admin.categories.name'),
        render: (category) => (
          <Text size="sm" fw={500}>
            {category.name}
          </Text>
        ),
      },
      {
        key: 'description',
        header: t('admin.categories.description'),
        render: (category) => (
          <Text size="sm" lineClamp={1}>
            {category.description || '-'}
          </Text>
        ),
      },
      {
        key: 'slug',
        header: t('admin.categories.slug'),
        render: (category) => (
          <Text size="sm" c="dimmed">
            {category.slug}
          </Text>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        align: 'center',
        render: (category) => <ActionMenu items={getActionItems(category)} />,
      },
    ],
    [t, getActionItems]
  );

  return (
    <DataTable
      data={categories}
      columns={columns}
      isLoading={isLoading}
      emptyMessage={t('admin.categories.noCategories')}
      getRowKey={(category) => category.id}
    />
  );
});

export default CategoryTable;
