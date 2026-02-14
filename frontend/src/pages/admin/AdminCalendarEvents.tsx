import { Box, Stack, Group, Button, Modal } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PageHeader, ConfirmModal } from '../../components/common';
import { CalendarEventForm, CalendarEventTable } from '../../components/admin';
import {
  calendarApi,
  type CalendarEvent,
  type CreateCalendarEventRequest,
  type UpdateCalendarEventRequest,
} from '../../api/calendar.api';
import { useCrudPage } from '../../hooks';

const eventMessages = {
  fetchError: 'admin.calendarEvents.fetchError',
  fetchErrorMessage: 'admin.calendarEvents.fetchErrorMessage',
  createSuccess: 'admin.calendarEvents.createSuccess',
  createSuccessMessage: 'admin.calendarEvents.createSuccessMessage',
  createError: 'admin.calendarEvents.createError',
  createErrorMessage: 'admin.calendarEvents.createErrorMessage',
  updateSuccess: 'admin.calendarEvents.updateSuccess',
  updateSuccessMessage: 'admin.calendarEvents.updateSuccessMessage',
  updateError: 'admin.calendarEvents.updateError',
  updateErrorMessage: 'admin.calendarEvents.updateErrorMessage',
  deleteSuccess: 'admin.calendarEvents.deleteSuccess',
  deleteSuccessMessage: 'admin.calendarEvents.deleteSuccessMessage',
  deleteError: 'admin.calendarEvents.deleteError',
  deleteErrorMessage: 'admin.calendarEvents.deleteErrorMessage',
};

const eventApi = {
  list: calendarApi.listAllEvents,
  create: calendarApi.createEvent,
  update: (id: string, data: UpdateCalendarEventRequest) => calendarApi.updateEvent(id, data),
  delete: calendarApi.deleteEvent,
};

export function AdminCalendarEvents() {
  const { t } = useTranslation();

  const {
    items: events,
    isLoading,
    formModalOpened,
    deleteModalOpened,
    itemToEdit: eventToEdit,
    itemToDelete: eventToDelete,
    isSubmitting,
    isDeleting,
    handleCreate,
    handleEdit,
    handleDelete,
    handleFormSubmit,
    confirmDelete,
    closeFormModal,
    closeDeleteModal,
  } = useCrudPage<CalendarEvent, CreateCalendarEventRequest, UpdateCalendarEventRequest>({
    api: eventApi,
    messages: eventMessages,
    getId: (e) => e.id,
    sortItems: (items) =>
      [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  });

  return (
    <Box p="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <PageHeader title="Eventos do Calendario" subtitle="Gerenciar eventos para os alunos" />
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
            Novo Evento
          </Button>
        </Group>

        <CalendarEventTable
          events={events}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </Stack>

      <Modal
        opened={formModalOpened}
        onClose={closeFormModal}
        title={eventToEdit ? 'Editar Evento' : 'Novo Evento'}
        size="lg"
      >
        <CalendarEventForm
          initialValues={eventToEdit || undefined}
          onSubmit={handleFormSubmit}
          onCancel={closeFormModal}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Excluir Evento"
        message={`Tem certeza que deseja excluir o evento "${eventToDelete?.title}"? Esta acao nao pode ser desfeita.`}
        confirmLabel={t('common.delete')}
        confirmColor="red"
        isLoading={isDeleting}
      />
    </Box>
  );
}

export default AdminCalendarEvents;
