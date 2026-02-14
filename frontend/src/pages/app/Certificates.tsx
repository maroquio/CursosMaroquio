import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Text,
  SimpleGrid,
  Stack,
  Badge,
  Group,
  Button,
  ThemeIcon,
  Loader,
  Center,
} from '@mantine/core';
import { IconCertificate, IconDownload, IconShare } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PageHeader, ThemedPaper } from '../../components/common';
import { certificatesApi, type Certificate } from '../../api/certificates.api';
import { useNotification } from '../../hooks';

export function Certificates() {
  const { t } = useTranslation();
  const notification = useNotification();

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCertificates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await certificatesApi.getMyCertificates();
      if (response.success && response.data) {
        setCertificates(response.data);
      }
    } catch {
      notification.error({
        title: 'Erro',
        message: 'Não foi possível carregar seus certificados.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [notification]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleShare = (cert: Certificate) => {
    const url = `${window.location.origin}/certificates/verify/${cert.certificateNumber}`;
    navigator.clipboard.writeText(url);
    notification.success({
      title: 'Link copiado!',
      message: 'O link de verificação foi copiado para a área de transferência.',
    });
  };

  if (isLoading) {
    return (
      <Box p="xl">
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Stack gap="xl">
        <PageHeader title={t('nav.certificates')} subtitle="Seus certificados de conclusão" />

        {certificates.length === 0 ? (
          <ThemedPaper p="xl">
            <Stack align="center" gap="md" py="xl">
              <ThemeIcon size={64} radius="xl" variant="light" color="slate">
                <IconCertificate size={32} />
              </ThemeIcon>
              <Text c="dimmed" ta="center">
                Você ainda não possui certificados.
                <br />
                Complete um curso para receber seu certificado!
              </Text>
            </Stack>
          </ThemedPaper>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {certificates.map((cert) => (
              <ThemedPaper key={cert.id} p="lg">
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <ThemeIcon
                      size={40}
                      radius="lg"
                      variant="gradient"
                      gradient={{ from: 'amber', to: 'rose', deg: 135 }}
                    >
                      <IconCertificate size={20} />
                    </ThemeIcon>
                    <Badge variant="light" color="emerald">
                      Válido
                    </Badge>
                  </Group>

                  <div>
                    <Text fw={600} size="lg" style={{ fontFamily: '"Outfit", sans-serif' }}>
                      {cert.courseName}
                    </Text>
                    <Text c="dimmed" size="sm" mt="xs">
                      Emitido em: {new Date(cert.issuedAt).toLocaleDateString('pt-BR')}
                    </Text>
                    <Text c="dimmed" size="xs" mt={4}>
                      ID: {cert.certificateNumber}
                    </Text>
                  </div>

                  <Group gap="sm">
                    <Button variant="light" size="xs" leftSection={<IconDownload size={14} />} disabled>
                      Download PDF
                    </Button>
                    <Button
                      variant="subtle"
                      size="xs"
                      leftSection={<IconShare size={14} />}
                      onClick={() => handleShare(cert)}
                    >
                      Compartilhar
                    </Button>
                  </Group>
                </Stack>
              </ThemedPaper>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Box>
  );
}
