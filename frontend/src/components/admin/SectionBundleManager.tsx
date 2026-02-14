import { useState, useEffect, useCallback } from 'react';
import {
  Stack,
  Group,
  Button,
  Text,
  Badge,
  Paper,
  Box,
  Progress,
  ActionIcon,
  Table,
  Loader,
  Alert,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import {
  IconX,
  IconCheck,
  IconTrash,
  IconPlayerPlay,
  IconAlertCircle,
  IconPackage,
  IconFileZip,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/admin.api';
import { useNotification } from '../../hooks';
import { ConfirmModal } from '../common';
import type { Section, SectionBundle } from '../../types/course.types';

interface SectionBundleManagerProps {
  section: Section;
  onClose?: () => void;
}

export function SectionBundleManager({ section, onClose }: SectionBundleManagerProps) {
  const { t } = useTranslation();
  const notification = useNotification();

  const [bundles, setBundles] = useState<SectionBundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [deleteBundle, setDeleteBundle] = useState<SectionBundle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadBundles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminApi.listSectionBundles(section.id);
      if (response.success && response.data) {
        setBundles(response.data.bundles);
      }
    } catch (error) {
      notification.error({
        title: t('admin.bundles.loadError'),
        message: error instanceof Error ? error.message : t('admin.bundles.loadErrorMessage'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [section.id, notification, t]);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.zip')) {
      notification.error({
        title: t('admin.bundles.invalidFileType'),
        message: t('admin.bundles.zipRequired'),
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress (since we don't have real progress from API)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    try {
      const response = await adminApi.uploadSectionBundle(section.id, file, true);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        notification.success({
          title: t('admin.bundles.uploadSuccess'),
          message: t('admin.bundles.uploadSuccessMessage'),
        });
        await loadBundles();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      clearInterval(progressInterval);
      notification.error({
        title: t('admin.bundles.uploadError'),
        message: error instanceof Error ? error.message : t('admin.bundles.uploadErrorMessage'),
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleActivate = async (bundle: SectionBundle) => {
    if (bundle.isActive) return;

    setIsActivating(bundle.id);
    try {
      const response = await adminApi.activateSectionBundle(bundle.id);
      if (response.success) {
        notification.success({
          title: t('admin.bundles.activateSuccess'),
          message: t('admin.bundles.activateSuccessMessage', { version: bundle.version }),
        });
        await loadBundles();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      notification.error({
        title: t('admin.bundles.activateError'),
        message: error instanceof Error ? error.message : t('admin.bundles.activateErrorMessage'),
      });
    } finally {
      setIsActivating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteBundle) return;

    setIsDeleting(true);
    try {
      const response = await adminApi.deleteSectionBundle(deleteBundle.id);
      if (response.success) {
        notification.success({
          title: t('admin.bundles.deleteSuccess'),
          message: t('admin.bundles.deleteSuccessMessage'),
        });
        setDeleteBundle(null);
        await loadBundles();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      notification.error({
        title: t('admin.bundles.deleteError'),
        message: error instanceof Error ? error.message : t('admin.bundles.deleteErrorMessage'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Stack align="center" justify="center" p="xl">
        <Loader size="lg" />
        <Text c="dimmed">{t('admin.bundles.loading')}</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* Section Info */}
      <Paper withBorder p="md" bg="var(--mantine-color-blue-light)">
        <Group gap="sm">
          <IconPackage size={20} />
          <Box>
            <Text fw={600}>{section.title}</Text>
            <Text size="sm" c="dimmed">
              {t('admin.bundles.contentType')}: {section.contentType}
            </Text>
          </Box>
        </Group>
      </Paper>

      {/* Upload Dropzone */}
      <Dropzone
        onDrop={handleUpload}
        accept={{
          'application/zip': ['.zip'],
          'application/x-zip-compressed': ['.zip'],
        }}
        maxFiles={1}
        loading={isUploading}
        disabled={isUploading}
      >
        <Group justify="center" gap="xl" style={{ minHeight: 120, pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <IconCheck size={50} stroke={1.5} color="var(--mantine-color-green-6)" />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size={50} stroke={1.5} color="var(--mantine-color-red-6)" />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconFileZip size={50} stroke={1.5} color="var(--mantine-color-dimmed)" />
          </Dropzone.Idle>

          <Box>
            <Text size="lg" inline>
              {t('admin.bundles.dropzoneTitle')}
            </Text>
            <Text size="sm" c="dimmed" inline mt={7}>
              {t('admin.bundles.dropzoneDescription')}
            </Text>
          </Box>
        </Group>
      </Dropzone>

      {isUploading && (
        <Progress
          value={uploadProgress}
          size="sm"
          color={uploadProgress === 100 ? 'green' : 'blue'}
          animated={uploadProgress < 100}
        />
      )}

      {/* Bundles List */}
      <Box>
        <Text fw={600} mb="sm">
          {t('admin.bundles.versions')} ({bundles.length})
        </Text>

        {bundles.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="gray">
            {t('admin.bundles.noBundles')}
          </Alert>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('admin.bundles.version')}</Table.Th>
                <Table.Th>{t('admin.bundles.entrypoint')}</Table.Th>
                <Table.Th>{t('admin.bundles.createdAt')}</Table.Th>
                <Table.Th>{t('admin.bundles.status')}</Table.Th>
                <Table.Th>{t('common.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {bundles.map((bundle) => (
                <Table.Tr key={bundle.id}>
                  <Table.Td>
                    <Text fw={600}>v{bundle.version}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {bundle.entrypoint}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatDate(bundle.createdAt)}</Text>
                  </Table.Td>
                  <Table.Td>
                    {bundle.isActive ? (
                      <Badge color="green" variant="filled">
                        {t('admin.bundles.active')}
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="outline">
                        {t('admin.bundles.inactive')}
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {!bundle.isActive && (
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => handleActivate(bundle)}
                          loading={isActivating === bundle.id}
                          title={t('admin.bundles.activate')}
                        >
                          <IconPlayerPlay size={16} />
                        </ActionIcon>
                      )}
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => setDeleteBundle(bundle)}
                        disabled={bundle.isActive}
                        title={
                          bundle.isActive
                            ? t('admin.bundles.cannotDeleteActive')
                            : t('admin.bundles.delete')
                        }
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Box>

      {/* Actions */}
      {onClose && (
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t('common.close')}
          </Button>
        </Group>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        opened={!!deleteBundle}
        onClose={() => setDeleteBundle(null)}
        onConfirm={handleDelete}
        title={t('admin.bundles.deleteConfirmTitle')}
        message={t('admin.bundles.deleteConfirmMessage', { version: deleteBundle?.version })}
        confirmLabel={t('common.delete')}
        confirmColor="red"
        isLoading={isDeleting}
      />
    </Stack>
  );
}

export default SectionBundleManager;
