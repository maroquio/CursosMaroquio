import { Box, Container, Group, Stack, Text, ThemeIcon, Divider, Anchor } from '@mantine/core';
import { IconSchool, IconMail } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Gradient accent line */}
      <Box
        style={{
          height: 3,
          background: 'linear-gradient(135deg, var(--mantine-color-indigo-5) 0%, var(--mantine-color-violet-5) 100%)',
        }}
      />

      <Box
        component="footer"
        style={{ background: 'var(--mantine-color-slate-9)' }}
      >
        <Container size="xl" py="xl" px="md">
          <Group align="flex-start" gap="xl" pb="xl" wrap="wrap" justify="space-between">

            {/* Brand */}
            <Stack gap="sm" style={{ flex: '1 1 240px', maxWidth: 300 }}>
              <Group gap="xs">
                <ThemeIcon
                  size="md"
                  radius="md"
                  variant="gradient"
                  gradient={{ from: 'indigo', to: 'violet', deg: 135 }}
                >
                  <IconSchool size={16} />
                </ThemeIcon>
                <Text fw={700} size="md" c="white" style={{ fontFamily: '"Outfit", sans-serif' }}>
                  Maroquio.com
                </Text>
              </Group>
              <Text size="sm" c="slate.4" style={{ lineHeight: 1.7 }}>
                {t('footer.description')}
              </Text>
            </Stack>

            {/* Platform links */}
            <Stack gap="sm" style={{ flex: '1 1 140px' }}>
              <Text
                fw={600}
                size="xs"
                c="slate.3"
                tt="uppercase"
                style={{ fontFamily: '"Outfit", sans-serif', letterSpacing: '0.08em' }}
              >
                {t('footer.platform')}
              </Text>
              <Anchor component={Link} to="/" size="sm" c="slate.4" style={{ textDecoration: 'none' }}>
                {t('footer.home')}
              </Anchor>
              <Anchor component={Link} to="/courses" size="sm" c="slate.4" style={{ textDecoration: 'none' }}>
                {t('footer.courses')}
              </Anchor>
              <Anchor component={Link} to="/register" size="sm" c="slate.4" style={{ textDecoration: 'none' }}>
                {t('auth.register')}
              </Anchor>
              <Anchor component={Link} to="/login" size="sm" c="slate.4" style={{ textDecoration: 'none' }}>
                {t('auth.login')}
              </Anchor>
            </Stack>

            {/* Contact */}
            <Stack gap="sm" style={{ flex: '1 1 180px' }}>
              <Text
                fw={600}
                size="xs"
                c="slate.3"
                tt="uppercase"
                style={{ fontFamily: '"Outfit", sans-serif', letterSpacing: '0.08em' }}
              >
                {t('footer.contact')}
              </Text>
              <Group gap="xs" align="center">
                <IconMail size={14} color="var(--mantine-color-slate-4)" />
                <Text size="sm" c="slate.4">
                  {t('footer.contactEmail')}
                </Text>
              </Group>
              <Text size="sm" c="slate.5" style={{ lineHeight: 1.6 }}>
                {t('footer.contactDescription')}
              </Text>
            </Stack>
          </Group>

          <Divider color="slate.8" />

          <Group justify="space-between" mt="md" wrap="wrap" gap="xs">
            <Text size="xs" c="slate.5">
              © {currentYear} Maroquio.com. {t('footer.allRights')}
            </Text>
            <Group gap="lg">
              <Anchor component={Link} to="#" size="xs" c="slate.5" style={{ textDecoration: 'none' }}>
                {t('footer.privacy')}
              </Anchor>
              <Anchor component={Link} to="#" size="xs" c="slate.5" style={{ textDecoration: 'none' }}>
                {t('footer.terms')}
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>
    </>
  );
}
