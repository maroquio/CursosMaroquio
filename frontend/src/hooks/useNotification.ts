import { useCallback, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import { createElement } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationOptions {
  title: string;
  message?: string;
  autoClose?: number;
}

const NOTIFICATION_CONFIG = {
  success: { color: 'emerald', icon: IconCheck },
  error: { color: 'rose', icon: IconX },
  info: { color: 'primary', icon: IconInfoCircle },
  warning: { color: 'amber', icon: IconAlertTriangle },
} as const;

export function useNotification() {
  const createHandler = useCallback(
    (type: NotificationType) =>
      (options: NotificationOptions): string => {
        const config = NOTIFICATION_CONFIG[type];
        const id = `notification-${Date.now()}`;

        notifications.show({
          id,
          title: options.title,
          message: options.message ?? '',
          color: config.color,
          icon: createElement(config.icon, { size: 18 }),
          autoClose: options.autoClose ?? 4000,
        });

        return id;
      },
    []
  );

  return useMemo(
    () => ({
      success: createHandler('success'),
      error: createHandler('error'),
      info: createHandler('info'),
      warning: createHandler('warning'),
      hide: notifications.hide,
      hideAll: () => {
        notifications.cleanQueue();
        notifications.clean();
      },
    }),
    [createHandler]
  );
}
