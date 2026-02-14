import { Divider, Stack, Text, Tooltip, UnstyledButton, rem } from '@mantine/core';
import {
  IconLayoutDashboard,
  IconBook2,
  IconChartBar,
  IconCertificate,
  IconCalendar,
  IconUser,
  IconSettings,
  IconCategory,
  IconRobot,
  IconCpu,
} from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../stores/auth.store';
import classes from './SidebarNav.module.css';

interface NavItem {
  icon: typeof IconLayoutDashboard;
  labelKey: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: IconLayoutDashboard, labelKey: 'nav.dashboard', path: '/app/dashboard' },
  { icon: IconBook2, labelKey: 'nav.courses', path: '/app/courses' },
  { icon: IconChartBar, labelKey: 'nav.progress', path: '/app/progress' },
  { icon: IconCertificate, labelKey: 'nav.certificates', path: '/app/certificates' },
  { icon: IconCalendar, labelKey: 'nav.calendar', path: '/app/calendar' },
  { icon: IconUser, labelKey: 'nav.profile', path: '/app/profile' },
];

const adminNavItems: NavItem[] = [
  { icon: IconSettings, labelKey: 'nav.adminDashboard', path: '/admin' },
  { icon: IconBook2, labelKey: 'nav.adminCourses', path: '/admin/courses' },
  { icon: IconCategory, labelKey: 'nav.adminCategories', path: '/admin/categories' },
  { icon: IconRobot, labelKey: 'nav.adminLlmManufacturers', path: '/admin/llm-manufacturers' },
  { icon: IconCpu, labelKey: 'nav.adminLlmModels', path: '/admin/llm-models' },
];

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

interface NavItemButtonProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  label: string;
  onClick: () => void;
}

function NavItemButton({ item, isActive, collapsed, label, onClick }: NavItemButtonProps) {
  const button = (
    <UnstyledButton
      onClick={onClick}
      className={classes.navItem}
      data-active={isActive || undefined}
    >
      <span className={classes.navItemIcon}>
        <item.icon style={{ width: rem(20), height: rem(20) }} stroke={1.5} />
      </span>
      {!collapsed && <span className={classes.navItemLabel}>{label}</span>}
    </UnstyledButton>
  );

  if (collapsed) {
    return (
      <Tooltip
        label={label}
        position="right"
        withArrow
        transitionProps={{ duration: 0 }}
      >
        {button}
      </Tooltip>
    );
  }

  return button;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.includes('admin');

  const handleNavClick = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <Stack gap={4} py="md" px="md">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavItemButton
            key={item.path}
            item={item}
            isActive={isActive}
            collapsed={collapsed}
            label={t(item.labelKey)}
            onClick={() => handleNavClick(item.path)}
          />
        );
      })}
      {isAdmin && (
        <>
          <Divider my="xs" />
          <Text
            size="xs"
            c="dimmed"
            fw={500}
            tt="uppercase"
            px="sm"
            mb={4}
            ta={collapsed ? 'center' : undefined}
          >
            {collapsed ? 'ADM' : t('nav.adminSection')}
          </Text>
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavItemButton
                key={item.path}
                item={item}
                isActive={isActive}
                collapsed={collapsed}
                label={t(item.labelKey)}
                onClick={() => handleNavClick(item.path)}
              />
            );
          })}
        </>
      )}
    </Stack>
  );
}
