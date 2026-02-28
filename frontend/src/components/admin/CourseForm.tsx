import { memo, useState } from 'react';
import {
  TextInput,
  Textarea,
  NumberInput,
  Select,
  TagsInput,
  Stack,
  Group,
  Button,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ThemedPaper, ImagePicker } from '../common';
import { adminApi } from '../../api/admin.api';
import type { Course, CreateCourseRequest, UpdateCourseRequest, Category } from '../../types/course.types';

export interface CourseFormProps {
  course?: Course;
  categories?: Category[];
  isLoading?: boolean;
  onSubmit: (data: CreateCourseRequest | UpdateCourseRequest) => Promise<void>;
  onCancel: () => void;
}

const levelOptions = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
];

const currencyOptions = [
  { value: 'BRL', label: 'Real (BRL)' },
  { value: 'USD', label: 'Dólar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

export const CourseForm = memo(function CourseForm({
  course,
  categories = [],
  isLoading = false,
  onSubmit,
  onCancel,
}: CourseFormProps) {
  const { t } = useTranslation();
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  const form = useForm({
    initialValues: {
      title: course?.title || '',
      description: course?.description || '',
      shortDescription: course?.shortDescription || '',
      thumbnailUrl: course?.thumbnailUrl || '',
      price: course?.price || 0,
      currency: course?.currency || 'BRL',
      level: course?.level || '',
      categoryId: course?.categoryId || '',
      tags: Array.isArray(course?.tags) ? course.tags : [],
    },
    validate: {
      title: (value) => {
        if (!value.trim()) return t('admin.courses.titleRequired');
        if (value.length < 3) return t('admin.courses.titleMinLength');
        return null;
      },
      description: (value) => {
        if (!value.trim()) return t('admin.courses.descriptionRequired');
        return null;
      },
      price: (value) => {
        if (value < 0) return t('admin.courses.priceInvalid');
        return null;
      },
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    let thumbnailUrl = values.thumbnailUrl.trim() || undefined;

    // If a new thumbnail file was selected and we have an existing course, upload it
    if (thumbnailFile && course?.id) {
      setIsUploadingThumbnail(true);
      try {
        const response = await adminApi.uploadThumbnail(course.id, thumbnailFile);
        if (response.success && response.data) {
          thumbnailUrl = response.data.url;
        }
      } catch {
      } finally {
        setIsUploadingThumbnail(false);
      }
    }

    const data: CreateCourseRequest | UpdateCourseRequest = {
      title: values.title.trim(),
      description: values.description.trim(),
      shortDescription: values.shortDescription.trim() || undefined,
      thumbnailUrl,
      price: values.price,
      currency: values.currency,
      level: (values.level as 'beginner' | 'intermediate' | 'advanced') || undefined,
      categoryId: values.categoryId || undefined,
      tags: values.tags.length > 0 ? values.tags : undefined,
    };

    await onSubmit(data);
  });

  const handleThumbnailChange = (file: File | null) => {
    setThumbnailFile(file);
    // Clear the URL when a new file is selected
    if (file) {
      form.setFieldValue('thumbnailUrl', '');
    }
  };

  const isSubmitting = isLoading || isUploadingThumbnail;

  const categoryOptions = categories.map((cat) => ({ value: cat.id, label: cat.name }));

  return (
    <ThemedPaper p="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label={t('admin.courses.titleLabel')}
            placeholder={t('admin.courses.titlePlaceholder')}
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label={t('admin.courses.shortDescriptionLabel')}
            placeholder={t('admin.courses.shortDescriptionPlaceholder')}
            rows={2}
            {...form.getInputProps('shortDescription')}
          />

          <Textarea
            label={t('admin.courses.descriptionLabel')}
            placeholder={t('admin.courses.descriptionPlaceholder')}
            required
            rows={6}
            {...form.getInputProps('description')}
          />

          <ImagePicker
            label={t('admin.courses.thumbnailLabel')}
            value={form.values.thumbnailUrl}
            onChange={handleThumbnailChange}
            placeholder={t('admin.courses.thumbnailPlaceholder')}
            hint={t('admin.courses.thumbnailHint')}
            cropShape="rect"
            outputWidth={848}
            outputHeight={280}
            disabled={isSubmitting}
          />

          <Group grow>
            <NumberInput
              label={t('admin.courses.priceLabel')}
              placeholder="0.00"
              min={0}
              decimalScale={2}
              fixedDecimalScale
              {...form.getInputProps('price')}
            />

            <Select
              label={t('admin.courses.currencyLabel')}
              data={currencyOptions}
              {...form.getInputProps('currency')}
            />
          </Group>

          <Group grow>
            <Select
              label={t('admin.courses.levelLabel')}
              placeholder={t('admin.courses.levelPlaceholder')}
              data={levelOptions}
              clearable
              {...form.getInputProps('level')}
            />

            <Select
              label={t('admin.courses.categoryLabel')}
              placeholder={t('admin.courses.categoryPlaceholder')}
              data={categoryOptions}
              searchable
              clearable
              {...form.getInputProps('categoryId')}
            />
          </Group>

          <TagsInput
            label={t('admin.courses.tagsLabel')}
            placeholder={t('admin.courses.tagsPlaceholder')}
            {...form.getInputProps('tags')}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconX size={16} />}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              leftSection={<IconDeviceFloppy size={16} />}
              loading={isSubmitting}
            >
              {isUploadingThumbnail
                ? t('admin.courses.thumbnailUploading')
                : course
                  ? t('common.save')
                  : t('common.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </ThemedPaper>
  );
});

export default CourseForm;
