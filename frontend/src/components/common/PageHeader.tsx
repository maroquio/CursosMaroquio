import { Group, Stack, Title, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { BREAKPOINTS } from '../../constants';
import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  greeting?: string;
}

export function PageHeader({ title, subtitle, action, greeting }: PageHeaderProps) {
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);
  const displayTitle = greeting ? `${title}, ${greeting}!` : title;

  if (isMobile) {
    return (
      <Stack align="center" gap="xs">
        <Title order={2} ta="center">
          {displayTitle}
        </Title>
        {subtitle && (
          <Text c="dimmed" size="sm" ta="center" component="div">
            {subtitle}
          </Text>
        )}
        {action}
      </Stack>
    );
  }

  return (
    <Group justify="space-between" align="flex-start">
      <div>
        <Title order={2} mb={subtitle ? 'sm' : 0}>
          {displayTitle}
        </Title>
        {subtitle && (
          <Text c="dimmed" size="sm" component="div">
            {subtitle}
          </Text>
        )}
      </div>
      {action}
    </Group>
  );
}
