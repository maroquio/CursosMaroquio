import { Box, Divider, ScrollArea } from '@mantine/core';
import { SidebarNav } from './SidebarNav';
import { SidebarUserMenu } from './SidebarUserMenu';
import { useThemedStyles } from '../../../hooks';

interface SidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const { isDark, theme } = useThemedStyles();

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Navigation */}
      <ScrollArea style={{ flex: 1 }} scrollbarSize={6}>
        <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />
      </ScrollArea>

      <Divider color={isDark ? theme.colors.slate[7] : theme.colors.slate[2]} />

      {/* User Menu */}
      <SidebarUserMenu collapsed={collapsed} />
    </Box>
  );
}
