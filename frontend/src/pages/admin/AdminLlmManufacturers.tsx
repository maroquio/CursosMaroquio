import { useState } from 'react';
import {
  Box,
  Stack,
  Group,
  Button,
  Modal,
  Table,
  TextInput,
  ActionIcon,
  Skeleton,
  Text,
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PageHeader, ConfirmModal } from '../../components/common';
import { useCrudPage } from '../../hooks';
import { aiApi } from '../../api/ai';
import type { LlmManufacturerDto } from '../../api/ai';

interface ManufacturerFormData {
  name: string;
  slug: string;
}

const manufacturerMessages = {
  fetchError: 'admin.llmManufacturers.fetchError',
  fetchErrorMessage: 'admin.llmManufacturers.fetchErrorMessage',
  createSuccess: 'admin.llmManufacturers.createSuccess',
  createSuccessMessage: 'admin.llmManufacturers.createSuccessMessage',
  createError: 'admin.llmManufacturers.saveError',
  createErrorMessage: 'admin.llmManufacturers.saveErrorMessage',
  updateSuccess: 'admin.llmManufacturers.updateSuccess',
  updateSuccessMessage: 'admin.llmManufacturers.updateSuccessMessage',
  updateError: 'admin.llmManufacturers.saveError',
  updateErrorMessage: 'admin.llmManufacturers.saveErrorMessage',
  deleteSuccess: 'admin.llmManufacturers.deleteSuccess',
  deleteSuccessMessage: 'admin.llmManufacturers.deleteSuccessMessage',
  deleteError: 'admin.llmManufacturers.deleteError',
  deleteErrorMessage: 'admin.llmManufacturers.deleteErrorMessage',
};

const manufacturerApi = {
  list: aiApi.listManufacturers,
  create: (data: ManufacturerFormData) => aiApi.createManufacturer(data),
  update: (id: string, data: ManufacturerFormData) => aiApi.updateManufacturer(id, data),
  delete: aiApi.deleteManufacturer,
};

export function AdminLlmManufacturers() {
  const { t } = useTranslation();

  const {
    items: manufacturers,
    isLoading,
    formModalOpened,
    deleteModalOpened,
    itemToEdit,
    itemToDelete,
    isSubmitting,
    isDeleting,
    handleCreate: onCreateClick,
    handleEdit: onEditClick,
    handleDelete,
    handleFormSubmit,
    confirmDelete,
    closeFormModal,
    closeDeleteModal,
  } = useCrudPage<LlmManufacturerDto, ManufacturerFormData, ManufacturerFormData>({
    api: manufacturerApi,
    messages: manufacturerMessages,
    getId: (m) => m.id,
  });

  // Inline form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');

  const handleCreate = () => {
    setFormName('');
    setFormSlug('');
    onCreateClick();
  };

  const handleEdit = (item: LlmManufacturerDto) => {
    setFormName(item.name);
    setFormSlug(item.slug);
    onEditClick(item);
  };

  const onSubmit = () => {
    handleFormSubmit({ name: formName, slug: formSlug });
  };

  return (
    <Box p="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <PageHeader
            title={t('admin.llmManufacturers.title', 'Fabricantes de LLM')}
            subtitle={t('admin.llmManufacturers.subtitle', 'Gerencie os fabricantes de modelos de linguagem.')}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
            {t('admin.llmManufacturers.new', 'Novo Fabricante')}
          </Button>
        </Group>

        {isLoading ? (
          <Stack gap="sm">
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Stack>
        ) : manufacturers.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {t('admin.llmManufacturers.empty', 'Nenhum fabricante cadastrado.')}
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.name', 'Nome')}</Table.Th>
                <Table.Th>Slug</Table.Th>
                <Table.Th>{t('common.createdAt', 'Criado em')}</Table.Th>
                <Table.Th>{t('common.actions', 'Acoes')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {manufacturers.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.name}</Table.Td>
                  <Table.Td>{item.slug}</Table.Td>
                  <Table.Td>{new Date(item.createdAt).toLocaleDateString()}</Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon variant="subtle" onClick={() => handleEdit(item)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(item)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>

      <Modal
        opened={formModalOpened}
        onClose={closeFormModal}
        title={itemToEdit
          ? t('admin.llmManufacturers.edit', 'Editar Fabricante')
          : t('admin.llmManufacturers.new', 'Novo Fabricante')}
      >
        <Stack gap="md">
          <TextInput
            label={t('common.name', 'Nome')}
            value={formName}
            onChange={(e) => setFormName(e.currentTarget.value)}
            required
          />
          <TextInput
            label="Slug"
            value={formSlug}
            onChange={(e) => setFormSlug(e.currentTarget.value)}
            required
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeFormModal}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button onClick={onSubmit} loading={isSubmitting} disabled={!formName || !formSlug}>
              {t('common.save', 'Salvar')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={t('admin.llmManufacturers.deleteConfirmTitle', 'Excluir Fabricante')}
        message={t('admin.llmManufacturers.deleteConfirmMessage', `Tem certeza que deseja excluir "${itemToDelete?.name}"?`)}
        confirmLabel={t('common.delete', 'Excluir')}
        confirmColor="red"
        isLoading={isDeleting}
      />
    </Box>
  );
}

export default AdminLlmManufacturers;
