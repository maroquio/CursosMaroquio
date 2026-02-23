import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Text,
  Skeleton,
  Stack,
  Alert,
  AspectRatio,
} from '@mantine/core';
import { IconAlertCircle, IconPackageOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { coursesApi } from '../../api/courses.api';
import { MarkdownRenderer } from '../common';
import { QuizRenderer } from './QuizRenderer';
import { ExerciseRenderer } from './ExerciseRenderer';
import type {
  Section,
  SectionBundle,
  TextSectionContent,
  QuizSectionContent,
  ExerciseSectionContent,
} from '../../types/course.types';

interface SectionRendererProps {
  section: Section;
  textContent?: string;
  videoUrl?: string;
  onComplete?: () => void;
  isLessonCompleted?: boolean;
}

/**
 * SectionRenderer Component
 * Renders section content based on its contentType:
 * - text: Renders markdown/HTML content
 * - video: Renders a video iframe
 * - exercise: Renders interactive exercise with code editor
 * - quiz: Renders interactive quiz with questions
 */
export function SectionRenderer({ section, textContent, videoUrl, onComplete, isLessonCompleted }: SectionRendererProps) {
  const { t } = useTranslation();
  const [bundle, setBundle] = useState<SectionBundle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasNativeContent = section.content && (section.contentType === 'exercise' || section.contentType === 'quiz');
  const needsBundle = section.contentType === 'interactive' ||
    ((section.contentType === 'exercise' || section.contentType === 'quiz') && !hasNativeContent);

  useEffect(() => {
    if (!needsBundle) {
      return;
    }

    const loadBundle = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await coursesApi.getActiveSectionBundle(section.id);
        if (response.success && response.data) {
          setBundle(response.data);
        } else {
          setError(response.error || t('courses.bundleLoadError'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('courses.bundleLoadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadBundle();
  }, [section.id, needsBundle, t]);

  // Prevent parent page scroll when user interacts with bundle iframe.
  const bundleScrollLockRef = useRef(false);
  const bundleSavedScrollRef = useRef(0);

  useEffect(() => {
    if (!needsBundle || !bundle) return;

    const handleScroll = () => {
      if (bundleScrollLockRef.current) {
        window.scrollTo(0, bundleSavedScrollRef.current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [needsBundle, bundle]);

  // Render text content
  if (section.contentType === 'text') {
    const textData = section.content as TextSectionContent | undefined;
    const body = textData?.body || textContent;

    if (!body) {
      return (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
          {t('courses.noContentAvailable')}
        </Alert>
      );
    }

    return <MarkdownRenderer content={body} />;
  }

  // Render video content
  if (section.contentType === 'video') {
    if (!videoUrl) {
      return (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
          {t('courses.noVideoAvailable')}
        </Alert>
      );
    }

    return (
      <AspectRatio ratio={16 / 9}>
        <iframe
          src={videoUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={section.title}
        />
      </AspectRatio>
    );
  }

  // Render quiz content (native)
  if (section.contentType === 'quiz' && hasNativeContent) {
    const quizData = section.content as QuizSectionContent | undefined;
    if (!quizData?.questions) {
      return (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
          {t('courses.noContentAvailable')}
        </Alert>
      );
    }
    return <QuizRenderer quiz={quizData} onComplete={onComplete} />;
  }

  // Render exercise content (native)
  if (section.contentType === 'exercise' && hasNativeContent) {
    const exerciseData = section.content as ExerciseSectionContent | undefined;
    if (!exerciseData?.problem) {
      return (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
          {t('courses.noContentAvailable')}
        </Alert>
      );
    }
    return <ExerciseRenderer exercise={exerciseData} sectionId={section.id} onComplete={onComplete} isLessonCompleted={isLessonCompleted} />;
  }

  // Render bundle content (interactive, or exercise/quiz without native content)
  if (needsBundle) {
    if (isLoading) {
      return (
        <Stack gap="md">
          <Skeleton height={50} />
          <Skeleton height={400} />
        </Stack>
      );
    }

    if (error) {
      return (
        <Alert icon={<IconAlertCircle size={16} />} color="red">
          {error}
        </Alert>
      );
    }

    if (!bundle) {
      return (
        <Alert icon={<IconPackageOff size={16} />} color="gray">
          <Stack gap="xs">
            <Text fw={500}>{t('courses.contentNotPublished')}</Text>
            <Text size="sm" c="dimmed">
              {t('courses.contentNotPublishedMessage')}
            </Text>
          </Stack>
        </Alert>
      );
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8702';
    const bundleUrl = `${API_URL}${bundle.bundleUrl}/${bundle.entrypoint}`;

    return (
      <Box
        onMouseEnter={() => {
          bundleSavedScrollRef.current = window.scrollY;
          bundleScrollLockRef.current = true;
        }}
        onMouseLeave={() => {
          bundleScrollLockRef.current = false;
        }}
        style={{
          width: '100%',
          minHeight: '660px',
          border: '1px solid var(--mantine-color-default-border)',
          borderRadius: 'var(--mantine-radius-md)',
          overflow: 'hidden',
        }}
      >
        <iframe
          src={bundleUrl}
          style={{
            width: '100%',
            height: '660px',
            border: 'none',
            backgroundColor: '#fff',
          }}
          title={`${section.title} - ${section.contentType}`}
        />
      </Box>
    );
  }

  // Fallback for unknown content types
  return (
    <Alert icon={<IconAlertCircle size={16} />} color="yellow">
      {t('courses.unknownContentType', { type: section.contentType })}
    </Alert>
  );
}

export default SectionRenderer;
