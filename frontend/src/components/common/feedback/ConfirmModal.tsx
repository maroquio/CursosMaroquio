import { memo } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  isLoading?: boolean;
}

export const ConfirmModal = memo(function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmColor = 'red',
  isLoading = false,
}: ConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Stack gap="md">
        <Text>{message}</Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose} disabled={isLoading}>
            {cancelLabel || t('common.cancel')}
          </Button>
          <Button color={confirmColor} onClick={onConfirm} loading={isLoading}>
            {confirmLabel || t('common.confirm')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
});

export default ConfirmModal;
