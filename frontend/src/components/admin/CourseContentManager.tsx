import { useState } from 'react';
import {
  Stack,
  Group,
  Button,
  Text,
  ActionIcon,
  Badge,
  Modal,
  Menu,
  Box,
  Paper,
  ThemeIcon,
  Collapse,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconGripVertical,
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconFolderOpen,
  IconPlayerPlay,
  IconFileText,
  IconDotsVertical,
  IconSection,
  IconPackage,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ConfirmModal } from '../common';
import { ModuleForm } from './ModuleForm';
import { LessonForm } from './LessonForm';
import { SectionForm } from './SectionForm';
import { SectionBundleManager } from './SectionBundleManager';
import { adminApi } from '../../api/admin.api';
import { useNotification } from '../../hooks';
import { formatDuration } from '../../utils/formatters';
import type {
  Module,
  Lesson,
  Section,
  CreateModuleRequest,
  UpdateModuleRequest,
  CreateLessonRequest,
  UpdateLessonRequest,
  CreateSectionRequest,
  UpdateSectionRequest,
} from '../../types/course.types';

interface CourseContentManagerProps {
  courseId: string;
  modules: Module[];
  onRefresh: () => void;
}

interface SortableModuleItemProps {
  module: Module;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lesson: Lesson) => void;
  onAddSection: (lesson: Lesson) => void;
  onEditSection: (lesson: Lesson, section: Section) => void;
  onDeleteSection: (lesson: Lesson, section: Section) => void;
  onManageBundle: (section: Section) => void;
}

function SortableModuleItem({
  module,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onAddSection,
  onEditSection,
  onDeleteSection,
  onManageBundle,
}: SortableModuleItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  const toggleLesson = (lessonId: string) => {
    setExpandedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      return newSet;
    });
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      withBorder
      p="md"
      mb="sm"
      bg={isDragging ? 'var(--mantine-color-blue-light)' : undefined}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
          <ActionIcon
            variant="subtle"
            color="gray"
            style={{ cursor: 'grab' }}
            {...attributes}
            {...listeners}
          >
            <IconGripVertical size={16} />
          </ActionIcon>

          <ActionIcon variant="subtle" onClick={onToggle}>
            {isExpanded ? (
              <IconFolderOpen size={18} color="var(--mantine-color-blue-6)" />
            ) : (
              <IconFolder size={18} color="var(--mantine-color-gray-6)" />
            )}
          </ActionIcon>

          <Box style={{ flex: 1, cursor: 'pointer' }} onClick={onToggle}>
            <Group gap="xs">
              <Text fw={600} size="sm">
                {module.title}
              </Text>
              <Badge size="xs" variant="light">
                {module.lessons.length} {t('admin.lessons.title').toLowerCase()}
              </Badge>
            </Group>
            {module.description && (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {module.description}
              </Text>
            )}
          </Box>
        </Group>

        <Group gap="xs">
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconPlus size={14} />} onClick={onAddLesson}>
                {t('admin.lessons.newLesson')}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={onEdit}>
                {t('admin.modules.edit')}
              </Menu.Item>
              <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={onDelete}>
                {t('admin.modules.delete')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <ActionIcon variant="subtle" onClick={onToggle}>
            {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </ActionIcon>
        </Group>
      </Group>

      <Collapse in={isExpanded}>
        <Stack gap="xs" mt="md" pl="xl">
          {module.lessons.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              {t('admin.lessons.noLessons')}
            </Text>
          ) : (
            module.lessons.map((lesson) => (
              <Paper key={lesson.id} withBorder p="sm" bg="var(--mantine-color-gray-light)">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                    <ActionIcon variant="subtle" color="gray" style={{ cursor: 'grab' }}>
                      <IconGripVertical size={14} />
                    </ActionIcon>

                    <ThemeIcon size="sm" variant="light" color="blue">
                      {lesson.type === 'video' ? (
                        <IconPlayerPlay size={12} />
                      ) : (
                        <IconFileText size={12} />
                      )}
                    </ThemeIcon>

                    <Box
                      style={{ flex: 1, cursor: 'pointer' }}
                      onClick={() => toggleLesson(lesson.id)}
                    >
                      <Group gap="xs">
                        <Text size="sm" fw={500}>
                          {lesson.title}
                        </Text>
                        {lesson.duration && lesson.duration > 0 && (
                          <Text size="xs" c="dimmed">
                            {formatDuration(lesson.duration)}
                          </Text>
                        )}
                        <Badge size="xs" variant="outline">
                          {lesson.sections?.length || 0} {t('admin.sections.title').toLowerCase()}
                        </Badge>
                      </Group>
                    </Box>
                  </Group>

                  <Group gap="xs">
                    <Menu position="bottom-end" withinPortal>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm">
                          <IconDotsVertical size={14} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconSection size={14} />}
                          onClick={() => onAddSection(lesson)}
                        >
                          {t('admin.sections.newSection')}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={() => onEditLesson(lesson)}
                        >
                          {t('admin.lessons.edit')}
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={() => onDeleteLesson(lesson)}
                        >
                          {t('admin.lessons.delete')}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>

                    <ActionIcon variant="subtle" size="sm" onClick={() => toggleLesson(lesson.id)}>
                      {expandedLessons.has(lesson.id) ? (
                        <IconChevronDown size={14} />
                      ) : (
                        <IconChevronRight size={14} />
                      )}
                    </ActionIcon>
                  </Group>
                </Group>

                <Collapse in={expandedLessons.has(lesson.id)}>
                  <Stack gap="xs" mt="sm" pl="lg">
                    {(!lesson.sections || lesson.sections.length === 0) ? (
                      <Text size="xs" c="dimmed" ta="center" py="sm">
                        {t('admin.sections.noSections')}
                      </Text>
                    ) : (
                      lesson.sections.map((section) => (
                        <Paper key={section.id} withBorder p="xs">
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap">
                              <ActionIcon variant="subtle" color="gray" size="xs" style={{ cursor: 'grab' }}>
                                <IconGripVertical size={12} />
                              </ActionIcon>
                              <ThemeIcon size="xs" variant="light" color="gray">
                                <IconSection size={10} />
                              </ThemeIcon>
                              <Text size="xs">{section.title}</Text>
                              <Badge size="xs" variant="dot">
                                {section.contentType}
                              </Badge>
                            </Group>
                            <Group gap={4}>
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                size="xs"
                                onClick={() => onManageBundle(section)}
                                title={t('admin.bundles.manageBundles')}
                              >
                                <IconPackage size={12} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                size="xs"
                                onClick={() => onEditSection(lesson, section)}
                              >
                                <IconEdit size={12} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                size="xs"
                                onClick={() => onDeleteSection(lesson, section)}
                              >
                                <IconTrash size={12} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        </Paper>
                      ))
                    )}
                    <Button
                      variant="subtle"
                      size="xs"
                      leftSection={<IconPlus size={12} />}
                      onClick={() => onAddSection(lesson)}
                    >
                      {t('admin.sections.newSection')}
                    </Button>
                  </Stack>
                </Collapse>
              </Paper>
            ))
          )}
          <Button
            variant="light"
            size="sm"
            leftSection={<IconPlus size={14} />}
            onClick={onAddLesson}
          >
            {t('admin.lessons.newLesson')}
          </Button>
        </Stack>
      </Collapse>
    </Paper>
  );
}

