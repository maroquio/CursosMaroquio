import { memo, useCallback } from 'react';
import {
  Group,
  TextInput,
  Select,
  Button,
  Collapse,
  Stack,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconSearch, IconFilter, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { BREAKPOINTS } from '../../constants';
import type { CourseFilters as CourseFiltersType, Category } from '../../types/course.types';

export interface CourseFiltersProps {
  filters: CourseFiltersType;
  categories?: Category[];
  onFiltersChange: (filters: CourseFiltersType) => void;
  onSearch?: () => void;
}

const levelOptions = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
];

const sortOptions = [
  { value: 'title-asc', label: 'Título (A-Z)' },
  { value: 'title-desc', label: 'Título (Z-A)' },
  { value: 'createdAt-desc', label: 'Mais recentes' },
  { value: 'createdAt-asc', label: 'Mais antigos' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'enrollments-desc', label: 'Mais populares' },
];

export const CourseFilters = memo(function CourseFilters({
  filters,
  categories = [],
  onFiltersChange,
  onSearch,
}: CourseFiltersProps) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false);

  const updateFilter = useCallback(
    (key: keyof CourseFiltersType, value: string | undefined) => {
      onFiltersChange({ ...filters, [key]: value, page: 1 });
    },
    [filters, onFiltersChange]
  );

  const handleSortChange = useCallback(
    (value: string | null) => {
      if (!value) {
        onFiltersChange({ ...filters, sortBy: undefined, sortOrder: undefined, page: 1 });
        return;
      }
      const [sortBy, sortOrder] = value.split('-') as [CourseFiltersType['sortBy'], CourseFiltersType['sortOrder']];
      onFiltersChange({ ...filters, sortBy, sortOrder, page: 1 });
    },
    [filters, onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    onFiltersChange({ page: 1, limit: filters.limit });
  }, [filters.limit, onFiltersChange]);

  const activeFiltersCount = [
    filters.search,
    filters.category,
    filters.level,
    filters.sortBy,
  ].filter(Boolean).length;

  const sortValue =
    filters.sortBy && filters.sortOrder ? `${filters.sortBy}-${filters.sortOrder}` : null;

  const categoryOptions = categories.map((cat) => ({ value: cat.id, label: cat.name }));

  return (
    <Stack gap="md">
      <Group>
        <TextInput
          flex={1}
          placeholder={t('courses.searchPlaceholder')}
          leftSection={<IconSearch size={16} />}
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value || undefined)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
        />
        <Button
          variant="light"
          leftSection={<IconFilter size={16} />}
          rightSection={
            activeFiltersCount > 0 ? (
              <Badge size="sm" circle>
                {activeFiltersCount}
              </Badge>
            ) : null
          }
          onClick={toggleFilters}
        >
          {isMobile ? '' : t('courses.filters')}
        </Button>
        {activeFiltersCount > 0 && (
          <ActionIcon variant="subtle" color="gray" onClick={clearFilters}>
            <IconX size={16} />
          </ActionIcon>
        )}
      </Group>

      <Collapse in={filtersOpened}>
        <Group grow={!isMobile}>
          <Select
            placeholder={t('courses.category')}
            data={categoryOptions}
            value={filters.category || null}
            onChange={(value) => updateFilter('category', value || undefined)}
            clearable
          />
          <Select
            placeholder={t('courses.level.label')}
            data={levelOptions}
            value={filters.level || null}
            onChange={(value) => updateFilter('level', value || undefined)}
            clearable
          />
          <Select
            placeholder={t('courses.sortBy')}
            data={sortOptions}
            value={sortValue}
            onChange={handleSortChange}
            clearable
          />
        </Group>
      </Collapse>
    </Stack>
  );
});

export default CourseFilters;
