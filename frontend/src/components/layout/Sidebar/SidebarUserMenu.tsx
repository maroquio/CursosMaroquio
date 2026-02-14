import {
  Avatar,
  Box,
  Menu,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
  rem,
} from '@mantine/core';
import {
  IconChevronRight,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
  IconLanguage,
  IconCheck,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../../stores/auth.store';
import { useMantineColorScheme } from '@mantine/core';
import classes from './SidebarUserMenu.module.css';

interface SidebarUserMenuProps {
  collapsed?: boolean;
}

const AVAILABLE_LANGUAGES = [
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
];

export function SidebarUserMenu({ collapsed = false }: SidebarUserMenuProps) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const userInitial = user?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';
  const userName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.photoUrl
    ? `${import.meta.env.VITE_API_URL || ''}${user.photoUrl}`
    : null;

  const menuButton = (
    <UnstyledButton className={classes.userButton} data-collapsed={collapsed || undefined}>
      <span className={classes.avatarContainer}>
        <Avatar size={36} radius="xl" color="primary" src={avatarUrl || undefined}>
          {!avatarUrl && userInitial}
        </Avatar>
      </span>
      {!collapsed && (
        <>
          <Box className={classes.userInfo}>
            <Text size="sm" fw={500} truncate>
              {userName}
            </Text>
            <Text c="dimmed" size="xs" truncate>
              {user?.email}
            </Text>
          </Box>
          <IconChevronRight
            className={classes.chevron}
            style={{ width: rem(14), height: rem(14) }}
          />
        </>
      )}
    </UnstyledButton>
  );

  return (
    <Stack px="md" py="sm">
      <Menu position="right-end" withArrow shadow="md" width={200}>
        <Menu.Target>
          {collapsed ? (
            <Tooltip label={userName} position="right" withArrow>
              {menuButton}
            </Tooltip>
          ) : (
            menuButton
          )}
        </Menu.Target>
        <Menu.Dropdown>
          {collapsed && <Menu.Label>{user?.email}</Menu.Label>}
          {collapsed && <Menu.Divider />}
          <Menu.Item
            leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
            onClick={() => navigate('/app/profile')}
          >
            {t('nav.profile')}
          </Menu.Item>
          <Menu.Item
            leftSection={
              colorScheme === 'dark' ? (
                <IconSun style={{ width: rem(14), height: rem(14) }} />
              ) : (
                <IconMoon style={{ width: rem(14), height: rem(14) }} />
              )
            }
            onClick={() => toggleColorScheme()}
          >
            {colorScheme === 'dark' ? t('theme.light') : t('theme.dark')}
          </Menu.Item>
          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item
                leftSection={<IconLanguage style={{ width: rem(14), height: rem(14) }} />}
                rightSection={<IconChevronRight style={{ width: rem(12), height: rem(12) }} />}
              >
                {t('common.language')}
              </Menu.Sub.Item>
            </Menu.Sub.Target>
            <Menu.Sub.Dropdown>
              {AVAILABLE_LANGUAGES.map((lang) => (
                <Menu.Item
                  key={lang.code}
                  leftSection={<span>{lang.flag}</span>}
                  onClick={() => changeLanguage(lang.code)}
                  rightSection={
                    i18n.language === lang.code ? (
                      <IconCheck style={{ width: rem(14), height: rem(14) }} />
                    ) : null
                  }
                >
                  {lang.label}
                </Menu.Item>
              ))}
            </Menu.Sub.Dropdown>
          </Menu.Sub>
          <Menu.Divider />
          <Menu.Item
            color="red"
            leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
            onClick={handleLogout}
          >
            {t('auth.logout')}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Stack>
  );
}