export function CourseContentManager({ courseId, modules, onRefresh }: CourseContentManagerProps) {
  const { t } = useTranslation();
  const notification = useNotification();

  // State for expanded modules
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Modal states
  const [moduleModalOpened, { open: openModuleModal, close: closeModuleModal }] = useDisclosure(false);
  const [lessonModalOpened, { open: openLessonModal, close: closeLessonModal }] = useDisclosure(false);
  const [sectionModalOpened, { open: openSectionModal, close: closeSectionModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [bundleModalOpened, { open: openBundleModal, close: closeBundleModal }] = useDisclosure(false);

  // Form states
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [targetModule, setTargetModule] = useState<Module | null>(null);
  const [targetLesson, setTargetLesson] = useState<Lesson | null>(null);
  const [bundleSection, setBundleSection] = useState<Section | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteType, setDeleteType] = useState<'module' | 'lesson' | 'section'>('module');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Toggle module expansion
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Module handlers
  const handleAddModule = () => {
    setSelectedModule(null);
    openModuleModal();
  };

  const handleEditModule = (module: Module) => {
    setSelectedModule(module);
    openModuleModal();
  };

  const handleDeleteModule = (module: Module) => {
    setSelectedModule(module);
    setDeleteType('module');
    openDeleteModal();
  };

  const handleSubmitModule = async (data: CreateModuleRequest | UpdateModuleRequest) => {
    setIsSubmitting(true);
    try {
      if (selectedModule) {
        const response = await adminApi.updateModule(courseId, selectedModule.id, data);
        if (response.success) {
          notification.success({
            title: t('admin.modules.updateSuccess'),
            message: t('admin.modules.updateSuccessMessage'),
          });
          closeModuleModal();
          onRefresh();
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await adminApi.createModule(courseId, data as CreateModuleRequest);
        if (response.success) {
          notification.success({
            title: t('admin.modules.createSuccess'),
            message: t('admin.modules.createSuccessMessage'),
          });
          closeModuleModal();
          onRefresh();
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error) {
      notification.error({
        title: selectedModule ? t('admin.modules.updateError') : t('admin.modules.createError'),
        message: error instanceof Error ? error.message : t('admin.modules.submitErrorMessage'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lesson handlers
  const handleAddLesson = (module: Module) => {
    setTargetModule(module);
    setSelectedLesson(null);
    openLessonModal();
  };

  const handleEditLesson = (lesson: Lesson) => {
    const module = modules.find((m) => m.lessons.some((l) => l.id === lesson.id));
    setTargetModule(module || null);
    setSelectedLesson(lesson);
    openLessonModal();
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    const module = modules.find((m) => m.lessons.some((l) => l.id === lesson.id));
    setTargetModule(module || null);
    setSelectedLesson(lesson);
    setDeleteType('lesson');
    openDeleteModal();
  };

  const handleSubmitLesson = async (data: CreateLessonRequest | UpdateLessonRequest) => {
    if (!targetModule) return;

    setIsSubmitting(true);
    try {
      if (selectedLesson) {
        const response = await adminApi.updateLesson(targetModule.id, selectedLesson.id, data);
        if (response.success) {
          notification.success({
            title: t('admin.lessons.updateSuccess'),
            message: t('admin.lessons.updateSuccessMessage'),
          });
          closeLessonModal();
          onRefresh();
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await adminApi.createLesson(targetModule.id, data as CreateLessonRequest);
        if (response.success) {
          notification.success({
            title: t('admin.lessons.createSuccess'),
            message: t('admin.lessons.createSuccessMessage'),
          });
          closeLessonModal();
          onRefresh();
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error) {
      notification.error({
        title: selectedLesson ? t('admin.lessons.updateError') : t('admin.lessons.createError'),
        message: error instanceof Error ? error.message : t('admin.lessons.submitErrorMessage'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section handlers
  const handleAddSection = (lesson: Lesson) => {
    setTargetLesson(lesson);
    setSelectedSection(null);
    openSectionModal();
  };

  const handleEditSection = (lesson: Lesson, section: Section) => {
    setTargetLesson(lesson);
    setSelectedSection(section);
    openSectionModal();
  };

  const handleDeleteSection = (lesson: Lesson, section: Section) => {
    setTargetLesson(lesson);
    setSelectedSection(section);
    setDeleteType('section');
    openDeleteModal();
  };

  const handleManageBundle = (section: Section) => {
    setBundleSection(section);
    openBundleModal();
  };

  const handleSubmitSection = async (data: CreateSectionRequest | UpdateSectionRequest) => {
    if (!targetLesson) return;

    setIsSubmitting(true);
    try {
      if (selectedSection) {
        const response = await adminApi.updateSection(targetLesson.id, selectedSection.id, data);
        if (response.success) {
          notification.success({
            title: t('admin.sections.updateSuccess'),
            message: t('admin.sections.updateSuccessMessage'),
          });
          closeSectionModal();
          onRefresh();
        } else {
          throw new Error(response.error);
        }
      } else {
        const response = await adminApi.createSection(targetLesson.id, data as CreateSectionRequest);
        if (response.success) {
          notification.success({
            title: t('admin.sections.createSuccess'),
            message: t('admin.sections.createSuccessMessage'),
          });
          closeSectionModal();
          onRefresh();
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error) {
      notification.error({
        title: selectedSection ? t('admin.sections.updateError') : t('admin.sections.createError'),
        message: error instanceof Error ? error.message : t('admin.sections.submitErrorMessage'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete confirm
  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      if (deleteType === 'module' && selectedModule) {
        const response = await adminApi.deleteModule(courseId, selectedModule.id);
        if (response.success) {
          notification.success({
            title: t('admin.modules.deleteSuccess'),
            message: t('admin.modules.deleteSuccessMessage'),
          });
        } else {
          throw new Error(response.error);
        }
      } else if (deleteType === 'lesson' && targetModule && selectedLesson) {
        const response = await adminApi.deleteLesson(targetModule.id, selectedLesson.id);
        if (response.success) {
          notification.success({
            title: t('admin.lessons.deleteSuccess'),
            message: t('admin.lessons.deleteSuccessMessage'),
          });
        } else {
          throw new Error(response.error);
        }
      } else if (deleteType === 'section' && targetLesson && selectedSection) {
        const response = await adminApi.deleteSection(targetLesson.id, selectedSection.id);
        if (response.success) {
          notification.success({
            title: t('admin.sections.deleteSuccess'),
            message: t('admin.sections.deleteSuccessMessage'),
          });
        } else {
          throw new Error(response.error);
        }
      }
      closeDeleteModal();
      onRefresh();
    } catch (error) {
      notification.error({
        title: t('common.deleteError'),
        message: error instanceof Error ? error.message : t('common.deleteErrorMessage'),
      });
    } finally {
      setIsSubmitting(false);
      setSelectedModule(null);
      setSelectedLesson(null);
      setSelectedSection(null);
    }
  };

  // Drag end handler for modules
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedModules = arrayMove(modules, oldIndex, newIndex);
        const reorderData = reorderedModules.map((m, index) => ({
          id: m.id,
          order: index + 1,
        }));

        try {
          const response = await adminApi.reorderModules(courseId, { modules: reorderData });
          if (response.success) {
            onRefresh();
          }
        } catch {
          notification.error({
            title: t('admin.modules.reorderError'),
            message: t('admin.modules.reorderErrorMessage'),
          });
        }
      }
    }
  };

  const getDeleteMessage = () => {
    if (deleteType === 'module' && selectedModule) {
      return t('admin.modules.deleteConfirmMessage', { title: selectedModule.title });
    } else if (deleteType === 'lesson' && selectedLesson) {
      return t('admin.lessons.deleteConfirmMessage', { title: selectedLesson.title });
    } else if (deleteType === 'section' && selectedSection) {
      return t('admin.sections.deleteConfirmMessage', { title: selectedSection.title });
    }
    return '';
  };

  const getDeleteTitle = () => {
    if (deleteType === 'module') return t('admin.modules.deleteConfirmTitle');
    if (deleteType === 'lesson') return t('admin.lessons.deleteConfirmTitle');
    return t('admin.sections.deleteConfirmTitle');
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={600} size="lg">
          {t('admin.courses.content')}
        </Text>
        <Button leftSection={<IconPlus size={16} />} onClick={handleAddModule}>
          {t('admin.modules.newModule')}
        </Button>
      </Group>

      {modules.length === 0 ? (
        <Paper withBorder p="xl" ta="center">
          <Text c="dimmed" mb="md">
            {t('admin.modules.noModules')}
          </Text>
          <Button variant="light" leftSection={<IconPlus size={16} />} onClick={handleAddModule}>
            {t('admin.modules.newModule')}
          </Button>
        </Paper>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={modules.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            {modules.map((module) => (
              <SortableModuleItem
                key={module.id}
                module={module}
                isExpanded={expandedModules.has(module.id)}
                onToggle={() => toggleModule(module.id)}
                onEdit={() => handleEditModule(module)}
                onDelete={() => handleDeleteModule(module)}
                onAddLesson={() => handleAddLesson(module)}
                onEditLesson={handleEditLesson}
                onDeleteLesson={handleDeleteLesson}
                onAddSection={handleAddSection}
                onEditSection={handleEditSection}
                onDeleteSection={handleDeleteSection}
                onManageBundle={handleManageBundle}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Module Modal */}
      <Modal
        opened={moduleModalOpened}
        onClose={closeModuleModal}
        title={selectedModule ? t('admin.modules.editModule') : t('admin.modules.newModule')}
        size="lg"
        centered
      >
        <ModuleForm
          module={selectedModule || undefined}
          isLoading={isSubmitting}
          onSubmit={handleSubmitModule}
          onCancel={closeModuleModal}
        />
      </Modal>

      {/* Lesson Modal */}
      <Modal
        opened={lessonModalOpened}
        onClose={closeLessonModal}
        title={selectedLesson ? t('admin.lessons.editLesson') : t('admin.lessons.newLesson')}
        size="lg"
        centered
      >
        <LessonForm
          lesson={selectedLesson || undefined}
          isLoading={isSubmitting}
          onSubmit={handleSubmitLesson}
          onCancel={closeLessonModal}
        />
      </Modal>

      {/* Section Modal */}
      <Modal
        opened={sectionModalOpened}
        onClose={closeSectionModal}
        title={selectedSection ? t('admin.sections.editSection') : t('admin.sections.newSection')}
        size="md"
        centered
      >
        <SectionForm
          section={selectedSection || undefined}
          isLoading={isSubmitting}
          onSubmit={handleSubmitSection}
          onCancel={closeSectionModal}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={getDeleteTitle()}
        message={getDeleteMessage()}
        confirmLabel={t('common.delete')}
        confirmColor="red"
        isLoading={isSubmitting}
      />

      {/* Bundle Manager Modal */}
      <Modal
        opened={bundleModalOpened}
        onClose={closeBundleModal}
        title={t('admin.bundles.manageBundles')}
        size="xl"
        centered
      >
        {bundleSection && (
          <SectionBundleManager section={bundleSection} onClose={closeBundleModal} />
        )}
      </Modal>
    </Stack>
  );
}

export default CourseContentManager;
