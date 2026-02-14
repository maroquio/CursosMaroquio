import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Stack,
  Group,
  Button,
  Modal,
  Table,
  TextInput,
  NumberInput,
  Select,
  Switch,
  ActionIcon,
  Skeleton,
  Text,
  Badge,
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconStar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PageHeader, ConfirmModal } from '../../components/common';
import { useCrudPage, useNotification } from '../../hooks';
import { aiApi } from '../../api/ai';
import type { LlmModelDto, LlmManufacturerDto } from '../../api/ai';

interface ModelCreateData {
  manufacturerId: string;
  name: string;
  technicalName: string;
  pricePerMillionInputTokens: number;
  pricePerMillionOutputTokens: number;
  isDefault: boolean;
}

interface ModelUpdateData {
  name: string;
  technicalName: string;
  pricePerMillionInputTokens: number;
  pricePerMillionOutputTokens: number;
  isDefault: boolean;
}

const modelMessages = {
  fetchError: 'admin.llmModels.fetchError',
  fetchErrorMessage: 'admin.llmModels.fetchErrorMessage',
  createSuccess: 'admin.llmModels.createSuccess',
  createSuccessMessage: 'admin.llmModels.createSuccessMessage',
  createError: 'admin.llmModels.saveError',
  createErrorMessage: 'admin.llmModels.saveErrorMessage',
  updateSuccess: 'admin.llmModels.updateSuccess',
  updateSuccessMessage: 'admin.llmModels.updateSuccessMessage',
  updateError: 'admin.llmModels.saveError',
  updateErrorMessage: 'admin.llmModels.saveErrorMessage',
  deleteSuccess: 'admin.llmModels.deleteSuccess',
  deleteSuccessMessage: 'admin.llmModels.deleteSuccessMessage',
  deleteError: 'admin.llmModels.deleteError',
  deleteErrorMessage: 'admin.llmModels.deleteErrorMessage',
};

const modelApi = {
  list: () => aiApi.listModels(),
  create: (data: ModelCreateData) => aiApi.createModel(data),
  update: (id: string, data: ModelUpdateData) => aiApi.updateModel(id, data),
  delete: aiApi.deleteModel,
};

