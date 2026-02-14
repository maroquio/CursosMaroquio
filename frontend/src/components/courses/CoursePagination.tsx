import { memo } from 'react';
import { Group, Pagination, Select, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { BREAKPOINTS } from '../../constants';

export interface CoursePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const limitOptions = [
  { value: '6', label: '6' },
  { value: '12', label: '12' },
  { value: '24', label: '24' },
  { value: '48', label: '48' },
];

const MIN_ITEMS_FOR_PAGINATION = 6;

export const CoursePagination = memo(function CoursePagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: CoursePaginationProps) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);

  if (total <= MIN_ITEMS_FOR_PAGINATION) {
    return null;
  }

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <Group justify="space-between" mt="xl">
      <Text size="sm" c="dimmed">
        {t('courses.showingResults', { start, end, total })}
      </Text>
      <Group>
        {onLimitChange && (
          <Select
            size="xs"
            w={80}
            data={limitOptions}
            value={String(limit)}
            onChange={(value) => value && onLimitChange(Number(value))}
          />
        )}
        {totalPages > 1 && (
          <Pagination
            size={isMobile ? 'sm' : 'md'}
            total={totalPages}
            value={page}
            onChange={onPageChange}
            withEdges={!isMobile}
          />
        )}
      </Group>
    </Group>
  );
});

export default CoursePagination;
