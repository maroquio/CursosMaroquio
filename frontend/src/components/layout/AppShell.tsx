import { AppShell as MantineAppShell, Drawer, Stack, Group, Text, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { Footer } from './Footer';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageSelector } from '../common/LanguageSelector';

export function AppShell() {
  const [opened, { toggle, close }] = useDisclosure();
  const { t } = useTranslation();

  return (
    <MantineAppShell
      header={{ height: 60 }}
      padding={0}
    >
      <MantineAppShell.Header>
        <Header opened={opened} onToggle={toggle} />
      </MantineAppShell.Header>

      <Drawer
        opened={opened}
        onClose={close}
        title={
          <Text fw={600} size="lg">
            {t('nav.settings')}
          </Text>
        }
        size="100%"
        hiddenFrom="sm"
      >
        <Divider mb="lg" />
        <Stack gap="md" align="flex-start">
          <Group gap="sm">
            <ThemeToggle />
            <Text size="sm">{t('common.theme')}</Text>
          </Group>
          <Group gap="sm">
            <LanguageSelector />
            <Text size="sm">{t('common.language')}</Text>
          </Group>
        </Stack>
      </Drawer>

      <MantineAppShell.Main>
        <Outlet />
        <Footer />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
