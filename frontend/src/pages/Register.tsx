import { Container, Title, Text, Anchor, Stack, ThemeIcon } from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { RegisterForm } from '../components/auth/RegisterForm';
import { OAuthButtons } from '../components/auth/OAuthButtons';
import { ThemedPaper } from '../components/common';

export function Register() {
  const { t } = useTranslation();

  return (
    <Container size={420} py="xl">
      <Stack align="center" gap="xs" mb="lg">
        <ThemeIcon
          size={60}
          radius="xl"
          variant="gradient"
          gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
        >
          <IconSchool size={30} />
        </ThemeIcon>
        <Title ta="center" style={{ fontFamily: '"Outfit", sans-serif' }}>
          {t('auth.register')}
        </Title>
        <Text c="dimmed" size="sm" ta="center">
          {t('auth.hasAccount')}{' '}
          <Anchor component={Link} to="/login" size="sm" c="indigo">
            {t('auth.login')}
          </Anchor>
        </Text>
      </Stack>

      <ThemedPaper p={30}>
        <Stack>
          <RegisterForm />
          <OAuthButtons />
        </Stack>
      </ThemedPaper>
    </Container>
  );
}
