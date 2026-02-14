import { Stack, Text, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';
import type { TablerIcon } from '@tabler/icons-react';
import { ThemedPaper } from './ThemedPaper';

export interface EmptyStateProps {
  icon: TablerIcon;
  message: string;
  action?: ReactNode;
  iconColor?: string;
}

export function EmptyState({ icon: Icon, message, action, iconColor = 'dimmed' }: EmptyStateProps) {
  return (
    <ThemedPaper p="xl">
      <Stack align="center" gap="md" py="lg">
        <ThemeIcon size={64} variant="light" color={iconColor} radius="xl">
          <Icon size={32} stroke={1.5} />
        </ThemeIcon>
        <Text c="dimmed" ta="center" size="lg">
          {message}
        </Text>
        {action}
      </Stack>
    </ThemedPaper>
  );
}
