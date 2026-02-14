import { memo } from 'react';
import {
  Accordion,
  Badge,
  Group,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconFileText,
  IconQuestionMark,
  IconClipboardCheck,
  IconLock,
  IconCheck,
  IconClock,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '../../hooks';
import { formatDuration } from '../../utils/formatters';
import { PROGRESS_STATUS_COLORS } from '../../constants/colors';
import type { Lesson, LessonProgress, Module } from '../../types/course.types';

export interface LessonListProps {
  lessons: Lesson[];
  modules?: Module[];
  courseSlug: string;
  progress?: LessonProgress[];
  isEnrolled?: boolean;
  onLessonClick?: (lesson: Lesson) => void;
}

const lessonTypeIcons = {
  video: IconPlayerPlay,
  text: IconFileText,
  quiz: IconQuestionMark,
  assignment: IconClipboardCheck,
};

export const LessonList = memo(function LessonList({
  lessons,
  modules,
  courseSlug,
  progress = [],
  isEnrolled = false,
  onLessonClick,
}: LessonListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useThemedStyles();

  const getLessonProgress = (lessonId: string) => {
    return progress.find((p) => p.lessonId === lessonId);
  };

  const handleLessonClick = (lesson: Lesson) => {
    if (!isEnrolled && !lesson.isFree) return;
    if (onLessonClick) {
      onLessonClick(lesson);
    } else {
      navigate(`/courses/${courseSlug}/lessons/${lesson.slug}`);
    }
  };

  const renderLesson = (lesson: Lesson) => {
    const lessonType = lesson.type || 'video';
    const Icon = lessonTypeIcons[lessonType] || IconFileText;
    const lessonProgress = getLessonProgress(lesson.id);
    const isAccessible = isEnrolled || lesson.isFree;
    const isCompleted = lessonProgress?.status === 'completed';

    return (
      <UnstyledButton
        key={lesson.id}
        onClick={() => handleLessonClick(lesson)}
        disabled={!isAccessible}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 8,
          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          opacity: isAccessible ? 1 : 0.6,
          cursor: isAccessible ? 'pointer' : 'not-allowed',
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
            <ThemeIcon
              size="md"
              radius="md"
              variant={isCompleted ? 'filled' : 'light'}
              color={isCompleted ? 'green' : 'violet'}
            >
              {isCompleted ? <IconCheck size={16} /> : <Icon size={16} />}
            </ThemeIcon>
            <Stack gap={2} style={{ flex: 1 }}>
              <Group gap="xs">
                <Text size="sm" fw={500} lineClamp={1}>
                  {lesson.title}
                </Text>
                {lesson.isFree && !isEnrolled && (
                  <Badge size="xs" variant="light" color="green">
                    {t('courses.free')}
                  </Badge>
                )}
              </Group>
              {lesson.description && (
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {lesson.description}
                </Text>
              )}
            </Stack>
          </Group>

          <Group gap="sm" wrap="nowrap">
            {lesson.duration && (
              <Group gap={4}>
                <IconClock size={14} color="gray" />
                <Text size="xs" c="dimmed">
                  {formatDuration(lesson.duration)}
                </Text>
              </Group>
            )}
            {!isAccessible && <IconLock size={16} color="gray" />}
            {lessonProgress && !isCompleted && (
              <Badge size="xs" color={PROGRESS_STATUS_COLORS[lessonProgress.status]}>
                {t(`courses.progress.${lessonProgress.status}`)}
              </Badge>
            )}
          </Group>
        </Group>
      </UnstyledButton>
    );
  };

  // If there are modules, render as accordion
  if (modules && modules.length > 0) {
    return (
      <Accordion variant="separated" radius="md">
        {modules.map((module) => {
          const moduleLessons = lessons.filter((l) => l.moduleId === module.id);
          const completedCount = moduleLessons.filter(
            (l) => getLessonProgress(l.id)?.status === 'completed'
          ).length;

          return (
            <Accordion.Item key={module.id} value={module.id}>
              <Accordion.Control>
                <Group justify="space-between" wrap="nowrap" pr="md">
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} lineClamp={1}>{module.title}</Text>
                    {module.description && (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {module.description}
                      </Text>
                    )}
                  </Stack>
                  <Badge variant="light" color="violet" style={{ flexShrink: 0 }}>
                    {completedCount}/{moduleLessons.length}
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">{moduleLessons.map(renderLesson)}</Stack>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    );
  }

  // If no modules, render flat list
  return <Stack gap="xs">{lessons.map(renderLesson)}</Stack>;
});

export default LessonList;
