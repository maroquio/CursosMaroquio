import { useState, useCallback } from 'react';
import {
  Text,
  Stack,
  Alert,
  Button,
  Radio,
  Group,
  Paper,
  Badge,
  Progress,
} from '@mantine/core';
import { IconCheck, IconX, IconBulb } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { MarkdownRenderer } from '../common';
import type { QuizSectionContent, QuizQuestion } from '../../types/course.types';

export interface QuizRendererProps {
  quiz: QuizSectionContent;
  onComplete?: () => void;
}

export function QuizRenderer({ quiz, onComplete }: QuizRendererProps) {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [attemptKey, setAttemptKey] = useState(0);

  const handleAnswerChange = useCallback((questionId: string, answerIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  }, [submitted]);

  // Fallback to 70 in case passingScore is missing from stored JSON content
  const passingScore = quiz.passingScore ?? 70;

  const handleSubmit = useCallback(() => {
    let correctCount = 0;
    quiz.questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });
    const calculatedScore = Math.round((correctCount / quiz.questions.length) * 100);
    setScore(calculatedScore);
    setSubmitted(true);

    if (calculatedScore >= passingScore && onComplete) {
      onComplete();
    }
  }, [answers, quiz.questions, passingScore, onComplete]);

  const handleReset = useCallback(() => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setAttemptKey(k => k + 1);
  }, []);

  const passed = score >= passingScore;

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {Object.keys(answers).length} / {quiz.questions.length} {t('courses.questionsAnswered')}
        </Text>
        <Badge color={passed ? 'green' : score > 0 ? 'yellow' : 'gray'}>
          {t('courses.passingScore')}: {passingScore}%
        </Badge>
      </Group>

      {quiz.questions.map((question, index) => (
        <QuestionCard
          key={`${question.id}-${attemptKey}`}
          question={question}
          index={index}
          selectedAnswer={answers[question.id]}
          onAnswerChange={handleAnswerChange}
          submitted={submitted}
        />
      ))}

      {submitted && (
        <Paper p="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="lg" fw={600}>
                {t('courses.yourScore')}: {score}%
              </Text>
              {passed ? (
                <Badge color="green" size="lg" leftSection={<IconCheck size={14} />}>
                  {t('courses.passed')}
                </Badge>
              ) : (
                <Badge color="red" size="lg" leftSection={<IconX size={14} />}>
                  {t('courses.failed')}
                </Badge>
              )}
            </Group>
            <Progress value={score} color={passed ? 'green' : 'red'} size="lg" />
          </Stack>
        </Paper>
      )}

      <Group>
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== quiz.questions.length}
          >
            {t('courses.submitQuiz')}
          </Button>
        ) : (
          <Button variant="light" onClick={handleReset}>
            {t('courses.tryAgain')}
          </Button>
        )}
      </Group>
    </Stack>
  );
}

interface QuestionCardProps {
  question: QuizQuestion;
  index: number;
  selectedAnswer?: number;
  onAnswerChange: (questionId: string, answerIndex: number) => void;
  submitted: boolean;
}

function QuestionCard({ question, index, selectedAnswer, onAnswerChange, submitted }: QuestionCardProps) {
  const { t } = useTranslation();
  const isCorrect = selectedAnswer === question.correctAnswer;
  const showResult = submitted && selectedAnswer !== undefined;

  const options = question.options && question.options.length > 0
    ? question.options
    : question.type === 'true_false'
      ? [t('courses.true', 'Verdadeiro'), t('courses.false', 'Falso')]
      : [];

  return (
    <Paper
      p="md"
      withBorder
      style={{
        borderColor: showResult
          ? isCorrect
            ? 'var(--mantine-color-green-6)'
            : 'var(--mantine-color-red-6)'
          : undefined,
      }}
    >
      <Stack gap="md">
        <Group gap="xs">
          <Badge variant="light">{index + 1}</Badge>
          <Text fw={500}>{question.question}</Text>
        </Group>

        <Radio.Group
          value={selectedAnswer?.toString()}
          onChange={(value) => onAnswerChange(question.id, parseInt(value))}
        >
          <Stack gap="xs">
            {options.map((option, optIndex) => {
              const isThisCorrect = optIndex === question.correctAnswer;
              const isSelected = selectedAnswer === optIndex;

              return (
                <Radio
                  key={optIndex}
                  value={optIndex.toString()}
                  label={option}
                  disabled={submitted}
                  styles={{
                    label: {
                      color: submitted
                        ? isThisCorrect
                          ? 'var(--mantine-color-green-7)'
                          : isSelected
                          ? 'var(--mantine-color-red-7)'
                          : undefined
                        : undefined,
                      fontWeight: submitted && isThisCorrect ? 600 : undefined,
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Radio.Group>

        {submitted && question.explanation && (
          <Alert icon={<IconBulb size={16} />} color={isCorrect ? 'green' : 'blue'}>
            <MarkdownRenderer content={question.explanation} allowImages={false} />
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

export default QuizRenderer;
