import { Group, Button, Text, Container, Burger, ThemeIcon, Box } from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../common/ThemeToggle';
import { LanguageSelector } from '../common/LanguageSelector';
import { useAuthStore } from '../../stores/auth.store';

interface HeaderProps {
  opened?: boolean;
  onToggle?: () => void;
}

export function Header({ opened, onToggle }: HeaderProps) {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <Container size="xl" h="100%" px="sm">
      <Group h="100%" justify="space-between" wrap="nowrap">
        <Group wrap="nowrap">
          {onToggle && (
            <Burger opened={opened} onClick={onToggle} hiddenFrom="sm" size="sm" />
          )}
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon
                size="md"
                radius="md"
                variant="gradient"
                gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
              >
                <IconSchool size={16} />
              </ThemeIcon>
              <Text fw={700} size="md" style={{ fontFamily: '"Outfit", sans-serif' }}>
                Maroquio.com
              </Text>
              <Text
                size="sm"
                c="dimmed"
                visibleFrom="sm"
                style={{
                  borderLeft: '1px solid currentColor',
                  paddingLeft: '0.5rem',
                  opacity: 0.55,
                  fontFamily: '"Outfit", sans-serif',
                }}
              >
                Cursos Online
              </Text>
            </Group>
          </Link>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Box visibleFrom="sm">
            <ThemeToggle />
          </Box>
          <Box visibleFrom="sm">
            <LanguageSelector />
          </Box>

          {isAuthenticated ? (
            <Group gap="xs" wrap="nowrap">
              <Button
                variant="subtle"
                component={Link}
                to="/app/dashboard"
                size="compact-sm"
                visibleFrom="sm"
              >
                {t('nav.dashboard')}
              </Button>
              <Text size="sm" c="dimmed" visibleFrom="md">
                {user?.email}
              </Text>
              <Button variant="light" onClick={() => logout()} size="compact-sm">
                {t('auth.logout')}
              </Button>
            </Group>
          ) : (
            <Group gap="xs" wrap="nowrap">
              <Button
                variant="subtle"
                component={Link}
                to="/login"
                size="compact-sm"
              >
                {t('auth.login')}
              </Button>
              <Button component={Link} to="/register" size="compact-sm">
                {t('auth.register')}
              </Button>
            </Group>
          )}
        </Group>
      </Group>
    </Container>
  );
}
