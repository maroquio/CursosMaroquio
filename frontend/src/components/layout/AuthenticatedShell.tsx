import { AppShell as MantineAppShell, Box, Burger, Divider, Group, Text, ThemeIcon } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconSchool } from '@tabler/icons-react';
import { Outlet, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './Sidebar';
import { HeaderBreadcrumbs } from './HeaderBreadcrumbs';
import { useThemedStyles } from '../../hooks';
import { LAYOUT, BREAKPOINTS } from '../../constants';

export function AuthenticatedShell() {
  const { t } = useTranslation();
  // Mobile drawer state
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure();
  // Desktop collapsed state
  const [desktopCollapsed, { toggle: toggleDesktop }] = useDisclosure(false);

  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const { isDark, mainBgStyle, headerStyle } = useThemedStyles();

  const sidebarWidth = desktopCollapsed ? LAYOUT.NAVBAR_COLLAPSED_WIDTH : LAYOUT.NAVBAR_WIDTH;

  return (
    <MantineAppShell
      header={{ height: LAYOUT.HEADER_HEIGHT }}
      navbar={{
        width: { base: sidebarWidth },
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: false },
      }}
      padding={0}
      transitionDuration={200}
      transitionTimingFunction="ease"
      styles={(theme) => ({
        main: mainBgStyle(theme),
      })}
    >
      <MantineAppShell.Header
        style={(theme) => ({
          ...headerStyle(theme),
          borderBottom: `1px solid ${isDark ? theme.colors.slate[7] : theme.colors.slate[2]}`,
        })}
      >
        <Group h="100%" gap={0} style={{ flex: 1 }}>
          {/* Toggle button section - aligned with sidebar */}
          <Box
            visibleFrom="sm"
            style={{
              width: sidebarWidth,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: desktopCollapsed ? 'center' : 'space-between',
              padding: `0 var(--mantine-spacing-md)`,
              borderRight: `1px solid ${isDark ? 'var(--mantine-color-slate-7)' : 'var(--mantine-color-slate-2)'}`,
              transition: 'width 200ms ease',
              overflow: 'hidden',
            }}
          >
            {!desktopCollapsed && (
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit', overflow: 'hidden' }}>
                <Group gap="sm" wrap="nowrap">
                  <ThemeIcon
                    size="lg"
                    radius="md"
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
                    style={{ flexShrink: 0 }}
                  >
                    <IconSchool size={20} />
                  </ThemeIcon>
                  <Text
                    fw={700}
                    size="lg"
                    style={{
                      fontFamily: '"Outfit", sans-serif',
                      whiteSpace: 'nowrap',
                      opacity: desktopCollapsed ? 0 : 1,
                      transition: 'opacity 150ms ease',
                    }}
                  >
                    Maroquio.com
                  </Text>
                </Group>
              </Link>
            )}
            <Burger
              opened={!desktopCollapsed}
              onClick={toggleDesktop}
              size="sm"
              aria-label="Toggle sidebar"
              style={{ flexShrink: 0 }}
            />
          </Box>

          {/* Mobile header */}
          <Group h="100%" px="md" gap="sm" hiddenFrom="sm">
            <Burger
              opened={mobileOpened}
              onClick={toggleMobile}
              size="sm"
              aria-label="Toggle navigation"
            />
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Group gap="xs">
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
              </Group>
            </Link>
          </Group>

          {/* Right side - Logo (when collapsed) + App Title + Breadcrumbs */}
          <Group visibleFrom="sm" gap="md" px="md" style={{ flex: 1 }} justify="space-between">
            <Group gap="md">
              {desktopCollapsed && (
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Group gap="sm">
                    <ThemeIcon
                      size="lg"
                      radius="md"
                      variant="gradient"
                      gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
                    >
                      <IconSchool size={20} />
                    </ThemeIcon>
                    <Text fw={700} size="lg" style={{ fontFamily: '"Outfit", sans-serif' }}>
                      Maroquio.com
                    </Text>
                  </Group>
                </Link>
              )}
              {desktopCollapsed && <Divider orientation="vertical" />}
              <Text fw={600} size="lg" c="dimmed" style={{ fontFamily: '"Outfit", sans-serif' }}>
                {t('app.title')}
              </Text>
            </Group>
            <HeaderBreadcrumbs />
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar
        style={(theme) => ({
          ...headerStyle(theme),
          borderRight: `1px solid ${isDark ? theme.colors.slate[7] : theme.colors.slate[2]}`,
        })}
      >
        <Sidebar
          collapsed={!isMobile && desktopCollapsed}
          onNavigate={isMobile ? closeMobile : undefined}
        />
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}
