import { useEffect, useState, useCallback } from 'react';
import { Box, Text, Stack, Group, Badge, ThemeIcon, Loader, Center } from '@mantine/core';
import { IconCalendarEvent, IconClock, IconBook2 } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { PageHeader, ThemedPaper } from '../../components/common';
import { calendarApi, type CalendarEvent } from '../../api/calendar.api';
import { useNotification } from '../../hooks';

export function Calendar() {
  const { t } = useTranslation();
  const notification = useNotification();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await calendarApi.getMyEvents();
      if (response.success && response.data) {
        // Sort by date ascending
        const sorted = response.data.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setEvents(sorted);
      }
    } catch {
      notification.error({
        title: 'Erro',
        message: 'Não foi possível carregar os eventos.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [notification]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'live':
        return 'indigo';
      case 'deadline':
        return 'rose';
      case 'mentoring':
        return 'emerald';
      default:
        return 'slate';
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case 'live':
        return 'Ao Vivo';
      case 'deadline':
        return 'Prazo';
      case 'mentoring':
        return 'Mentoria';
      default:
        return 'Evento';
    }
  };

  if (isLoading) {
    return (
      <Box p="xl">
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Box>
    );
  }

  return (
    <Box p="xl">
      <Stack gap="xl">
        <PageHeader title={t('nav.calendar')} subtitle="Próximos eventos e prazos" />

        <Stack gap="md">
          {events.length === 0 ? (
            <ThemedPaper p="xl">
              <Stack align="center" gap="md" py="xl">
                <ThemeIcon size={64} radius="xl" variant="light" color="slate">
                  <IconCalendarEvent size={32} />
                </ThemeIcon>
                <Text c="dimmed" ta="center">
                  Nenhum evento agendado.
                </Text>
              </Stack>
            </ThemedPaper>
          ) : (
            events.map((event) => (
              <ThemedPaper key={event.id} p="lg" hoverable>
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="md" wrap="nowrap">
                    <ThemeIcon size="xl" radius="lg" variant="light" color={getEventColor(event.type)}>
                      <IconCalendarEvent size={20} />
                    </ThemeIcon>

                    <div>
                      <Text fw={600} style={{ fontFamily: '"Outfit", sans-serif' }}>
                        {event.title}
                      </Text>
                      {event.description && (
                        <Text size="sm" c="dimmed" lineClamp={1}>
                          {event.description}
                        </Text>
                      )}
                      <Group gap="lg" mt="xs">
                        <Group gap="xs">
                          <IconClock size={14} style={{ opacity: 0.6 }} />
                          <Text size="sm" c="dimmed">
                            {new Date(event.date).toLocaleDateString('pt-BR')}
                            {event.time && ` às ${event.time}`}
                          </Text>
                        </Group>
                        {event.courseName && (
                          <Group gap="xs">
                            <IconBook2 size={14} style={{ opacity: 0.6 }} />
                            <Text size="sm" c="dimmed">
                              {event.courseName}
                            </Text>
                          </Group>
                        )}
                      </Group>
                    </div>
                  </Group>

                  <Badge variant="light" color={getEventColor(event.type)}>
                    {getEventLabel(event.type)}
                  </Badge>
                </Group>
              </ThemedPaper>
            ))
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
