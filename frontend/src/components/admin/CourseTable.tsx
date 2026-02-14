import { memo, useMemo, useCallback } from 'react';
import { Avatar, Badge, Group, Text } from '@mantine/core';
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconBook,
  IconUsers,
  IconWorldUpload,
  IconWorldOff,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { DataTable, ActionMenu, type Column, type ActionMenuItem } from '../common';
import { formatDate, formatPrice } from '../../utils/formatters';
import { COURSE_PUBLICATION_COLORS } from '../../constants/colors';
import type { Course } from '../../types/course.types';

export interface CourseTableProps {
  courses: Course[];
  isLoading?: boolean;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  onPublish?: (course: Course) => void;
  onUnpublish?: (course: Course) => void;
}

export const CourseTable = memo(function CourseTable({
  courses,
  isLoading = false,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
}: CourseTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getActionItems = useCallback(
    (course: Course): ActionMenuItem[] => {
      const items: ActionMenuItem[] = [
        {
          key: 'view',
          label: t('admin.courses.view'),
          icon: <IconEye size={14} />,
          onClick: () => navigate(`/courses/${course.slug}`),
        },
        {
          key: 'edit',
          label: t('admin.courses.edit'),
          icon: <IconEdit size={14} />,
          onClick: () => onEdit?.(course),
        },
        {
          key: 'lessons',
          label: t('admin.courses.manageLessons'),
          icon: <IconBook size={14} />,
          onClick: () => navigate(`/admin/courses/${course.id}/lessons`),
        },
        {
          key: 'enrollments',
          label: t('admin.courses.manageEnrollments'),
          icon: <IconUsers size={14} />,
          onClick: () => navigate(`/admin/courses/${course.id}/enrollments`),
        },
      ];

      if (course.status === 'draft') {
        items.push({
          key: 'publish',
          label: t('admin.courses.publish'),
          icon: <IconWorldUpload size={14} />,
          color: 'green',
          onClick: () => onPublish?.(course),
        });
      } else if (course.status === 'published') {
        items.push({
          key: 'unpublish',
          label: t('admin.courses.unpublish'),
          icon: <IconWorldOff size={14} />,
          color: 'orange',
          onClick: () => onUnpublish?.(course),
        });
      }

      items.push({
        key: 'delete',
        label: t('admin.courses.delete'),
        icon: <IconTrash size={14} />,
        color: 'red',
        onClick: () => onDelete?.(course),
      });

      return items;
    },
    [t, navigate, onEdit, onDelete, onPublish, onUnpublish]
  );

  const columns: Column<Course>[] = useMemo(
    () => [
      {
        key: 'title',
        header: t('admin.courses.courseName'),
        render: (course) => (
          <Group gap="sm" wrap="nowrap">
            <Avatar src={course.thumbnailUrl} radius="md" size="md" color="violet">
              {course.title.charAt(0)}
            </Avatar>
            <div>
              <Text size="sm" fw={500} lineClamp={1}>
                {course.title}
              </Text>
              {course.category && (
                <Text size="xs" c="dimmed">
                  {course.category}
                </Text>
              )}
            </div>
          </Group>
        ),
      },
      {
        key: 'status',
        header: t('admin.courses.status'),
        align: 'center',
        render: (course) => (
          <Badge
            variant="light"
            color={COURSE_PUBLICATION_COLORS[course.status as keyof typeof COURSE_PUBLICATION_COLORS]}
          >
            {t(`courses.status.${course.status}`)}
          </Badge>
        ),
      },
      {
        key: 'price',
        header: t('admin.courses.price'),
        align: 'center',
        render: (course) => (
          <Text size="sm">{formatPrice(course.price, course.currency, t('courses.free'))}</Text>
        ),
      },
      {
        key: 'lessons',
        header: t('admin.courses.lessons'),
        align: 'center',
        render: (course) => (
          <Group gap={4} justify="center">
            <IconBook size={14} />
            <Text size="sm">{course.totalLessons}</Text>
          </Group>
        ),
      },
      {
        key: 'enrollments',
        header: t('admin.courses.enrollments'),
        align: 'center',
        render: (course) => (
          <Group gap={4} justify="center">
            <IconUsers size={14} />
            <Text size="sm">{course.totalEnrollments}</Text>
          </Group>
        ),
      },
      {
        key: 'createdAt',
        header: t('admin.courses.createdAt'),
        align: 'center',
        render: (course) => (
          <Text size="sm" c="dimmed">
            {formatDate(course.createdAt)}
          </Text>
        ),
      },
      {
        key: 'actions',
        header: t('admin.courses.actions'),
        align: 'center',
        render: (course) => (
          <ActionMenu items={getActionItems(course)} dividerAfter={['enrollments']} />
        ),
      },
    ],
    [t, getActionItems]
  );

  return (
    <DataTable
      data={courses}
      columns={columns}
      isLoading={isLoading}
      emptyMessage={t('admin.courses.noCourses')}
      getRowKey={(course) => course.id}
    />
  );
});

export default CourseTable;
