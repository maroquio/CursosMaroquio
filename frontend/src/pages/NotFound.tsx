import { Container, Title, Text, Button, Stack, Center } from '@mantine/core';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

export function NotFound() {
  const { t } = useTranslation();

  return (
    <Container size="xl" py="xl">
      <Center h="60vh">
        <Stack align="center" gap="lg">
          <Title order={1} size="6rem" c="dimmed">
            404
          </Title>
          <Title order={2} ta="center">
            {t('errors.notFound')}
          </Title>
          <Text c="dimmed" ta="center" maw={400}>
            {t('errors.generic')}
          </Text>
          <Button component={Link} to="/" size="lg" mt="md">
            {t('nav.home')}
          </Button>
        </Stack>
      </Center>
    </Container>
  );
}
