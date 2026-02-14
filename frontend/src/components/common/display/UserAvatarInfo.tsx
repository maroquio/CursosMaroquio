import { memo } from 'react';
import { Avatar, Group, Text, type MantineSize, type MantineColor } from '@mantine/core';

export interface UserAvatarInfoProps {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  fallbackText?: string;
  size?: MantineSize;
  color?: MantineColor;
  showEmail?: boolean;
}

export const UserAvatarInfo = memo(function UserAvatarInfo({
  name,
  email,
  avatarUrl,
  fallbackText = '?',
  size = 'sm',
  color = 'violet',
  showEmail = true,
}: UserAvatarInfoProps) {
  const displayName = name || email || fallbackText;
  const initial = email?.charAt(0).toUpperCase() || displayName.charAt(0).toUpperCase();
  const shouldShowEmail = showEmail && name && email;

  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar src={avatarUrl} size={size} color={color} radius="xl">
        {initial}
      </Avatar>
      <div>
        <Text size="sm" fw={500}>
          {displayName}
        </Text>
        {shouldShowEmail && (
          <Text size="xs" c="dimmed">
            {email}
          </Text>
        )}
      </div>
    </Group>
  );
});

export default UserAvatarInfo;
