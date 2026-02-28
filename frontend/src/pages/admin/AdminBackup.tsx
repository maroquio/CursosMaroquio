import { useState } from 'react';
import {
  Box,
  Stack,
  SimpleGrid,
  Title,
  Text,
  Button,
  Alert,
  Divider,
  List,
} from '@mantine/core';
import { Dropzone } from '@mantine/dropzone';
import {
  IconDownload,
  IconUpload,
  IconCheck,
  IconX,
  IconFile,
  IconAlertCircle,
} from '@tabler/icons-react';
import { PageHeader } from '../../components/common';
import { ThemedPaper } from '../../components/common';
import { adminApi } from '../../api/admin.api';
import { useNotification } from '../../hooks';

interface ImportResult {
  type: 'courses' | 'users';
  data: Record<string, unknown>;
  errors: string[];
}

export function AdminBackup() {
  const notify = useNotification();
  const [isExportingCourses, setIsExportingCourses] = useState(false);
  const [isImportingCourses, setIsImportingCourses] = useState(false);
  const [isExportingUsers, setIsExportingUsers] = useState(false);
  const [isImportingUsers, setIsImportingUsers] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleExportCourses = async () => {
    setIsExportingCourses(true);
    try {
      await adminApi.exportCourses();
      notify.success({ title: 'Exportação concluída', message: 'ZIP de cursos baixado com sucesso.' });
    } catch {
      notify.error({ title: 'Erro na exportação', message: 'Não foi possível exportar os cursos.' });
    } finally {
      setIsExportingCourses(false);
    }
  };

  const handleImportCourses = async (files: File[]) => {
    if (!files[0]) return;
    setIsImportingCourses(true);
    setImportResult(null);
    try {
      const response = await adminApi.importCourses(files[0]);
      if (response.success && response.data) {
        setImportResult({ type: 'courses', data: response.data as Record<string, unknown>, errors: (response.data as any).errors ?? [] });
        notify.success({ title: 'Importação concluída', message: 'Cursos importados com sucesso.' });
      }
    } catch {
      notify.error({ title: 'Erro na importação', message: 'Não foi possível importar os cursos.' });
    } finally {
      setIsImportingCourses(false);
    }
  };

  const handleExportUsers = async () => {
    setIsExportingUsers(true);
    try {
      await adminApi.exportUsers();
      notify.success({ title: 'Exportação concluída', message: 'ZIP de usuários baixado com sucesso.' });
    } catch {
      notify.error({ title: 'Erro na exportação', message: 'Não foi possível exportar os usuários.' });
    } finally {
      setIsExportingUsers(false);
    }
  };

  const handleImportUsers = async (files: File[]) => {
    if (!files[0]) return;
    setIsImportingUsers(true);
    setImportResult(null);
    try {
      const response = await adminApi.importUsers(files[0]);
      if (response.success && response.data) {
        setImportResult({ type: 'users', data: response.data as Record<string, unknown>, errors: (response.data as any).errors ?? [] });
        notify.success({ title: 'Importação concluída', message: 'Usuários importados com sucesso.' });
      }
    } catch {
      notify.error({ title: 'Erro na importação', message: 'Não foi possível importar os usuários.' });
    } finally {
      setIsImportingUsers(false);
    }
  };

  return (
    <Box p="xl">
      <Stack gap="xl">
        <PageHeader
          title="Backup & Restauração"
          subtitle="Exporte ou importe cursos e usuários em formato ZIP"
        />

        {importResult && (
          <Alert
            icon={importResult.errors.length > 0 ? <IconAlertCircle size={16} /> : <IconCheck size={16} />}
            color={importResult.errors.length > 0 ? 'orange' : 'green'}
            title={`Resultado da importação de ${importResult.type === 'courses' ? 'cursos' : 'usuários'}`}
            withCloseButton
            onClose={() => setImportResult(null)}
          >
            <Stack gap="xs">
              {Object.entries(importResult.data)
                .filter(([key]) => key !== 'errors')
                .map(([key, value]) => (
                  <Text key={key} size="sm">
                    <strong>{key}:</strong> {String(value)}
                  </Text>
                ))}
              {importResult.errors.length > 0 && (
                <>
                  <Divider my="xs" />
                  <Text size="sm" fw={600} c="orange">
                    {importResult.errors.length} erro(s):
                  </Text>
                  <List size="sm" spacing="xs">
                    {importResult.errors.slice(0, 10).map((err, i) => (
                      <List.Item key={i}>{err}</List.Item>
                    ))}
                    {importResult.errors.length > 10 && (
                      <List.Item>... e mais {importResult.errors.length - 10} erros</List.Item>
                    )}
                  </List>
                </>
              )}
            </Stack>
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          {/* Courses Column */}
          <ThemedPaper p="xl">
            <Stack gap="lg">
              <Title order={4}>Cursos</Title>
              <Text size="sm" c="dimmed">
                Exporta toda a hierarquia de cursos: módulos, lições, seções e arquivos dos bundles ativos.
              </Text>

              <Stack gap="sm">
                <Text size="sm" fw={600}>Exportar</Text>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExportCourses}
                  loading={isExportingCourses}
                  variant="light"
                  fullWidth
                >
                  Exportar Cursos
                </Button>
              </Stack>

              <Divider />

              <Stack gap="sm">
                <Text size="sm" fw={600}>Importar</Text>
                <Dropzone
                  onDrop={handleImportCourses}
                  accept={['application/zip', 'application/x-zip-compressed', 'application/octet-stream']}
                  maxFiles={1}
                  loading={isImportingCourses}
                  disabled={isImportingCourses}
                >
                  <Stack align="center" gap="xs" py="sm">
                    <Dropzone.Accept>
                      <IconUpload size={24} />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX size={24} />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconFile size={24} />
                    </Dropzone.Idle>
                    <Text size="sm" ta="center">
                      Arraste o ZIP de cursos aqui ou clique para selecionar
                    </Text>
                    <Text size="xs" c="dimmed">
                      Apenas arquivos .zip
                    </Text>
                  </Stack>
                </Dropzone>
              </Stack>
            </Stack>
          </ThemedPaper>

          {/* Users Column */}
          <ThemedPaper p="xl">
            <Stack gap="lg">
              <Title order={4}>Usuários</Title>
              <Text size="sm" c="dimmed">
                Exporta usuários com roles, permissões, matrículas e progresso de lições/seções.
              </Text>

              <Stack gap="sm">
                <Text size="sm" fw={600}>Exportar</Text>
                <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExportUsers}
                  loading={isExportingUsers}
                  variant="light"
                  fullWidth
                >
                  Exportar Usuários
                </Button>
              </Stack>

              <Divider />

              <Stack gap="sm">
                <Text size="sm" fw={600}>Importar</Text>
                <Dropzone
                  onDrop={handleImportUsers}
                  accept={['application/zip', 'application/x-zip-compressed', 'application/octet-stream']}
                  maxFiles={1}
                  loading={isImportingUsers}
                  disabled={isImportingUsers}
                >
                  <Stack align="center" gap="xs" py="sm">
                    <Dropzone.Accept>
                      <IconUpload size={24} />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX size={24} />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconFile size={24} />
                    </Dropzone.Idle>
                    <Text size="sm" ta="center">
                      Arraste o ZIP de usuários aqui ou clique para selecionar
                    </Text>
                    <Text size="xs" c="dimmed">
                      Apenas arquivos .zip
                    </Text>
                  </Stack>
                </Dropzone>
              </Stack>
            </Stack>
          </ThemedPaper>
        </SimpleGrid>
      </Stack>
    </Box>
  );
}

export default AdminBackup;
