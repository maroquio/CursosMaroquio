import { memo } from 'react';
import {
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Switch,
  Stack,
  Group,
  Button,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ThemedPaper } from '../common/ThemedPaper';
import type { Lesson, CreateLessonRequest, UpdateLessonRequest } from '../../types/course.types';

export interface LessonFormProps {
  lesson?: Lesson;
  isLoading?: boolean;
  onSubmit: (data: CreateLessonRequest | UpdateLessonRequest) => Promise<void>;
  onCancel: () => void;
}

const lessonTypeOptions = [
  { value: 'video', label: 'Video' },
  { value: 'text', label: 'Texto' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Atividade' },
];

export const LessonForm = memo(function LessonForm({
  lesson,
  isLoading = false,
  onSubmit,
  onCancel,
}: LessonFormProps) {
  const { t } = useTranslation();

  const form = useForm({
    initialValues: {
      title: lesson?.title || '',
      description: lesson?.description || '',
      content: lesson?.content || '',
      type: lesson?.type || 'video',
      videoUrl: lesson?.videoUrl || '',
      duration: lesson?.duration || 0,
      isFree: lesson?.isFree || false,
    },
    validate: {
      title: (value) => {
        if (!value.trim()) return t('admin.lessons.titleRequired');
        if (value.length < 3) return t('admin.lessons.titleMinLength');
        return null;
      },
      videoUrl: (value, values) => {
        if (values.type === 'video' && !value.trim()) {
          return t('admin.lessons.videoUrlRequired');
        }
        return null;
      },
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    const data: CreateLessonRequest | UpdateLessonRequest = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      content: values.content.trim() || undefined,
      type: values.type as 'video' | 'text' | 'quiz' | 'assignment',
      videoUrl: values.type === 'video' ? values.videoUrl.trim() : undefined,
      duration: values.duration > 0 ? values.duration : undefined,
      isFree: values.isFree,
    };

    await onSubmit(data);
  });

  return (
    <ThemedPaper p="lg">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label={t('admin.lessons.titleLabel')}
            placeholder={t('admin.lessons.titlePlaceholder')}
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label={t('admin.lessons.descriptionLabel')}
            placeholder={t('admin.lessons.descriptionPlaceholder')}
            rows={2}
            {...form.getInputProps('description')}
          />

          <Group grow>
            <Select
              label={t('admin.lessons.typeLabel')}
              data={lessonTypeOptions}
              required
              {...form.getInputProps('type')}
            />

            <NumberInput
              label={t('admin.lessons.durationLabel')}
              placeholder="0"
              min={0}
              suffix=" min"
              {...form.getInputProps('duration')}
            />
          </Group>

          {form.values.type === 'video' && (
            <TextInput
              label={t('admin.lessons.videoUrlLabel')}
              placeholder="https://www.youtube.com/embed/..."
              required
              {...form.getInputProps('videoUrl')}
            />
          )}

          <Textarea
            label={t('admin.lessons.contentLabel')}
            placeholder={t('admin.lessons.contentPlaceholder')}
            rows={8}
            {...form.getInputProps('content')}
          />

          <Switch
            label={t('admin.lessons.isFreeLabel')}
            description={t('admin.lessons.isFreeDescription')}
            {...form.getInputProps('isFree', { type: 'checkbox' })}
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
              {lesson ? t('common.save') : t('common.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </ThemedPaper>
  );
});

export default LessonForm;
