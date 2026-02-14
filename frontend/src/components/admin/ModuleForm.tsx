import { memo } from 'react';
import {
  TextInput,
  Textarea,
  Stack,
  Group,
  Button,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ThemedPaper } from '../common/ThemedPaper';
import type { Module, CreateModuleRequest, UpdateModuleRequest } from '../../types/course.types';

export interface ModuleFormProps {
  module?: Module;
  isLoading?: boolean;
  onSubmit: (data: CreateModuleRequest | UpdateModuleRequest) => Promise<void>;
  onCancel: () => void;
}

export const ModuleForm = memo(function ModuleForm({
  module,
  isLoading = false,
  onSubmit,
  onCancel,
}: ModuleFormProps) {
  const { t } = useTranslation();

  const form = useForm({
    initialValues: {
      title: module?.title || '',
      description: module?.description || '',
    },
    validate: {
      title: (value) => {
        if (!value.trim()) return t('admin.modules.titleRequired');
        if (value.length < 3) return t('admin.modules.titleMinLength');
        return null;
      },
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    const data: CreateModuleRequest | UpdateModuleRequest = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
    };

    await onSubmit(data);
  });

  return (
    <ThemedPaper p="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label={t('admin.modules.titleLabel')}
            placeholder={t('admin.modules.titlePlaceholder')}
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label={t('admin.modules.descriptionLabel')}
            placeholder={t('admin.modules.descriptionPlaceholder')}
            rows={3}
            {...form.getInputProps('description')}
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
              {module ? t('common.save') : t('common.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </ThemedPaper>
  );
});

export default ModuleForm;
