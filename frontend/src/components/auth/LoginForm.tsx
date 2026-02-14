import { TextInput, PasswordInput, Button, Stack, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigate } from 'react-router';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => {
        if (!value) return t('auth.emailRequired');
        if (!/^\S+@\S+$/.test(value)) return t('auth.emailInvalid');
        return null;
      },
      password: (value) => {
        if (!value) return t('auth.passwordRequired');
        return null;
      },
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    setSubmitError(null);
    clearError();
    try {
      await login(values);
      navigate('/dashboard');
    } catch {
      setSubmitError(t('auth.invalidCredentials'));
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {(submitError || error) && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {submitError || error}
          </Alert>
        )}

        <TextInput
          label={t('auth.email')}
          placeholder="email@exemplo.com"
          required
          {...form.getInputProps('email')}
        />

        <PasswordInput
          label={t('auth.password')}
          placeholder="********"
          required
          {...form.getInputProps('password')}
        />

        <Button type="submit" fullWidth loading={isLoading}>
          {t('auth.login')}
        </Button>
      </Stack>
    </form>
  );
}
