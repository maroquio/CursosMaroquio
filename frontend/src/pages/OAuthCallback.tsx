import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Center, Loader, Stack, Text, Alert, Button } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth.api';
import { oauthStorage, tokenStorage, storage, STORAGE_KEYS } from '../utils/storage';
import { useAuthStore } from '../stores/auth.store';
import type { OAuthProviderType } from '../types/auth.types';

export function OAuthCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(errorParam);
        return;
      }

      if (!code || !provider) {
        setError(t('errors.generic'));
        return;
      }

      const storedState = oauthStorage.getState();
      const codeVerifier = oauthStorage.getCodeVerifier();

      if (state !== storedState) {
        setError(t('errors.generic'));
        return;
      }

      if (!codeVerifier) {
        setError(t('errors.generic'));
        return;
      }

      try {
        const response = await authApi.oauthCallback(provider as OAuthProviderType, {
          code,
          codeVerifier,
        });

        if (response.success && response.data) {
          const { accessToken, user } = response.data;
          // Only store access token; refresh token is now in HttpOnly cookie
          tokenStorage.setAccessToken(accessToken);
          storage.set(STORAGE_KEYS.USER, user);
          setUser(user);
          oauthStorage.clear();
          navigate('/dashboard');
        } else {
          setError(response.error || t('errors.generic'));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('errors.generic');
        setError(message);
      }
    };

    handleCallback();
  }, [provider, searchParams, navigate, t, setUser]);

  if (error) {
    return (
      <Center h="60vh">
        <Stack align="center" gap="lg" maw={400}>
          <Alert icon={<IconAlertCircle size={16} />} color="red" title={t('common.error')}>
            {error}
          </Alert>
          <Button onClick={() => navigate('/login')}>{t('common.back')}</Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Center h="60vh">
      <Stack align="center" gap="md">
        <Loader size="xl" />
        <Text c="dimmed">{t('common.loading')}</Text>
      </Stack>
    </Center>
  );
}
