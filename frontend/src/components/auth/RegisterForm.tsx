import { TextInput, PasswordInput, Button, Stack, Alert, Progress, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigate } from 'react-router';
import { notifications } from '@mantine/notifications';
import { formatPhone } from '../../utils/formatters';

interface RegisterFormValues {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function PasswordRequirement({
  meets,
  label,
}: {
  meets: boolean;
  label: string;
}) {
  return (
    <Text
      c={meets ? 'teal' : 'red'}
      style={{ display: 'flex', alignItems: 'center' }}
      mt={7}
      size="sm"
    >
      {meets ? <IconCheck size={14} /> : <IconX size={14} />}{' '}
      <span style={{ marginLeft: 10 }}>{label}</span>
    </Text>
  );
}

function getPasswordStrength(password: string) {
  let multiplier = password.length > 7 ? 0 : 1;

  if (/[a-z]/.test(password)) multiplier += 0;
  else multiplier += 1;

  if (/[A-Z]/.test(password)) multiplier += 0;
  else multiplier += 1;

  if (/[0-9]/.test(password)) multiplier += 0;
  else multiplier += 1;

  return Math.max(100 - multiplier * 25, 0);
}

export function RegisterForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    initialValues: {
      fullName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      fullName: (value) => {
        if (!value) return t('auth.fullNameRequired');
        if (value.length < 3) return t('auth.fullNameMinLength');
        return null;
      },
      phone: (value) => {
        if (!value) return t('auth.phoneRequired');
        const phoneDigits = value.replace(/\D/g, '');
        if (phoneDigits.length < 10) return t('auth.phoneMinLength');
        return null;
      },
      email: (value) => {
        if (!value) return t('auth.emailRequired');
        if (!/^\S+@\S+$/.test(value)) return t('auth.emailInvalid');
        return null;
      },
      password: (value) => {
        if (!value) return t('auth.passwordRequired');
        if (value.length < 8) return t('auth.passwordMinLength');
        if (!/[A-Z]/.test(value)) return t('auth.passwordUppercase');
        if (!/[a-z]/.test(value)) return t('auth.passwordLowercase');
        if (!/[0-9]/.test(value)) return t('auth.passwordNumber');
        return null;
      },
      confirmPassword: (value, values) => {
        if (value !== values.password) return t('auth.passwordsDoNotMatch');
        return null;
      },
    },
  });

  const handleSubmit = async (values: RegisterFormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      // Remove formatação do telefone antes de enviar
      const phoneDigits = values.phone.replace(/\D/g, '');
      await register({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: phoneDigits,
      });
      notifications.show({
        title: t('common.success'),
        message: t('auth.registerSuccess'),
        color: 'green',
      });
      navigate('/login');
    } catch (err) {
      if (err instanceof AxiosError) {
        if (err.response?.status === 409) {
          form.setFieldError('email', t('auth.emailAlreadyExists'));
          return;
        }
        setSubmitError(err.response?.data?.error || t('errors.generic'));
      } else {
        setSubmitError(err instanceof Error ? err.message : t('errors.generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const password = form.values.password;
  const strength = getPasswordStrength(password);
  const color = strength === 100 ? 'teal' : strength > 50 ? 'yellow' : 'red';

  const requirements = [
    { re: /.{8,}/, label: t('auth.passwordMinLength') },
    { re: /[A-Z]/, label: t('auth.passwordUppercase') },
    { re: /[a-z]/, label: t('auth.passwordLowercase') },
    { re: /[0-9]/, label: t('auth.passwordNumber') },
  ];

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {submitError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {submitError}
          </Alert>
        )}

        <TextInput
          label={t('auth.fullName')}
          placeholder={t('auth.fullNamePlaceholder')}
          required
          {...form.getInputProps('fullName')}
        />

        <TextInput
          label={t('auth.phone')}
          placeholder="(11) 99999-9999"
          required
          value={form.values.phone}
          onChange={(e) => form.setFieldValue('phone', formatPhone(e.target.value))}
          error={form.errors.phone}
        />

        <TextInput
          label={t('auth.email')}
          placeholder="email@exemplo.com"
          required
          {...form.getInputProps('email')}
        />

        <div>
          <PasswordInput
            label={t('auth.password')}
            placeholder="********"
            required
            {...form.getInputProps('password')}
          />
          {password.length > 0 && (
            <>
              <Progress color={color} value={strength} size={5} mt="xs" />
              {requirements.map((requirement, index) => (
                <PasswordRequirement
                  key={index}
                  label={requirement.label}
                  meets={requirement.re.test(password)}
                />
              ))}
            </>
          )}
        </div>

        <PasswordInput
          label={t('auth.confirmPassword')}
          placeholder="********"
          required
          {...form.getInputProps('confirmPassword')}
        />

        <Button type="submit" fullWidth loading={isSubmitting}>
          {t('auth.register')}
        </Button>
      </Stack>
    </form>
  );
}
