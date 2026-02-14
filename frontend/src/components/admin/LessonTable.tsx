import { memo, useMemo, useCallback } from 'react';
import { ActionIcon, Badge, Group, Text, ThemeIcon } from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconGripVertical,
  IconPlayerPlay,
  IconFileText,
  IconQuestionMark,
  IconClipboardCheck,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { DataTable, ActionMenu, type Column, type ActionMenuItem } from '../common';
import { formatDuration } from '../../utils/formatters';
import { LESSON_TYPE_COLORS } from '../../constants/colors';
import type { Lesson, LessonType } from '../../types/course.types';

export interface LessonTableProps {
  lessons: Lesson[];
  isLoading?: boolean;
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lesson: Lesson) => void;
  onPublish?: (lesson: Lesson) => void;
  onUnpublish?: (lesson: Lesson) => void;
  onReorder?: (lessons: Lesson[]) => void;
}

const lessonTypeIcons: Record<LessonType, typeof IconPlayerPlay> = {
  video: IconPlayerPlay,
  text: IconFileText,
  quiz: IconQuestionMark,
  assignment: IconClipboardCheck,
};

export const LessonTable = memo(function LessonTable({
  lessons,
  isLoading = false,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
}: LessonTableProps) {
  const { t } = useTranslation();

  const getActionItems = useCallback(
    (lesson: Lesson): ActionMenuItem[] => {
      const items: ActionMenuItem[] = [
        {
          key: 'edit',
          label: t('admin.lessons.edit'),
          icon: <IconEdit size={14} />,
          onClick: () => onEdit?.(lesson),
        },
      ];

      if (lesson.isPublished) {
        items.push({
          key: 'unpublish',
          label: t('admin.lessons.unpublish'),
          icon: <IconEyeOff size={14} />,
          color: 'orange',
          onClick: () => onUnpublish?.(lesson),
        });
      } else {
        items.push({
          key: 'publish',
          label: t('admin.lessons.publish'),
          icon: <IconEye size={14} />,
          color: 'green',
          onClick: () => onPublish?.(lesson),
        });
      }

      items.push({
        key: 'delete',
        label: t('admin.lessons.delete'),
        icon: <IconTrash size={14} />,
        color: 'red',
        onClick: () => onDelete?.(lesson),
      });

      return items;
    },
    [t, onEdit, onDelete, onPublish, onUnpublish]
  );

  const columns: Column<Lesson>[] = useMemo(
    () => [
      {
        key: 'order',
        header: '',
        width: 40,
        render: (_lesson, index) => (
          <Group gap="xs">
            <ActionIcon variant="subtle" color="gray" style={{ cursor: 'grab' }}>
              <IconGripVertical size={14} />
            </ActionIcon>
            <Text size="sm" c="dimmed">
              {index + 1}
            </Text>
          </Group>
        ),
      },
      {
        key: 'title',
        header: t('admin.lessons.title'),
        render: (lesson) => {
          const lessonType = lesson.type || 'video';
          const Icon = lessonTypeIcons[lessonType];
          return (
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size="sm" variant="light" color={LESSON_TYPE_COLORS[lessonType]}>
                <Icon size={14} />
              </ThemeIcon>
              <div>
                <Text size="sm" fw={500} lineClamp={1}>
                  {lesson.title}
                </Text>
                {lesson.description && (
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {lesson.description}
                  </Text>
                )}
              </div>
            </Group>
          );
        },
      },
      {
        key: 'type',
        header: t('admin.lessons.type'),
        align: 'center',
        render: (lesson) => {
          const lessonType = lesson.type || 'video';
          return (
            <Badge variant="light" color={LESSON_TYPE_COLORS[lessonType]} size="sm">
              {t(`admin.lessons.types.${lessonType}`)}
            </Badge>
          );
        },
      },
      {
        key: 'duration',
        header: t('admin.lessons.duration'),
        align: 'center',
        render: (lesson) => (
          <Text size="sm">{formatDuration(lesson.duration) || '-'}</Text>
        ),
      },
      {
        key: 'status',
        header: t('admin.lessons.status'),
        align: 'center',
        render: (lesson) => (
          <Group gap="xs" justify="center">
            {lesson.isPublished ? (
              <Badge variant="light" color="green" size="sm">
                {t('admin.lessons.published')}
              </Badge>
            ) : (
              <Badge variant="light" color="gray" size="sm">
                {t('admin.lessons.draft')}
              </Badge>
            )}
            {lesson.isFree && (
              <Badge variant="dot" color="blue" size="sm">
                {t('courses.free')}
              </Badge>
            )}
          </Group>
        ),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        align: 'center',
        render: (lesson) => (
          <ActionMenu items={getActionItems(lesson)} dividerAfter={['edit']} />
        ),
      },
    ],
    [t, getActionItems]
  );

  return (
    <DataTable
      data={lessons}
      columns={columns}
      isLoading={isLoading}
      emptyMessage={t('admin.lessons.noLessons')}
      getRowKey={(lesson) => lesson.id}
    />
  );
});

export default LessonTable;
