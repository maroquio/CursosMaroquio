import { Button, Stack, Divider, Text, Alert } from '@mantine/core';
import { IconBrandGoogle, IconBrandFacebook, IconBrandApple, IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { authApi } from '../../api/auth.api';
import type { OAuthProviderType } from '../../types/auth.types';
import { oauthStorage } from '../../utils/storage';

const providerIcons: Record<OAuthProviderType, typeof IconBrandGoogle> = {
  google: IconBrandGoogle,
  facebook: IconBrandFacebook,
  apple: IconBrandApple,
};

const providerColors: Record<OAuthProviderType, string> = {
  google: '#DB4437',
  facebook: '#4267B2',
  apple: '#000000',
};

interface OAuthButtonsProps {
  onError?: (error: string) => void;
}

export function OAuthButtons({ onError }: OAuthButtonsProps) {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<
    Array<{ provider: OAuthProviderType; name: string; enabled: boolean }>
  >([]);
  const [loading, setLoading] = useState<OAuthProviderType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await authApi.getOAuthProviders();
        if (response.success && response.data) {
          setProviders(response.data.filter((p) => p.enabled));
        }
      } catch {
        // Silently fail - OAuth providers are optional
      }
    };

    fetchProviders();
  }, []);

  const handleOAuthLogin = async (provider: OAuthProviderType) => {
    setLoading(provider);
    setError(null);

    try {
      const response = await authApi.getOAuthAuthorizationUrl(provider);
      if (response.success && response.data) {
        const { authorizationUrl, state, codeVerifier } = response.data;
        oauthStorage.setState(state);
        oauthStorage.setCodeVerifier(codeVerifier);
        window.location.href = authorizationUrl;
      } else {
        const errorMsg = response.error || t('errors.generic');
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('errors.generic');
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(null);
    }
  };

  if (providers.length === 0) {
    return null;
  }

  return (
    <Stack>
      <Divider
        label={
          <Text size="sm" c="dimmed">
            {t('auth.orContinueWith')}
          </Text>
        }
        labelPosition="center"
      />

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {error}
        </Alert>
      )}

      {providers.map(({ provider, name }) => {
        const Icon = providerIcons[provider];
        const color = providerColors[provider];

        return (
          <Button
            key={provider}
            variant="outline"
            leftSection={<Icon size={20} />}
            onClick={() => handleOAuthLogin(provider)}
            loading={loading === provider}
            disabled={loading !== null && loading !== provider}
            styles={{
              root: {
                borderColor: color,
                color: color,
                '&:hover': {
                  backgroundColor: `${color}10`,
                },
              },
            }}
          >
            {t('auth.loginWith', { provider: name })}
          </Button>
        );
      })}
    </Stack>
  );
}
