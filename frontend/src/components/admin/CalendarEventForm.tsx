import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import { Stack, TextInput, Textarea, Group, Button, Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type {
  CalendarEvent,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from '../../api/calendar.api';
import { adminApi } from '../../api/admin.api';

interface CalendarEventFormProps {
  initialValues?: CalendarEvent;
  onSubmit: (values: CreateCalendarEventRequest | UpdateCalendarEventRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Helper to format date for input
const formatDateForInput = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

export function CalendarEventForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: CalendarEventFormProps) {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await adminApi.listCourses({ limit: 100 });
        if (response.success && response.data?.courses) {
          setCourses(
            response.data.courses.map((c) => ({
              value: c.id,
              label: c.title,
            }))
          );
        }
      } catch {
        // Ignore errors
      }
    };
    fetchCourses();
  }, []);

  const form = useForm({
    initialValues: {
      title: initialValues?.title || '',
      description: initialValues?.description || '',
      date: formatDateForInput(initialValues?.date) || new Date().toISOString().split('T')[0],
      time: initialValues?.time || '',
      type: initialValues?.type || 'other',
      courseId: initialValues?.courseId || '',
    },
    validate: {
      title: (value) => {
        if (!value.trim()) {
          return 'O título é obrigatório';
        }
        if (value.length > 200) {
          return 'O título deve ter no máximo 200 caracteres';
        }
        return null;
      },
      date: (value) => {
        if (!value) {
          return 'A data é obrigatória';
        }
        // Validate date format YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return 'Data inválida (use o formato AAAA-MM-DD)';
        }
        return null;
      },
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    // Convert date string to ISO format
    const dateObj = new Date(values.date + 'T12:00:00Z');

    onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() || null,
      date: dateObj.toISOString(),
      time: values.time?.trim() || null,
      type: values.type as 'live' | 'deadline' | 'mentoring' | 'other',
      courseId: values.courseId || null,
    });
  };

  const typeOptions = [
    { value: 'live', label: 'Ao Vivo' },
    { value: 'deadline', label: 'Prazo' },
    { value: 'mentoring', label: 'Mentoria' },
    { value: 'other', label: 'Outro' },
  ];

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        <TextInput
          label="Título"
          placeholder="Digite o título do evento"
          required
          {...form.getInputProps('title')}
        />

        <Textarea
          label="Descrição"
          placeholder="Descrição opcional do evento"
          rows={3}
          {...form.getInputProps('description')}
        />

        <Group grow>
          <TextInput
            label="Data"
            placeholder="AAAA-MM-DD"
            type="date"
            required
            {...form.getInputProps('date')}
          />

          <TextInput
            label="Horário"
            placeholder="Ex: 19:00"
            {...form.getInputProps('time')}
          />
        </Group>

        <Select
          label="Tipo"
          placeholder="Selecione o tipo"
          data={typeOptions}
          required
          {...form.getInputProps('type')}
        />

        <Select
          label="Curso (opcional)"
          placeholder="Selecione um curso ou deixe vazio para evento global"
          data={courses}
          clearable
          searchable
          {...form.getInputProps('courseId')}
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

export default CalendarEventForm;