export function AdminLlmModels() {
  const { t } = useTranslation();
  const notification = useNotification();

  const {
    items: models,
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
    refetch,
  } = useCrudPage<LlmModelDto, ModelCreateData, ModelUpdateData>({
    api: modelApi,
    messages: modelMessages,
    getId: (m) => m.id,
  });

  // Manufacturers dependency (not managed by useCrudPage)
  const [manufacturers, setManufacturers] = useState<LlmManufacturerDto[]>([]);

  const fetchManufacturers = useCallback(async () => {
    try {
      const res = await aiApi.listManufacturers();
      if (res.success && res.data) setManufacturers(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchManufacturers();
  }, [fetchManufacturers]);

  // Filter state
  const [filterManufacturerId, setFilterManufacturerId] = useState<string | null>(null);

  // Form state
  const initialFormState = {
    manufacturerId: null as string | null,
    name: '',
    technicalName: '',
    priceInput: 0 as number | string,
    priceOutput: 0 as number | string,
    isDefault: false,
  };
  const [form, setForm] = useState(initialFormState);
  const updateForm = <K extends keyof typeof initialFormState>(key: K, value: typeof initialFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const manufacturerMap = new Map(manufacturers.map((m) => [m.id, m.name]));
  const manufacturerOptions = manufacturers.map((m) => ({ value: m.id, label: m.name }));

  const filteredModels = filterManufacturerId
    ? models.filter((m) => m.manufacturerId === filterManufacturerId)
    : models;

  const handleCreate = () => {
    setForm(initialFormState);
    onCreateClick();
  };

  const handleEdit = (item: LlmModelDto) => {
    setForm({
      manufacturerId: item.manufacturerId,
      name: item.name,
      technicalName: item.technicalName,
      priceInput: item.pricePerMillionInputTokens,
      priceOutput: item.pricePerMillionOutputTokens,
      isDefault: item.isDefault,
    });
    onEditClick(item);
  };

  const handleSetDefault = async (item: LlmModelDto) => {
    try {
      const response = await aiApi.setDefaultModel(item.id);
      if (response.success) {
        notification.success({
          title: t('admin.llmModels.setDefaultSuccess', 'Modelo padrao definido'),
          message: t('admin.llmModels.setDefaultSuccessMessage', `"${item.name}" agora e o modelo padrao.`),
        });
        refetch();
      }
    } catch {
      notification.error({
        title: t('admin.llmModels.setDefaultError', 'Erro'),
        message: t('admin.llmModels.setDefaultErrorMessage', 'Nao foi possivel definir o modelo padrao.'),
      });
    }
  };

  const onSubmit = () => {
    if (!form.manufacturerId || !form.name || !form.technicalName) return;
    const shared = {
      name: form.name,
      technicalName: form.technicalName,
      pricePerMillionInputTokens: Number(form.priceInput),
      pricePerMillionOutputTokens: Number(form.priceOutput),
      isDefault: form.isDefault,
    };
    if (itemToEdit) {
      handleFormSubmit(shared);
    } else {
      handleFormSubmit({ ...shared, manufacturerId: form.manufacturerId });
    }
  };

  return (
    <Box p="xl">
      <Stack gap="xl">
        <Group justify="space-between" align="flex-start">
          <PageHeader
            title={t('admin.llmModels.title', 'Modelos de LLM')}
            subtitle={t('admin.llmModels.subtitle', 'Gerencie os modelos de linguagem disponiveis.')}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
            {t('admin.llmModels.new', 'Novo Modelo')}
          </Button>
        </Group>

        <Select
          label={t('admin.llmModels.filterByManufacturer', 'Filtrar por provedor')}
          data={manufacturerOptions}
          value={filterManufacturerId}
          onChange={setFilterManufacturerId}
          clearable
          searchable
          placeholder={t('admin.llmModels.allManufacturers', 'Todos os provedores')}
          w={300}
        />

        {isLoading ? (
          <Stack gap="sm">
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </Stack>
        ) : filteredModels.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            {t('admin.llmModels.empty', 'Nenhum modelo cadastrado.')}
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('common.name', 'Nome')}</Table.Th>
                <Table.Th>{t('admin.llmModels.technicalName', 'Nome Tecnico')}</Table.Th>
                <Table.Th>{t('admin.llmModels.manufacturer', 'Provedor')}</Table.Th>
                <Table.Th>{t('admin.llmModels.priceInput', 'Preco Input (M)')}</Table.Th>
                <Table.Th>{t('admin.llmModels.priceOutput', 'Preco Output (M)')}</Table.Th>
                <Table.Th>{t('admin.llmModels.default', 'Padrao')}</Table.Th>
                <Table.Th>{t('common.actions', 'Acoes')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredModels.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.name}</Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace">{item.technicalName}</Text>
                  </Table.Td>
                  <Table.Td>{manufacturerMap.get(item.manufacturerId) || item.manufacturerId}</Table.Td>
                  <Table.Td>${item.pricePerMillionInputTokens.toFixed(2)}</Table.Td>
                  <Table.Td>${item.pricePerMillionOutputTokens.toFixed(2)}</Table.Td>
                  <Table.Td>
                    {item.isDefault ? (
                      <Badge color="yellow" leftSection={<IconStar size={12} />}>
                        {t('admin.llmModels.defaultLabel', 'Padrao')}
                      </Badge>
                    ) : (
                      <Button variant="subtle" size="xs" onClick={() => handleSetDefault(item)}>
                        {t('admin.llmModels.setDefault', 'Definir')}
                      </Button>
                    )}
                  </Table.Td>
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
          ? t('admin.llmModels.edit', 'Editar Modelo')
          : t('admin.llmModels.new', 'Novo Modelo')}
        size="lg"
      >
        <Stack gap="md">
          <Select
            label={t('admin.llmModels.manufacturer', 'Provedor')}
            data={manufacturerOptions}
            value={form.manufacturerId}
            onChange={(v) => updateForm('manufacturerId', v)}
            required
            disabled={!!itemToEdit}
            searchable
          />
          <TextInput
            label={t('common.name', 'Nome')}
            value={form.name}
            onChange={(e) => updateForm('name', e.currentTarget.value)}
            required
            placeholder="GPT-4o"
          />
          <TextInput
            label={t('admin.llmModels.technicalName', 'Nome Tecnico')}
            value={form.technicalName}
            onChange={(e) => updateForm('technicalName', e.currentTarget.value)}
            required
            placeholder="gpt-4o"
            styles={{ input: { fontFamily: 'monospace' } }}
          />
          <Group grow>
            <NumberInput
              label={t('admin.llmModels.priceInput', 'Preco Input (por M tokens)')}
              value={form.priceInput}
              onChange={(v) => updateForm('priceInput', v)}
              min={0}
              decimalScale={4}
              prefix="$"
            />
            <NumberInput
              label={t('admin.llmModels.priceOutput', 'Preco Output (por M tokens)')}
              value={form.priceOutput}
              onChange={(v) => updateForm('priceOutput', v)}
              min={0}
              decimalScale={4}
              prefix="$"
            />
          </Group>
          <Switch
            label={t('admin.llmModels.isDefault', 'Modelo padrao')}
            checked={form.isDefault}
            onChange={(e) => updateForm('isDefault', e.currentTarget.checked)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={closeFormModal}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            <Button
              onClick={onSubmit}
              loading={isSubmitting}
              disabled={!form.manufacturerId || !form.name || !form.technicalName}
            >
              {t('common.save', 'Salvar')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <ConfirmModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={t('admin.llmModels.deleteConfirmTitle', 'Excluir Modelo')}
        message={t('admin.llmModels.deleteConfirmMessage', `Tem certeza que deseja excluir "${itemToDelete?.name}"?`)}
        confirmLabel={t('common.delete', 'Excluir')}
        confirmColor="red"
        isLoading={isDeleting}
      />
    </Box>
  );
}

export default AdminLlmModels;
