import { memo } from 'react';
import {
  TextInput,
  Textarea,
  Select,
  Stack,
  Group,
  Button,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ThemedPaper } from '../common/ThemedPaper';
import type { Section, CreateSectionRequest, UpdateSectionRequest, SectionContentType } from '../../types/course.types';

export interface SectionFormProps {
  section?: Section;
  isLoading?: boolean;
  onSubmit: (data: CreateSectionRequest | UpdateSectionRequest) => Promise<void>;
  onCancel: () => void;
}

const contentTypeOptions = [
  { value: 'text', label: 'Texto' },
  { value: 'video', label: 'Video' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'exercise', label: 'Exercicio' },
];

export const SectionForm = memo(function SectionForm({
  section,
  isLoading = false,
  onSubmit,
  onCancel,
}: SectionFormProps) {
  const { t } = useTranslation();

  const form = useForm({
    initialValues: {
      title: section?.title || '',
      description: section?.description || '',
      contentType: section?.contentType || 'text',
    },
    validate: {
      title: (value) => {
        if (!value.trim()) return t('admin.sections.titleRequired');
        if (value.length < 1) return t('admin.sections.titleMinLength');
        return null;
      },
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    const data: CreateSectionRequest | UpdateSectionRequest = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      contentType: values.contentType as SectionContentType,
    };

    await onSubmit(data);
  });

  return (
    <ThemedPaper p="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label={t('admin.sections.titleLabel')}
            placeholder={t('admin.sections.titlePlaceholder')}
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label={t('admin.sections.descriptionLabel')}
            placeholder={t('admin.sections.descriptionPlaceholder')}
            rows={2}
            {...form.getInputProps('description')}
          />

          <Select
            label={t('admin.sections.contentTypeLabel')}
            data={contentTypeOptions}
            required
            {...form.getInputProps('contentType')}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconX size={16} />}
              onClick={onCancel}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              leftSection={<IconDeviceFloppy size={16} />}
              loading={isLoading}
            >
              {section ? t('common.save') : t('common.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </ThemedPaper>
  );
});

export default SectionForm;
