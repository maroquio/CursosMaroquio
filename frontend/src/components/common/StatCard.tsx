import { memo } from 'react';
import { Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { ThemedPaper } from './ThemedPaper';
import { BREAKPOINTS } from '../../constants';
import type { ComponentType } from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number }>;
  color: string;
  onClick?: () => void;
}

export const StatCard = memo(function StatCard({
  label,
  value,
  icon: Icon,
  color,
  onClick,
}: StatCardProps) {
  const isMobile = useMediaQuery(BREAKPOINTS.mobile);

  return (
    <ThemedPaper p="md" onClick={onClick} hoverable={!!onClick}>
      {isMobile ? (
        <Stack align="center" gap="xs">
          <ThemeIcon size={40} radius="lg" variant="light" color={color}>
            <Icon size={20} />
          </ThemeIcon>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {label}
          </Text>
          <Text size="1.5rem" fw={700} style={{ fontFamily: '"Outfit", sans-serif' }}>
            {value}
          </Text>
        </Stack>
      ) : (
        <Group gap="md" wrap="nowrap">
          <ThemeIcon size={48} radius="lg" variant="light" color={color}>
            <Icon size={24} />
          </ThemeIcon>
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              {label}
            </Text>
            <Text size="2rem" fw={700} mt={4} style={{ fontFamily: '"Outfit", sans-serif' }}>
              {value}
            </Text>
          </div>
        </Group>
      )}
    </ThemedPaper>
  );
});
