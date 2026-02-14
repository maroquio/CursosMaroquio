import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { createElement } from 'react';

interface UseAsyncActionOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
}

interface UseAsyncActionReturn<T, Args extends unknown[]> {
  execute: (...args: Args) => Promise<T | undefined>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}

export function useAsyncAction<T, Args extends unknown[]>(
  action: (...args: Args) => Promise<T>,
  options: UseAsyncActionOptions<T> = {}
): UseAsyncActionReturn<T, Args> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage = 'Ocorreu um erro. Tente novamente.',
    showSuccessNotification = true,
    showErrorNotification = true,
  } = options;

  const execute = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await action(...args);

        if (showSuccessNotification && successMessage) {
          notifications.show({
            title: 'Sucesso',
            message: successMessage,
            color: 'green',
            icon: createElement(IconCheck, { size: 16 }),
          });
        }

        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        if (showErrorNotification) {
          notifications.show({
            title: 'Erro',
            message: error.message || errorMessage,
            color: 'red',
            icon: createElement(IconX, { size: 16 }),
          });
        }

        onError?.(error);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [action, onSuccess, onError, successMessage, errorMessage, showSuccessNotification, showErrorNotification]
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return { execute, isLoading, error, reset };
}
