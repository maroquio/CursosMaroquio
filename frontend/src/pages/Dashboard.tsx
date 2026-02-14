import { Container, Title, Text, Card, SimpleGrid, Stack, Badge, Group } from '@mantine/core';
import { IconBook, IconCertificate, IconChartBar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/auth.store';

export function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const stats = [
    {
      title: t('dashboard.myCourses'),
      value: '0',
      icon: IconBook,
      color: 'blue',
    },
    {
      title: t('dashboard.progress'),
      value: '0%',
      icon: IconChartBar,
      color: 'green',
    },
    {
      title: t('dashboard.certificates'),
      value: '0',
      icon: IconCertificate,
      color: 'orange',
    },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2}>{t('dashboard.title')}</Title>
          <Text c="dimmed" mt="xs">
            {t('dashboard.welcome', { name: user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'User' })}
          </Text>
        </div>

        <Group gap="xs">
          {user?.roles?.map((role) => (
            <Badge key={role} variant="light">
              {role}
            </Badge>
          ))}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {stats.map((stat) => (
            <Card key={stat.title} withBorder padding="lg" radius="md">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                    {stat.title}
                  </Text>
                  <Text fw={700} size="xl">
                    {stat.value}
                  </Text>
                </div>
                <stat.icon size={32} style={{ color: `var(--mantine-color-${stat.color}-6)` }} />
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}
