import { memo, useMemo, useCallback } from 'react';
import { Text, Badge } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DataTable, ActionMenu, type Column, type ActionMenuItem } from '../common';
import type { CalendarEvent } from '../../api/calendar.api';

export interface CalendarEventTableProps {
  events: CalendarEvent[];
  isLoading?: boolean;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
}

const getEventTypeLabel = (type: string) => {
  switch (type) {
    case 'live':
      return 'Ao Vivo';
    case 'deadline':
      return 'Prazo';
    case 'mentoring':
      return 'Mentoria';
    default:
      return 'Outro';
  }
};

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'live':
      return 'indigo';
    case 'deadline':
      return 'rose';
    case 'mentoring':
      return 'emerald';
    default:
      return 'slate';
  }
};

export const CalendarEventTable = memo(function CalendarEventTable({
  events,
  isLoading = false,
  onEdit,
  onDelete,
}: CalendarEventTableProps) {
  const { t } = useTranslation();

  const getActionItems = useCallback(
    (event: CalendarEvent): ActionMenuItem[] => {
      return [
        {
          key: 'edit',
          label: t('common.edit'),
          icon: <IconEdit size={14} />,
          onClick: () => onEdit?.(event),
        },
        {
          key: 'delete',
          label: t('common.delete'),
          icon: <IconTrash size={14} />,
          color: 'red',
          onClick: () => onDelete?.(event),
        },
      ];
    },
    [t, onEdit, onDelete]
  );

  const columns: Column<CalendarEvent>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Título',
        render: (event) => (
          <Text size="sm" fw={500}>
            {event.title}
          </Text>
        ),
      },
      {
        key: 'date',
        header: 'Data',
        render: (event) => (
          <Text size="sm">
            {new Date(event.date).toLocaleDateString('pt-BR')}
            {event.time && ` às ${event.time}`}
          </Text>
        ),
      },
      {
        key: 'type',
        header: 'Tipo',
        render: (event) => (
          <Badge variant="light" color={getEventTypeColor(event.type)}>
            {getEventTypeLabel(event.type)}
          </Badge>
        ),
      },
      {
        key: 'course',
        header: 'Curso',
        render: (event) => (
          <Text size="sm" c="dimmed">
            {event.courseName || 'Global'}
          </Text>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        align: 'center',
        render: (event) => <ActionMenu items={getActionItems(event)} />,
      },
    ],
    [t, getActionItems]
  );

  return (
    <DataTable
      data={events}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="Nenhum evento cadastrado"
      getRowKey={(event) => event.id}
    />
  );
});

export default CalendarEventTable;
