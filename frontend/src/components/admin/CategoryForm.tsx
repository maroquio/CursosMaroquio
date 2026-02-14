import { useForm } from '@mantine/form';
import { Stack, TextInput, Textarea, Group, Button } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../types/course.types';

interface CategoryFormProps {
  initialValues?: Category;
  onSubmit: (values: CreateCategoryRequest | UpdateCategoryRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CategoryForm({ initialValues, onSubmit, onCancel, isSubmitting }: CategoryFormProps) {
  const { t } = useTranslation();

  const form = useForm({
    initialValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || '',
    },
    validate: {
      name: (value) => {
        if (!value.trim()) {
          return t('admin.categories.validation.nameRequired');
        }
        if (value.length > 100) {
          return t('admin.categories.validation.nameTooLong');
        }
        return null;
      },
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    onSubmit({
      name: values.name.trim(),
      description: values.description?.trim() || null,
    });
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label={t('admin.categories.name')}
          placeholder={t('admin.categories.namePlaceholder')}
          required
          {...form.getInputProps('name')}
        />

        <Textarea
          label={t('admin.categories.description')}
          placeholder={t('admin.categories.descriptionPlaceholder')}
          rows={3}
          {...form.getInputProps('description')}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onCancel} disabled={isSubmitting}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {initialValues ? t('common.save') : t('common.create')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

export default CategoryForm;
