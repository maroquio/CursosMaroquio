import { useState, useCallback } from 'react';
import {
  Text,
  Stack,
  Alert,
  Button,
  Group,
  Paper,
  Code,
  Badge,
  Textarea,
  Accordion,
} from '@mantine/core';
import { IconCheck, IconX, IconBulb, IconCode } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { aiApi } from '../../api/ai';
import { MarkdownRenderer, PythonRunner, HtmlRunner, CodeBlock } from '../common';
import type { ExerciseSectionContent } from '../../types/course.types';

export interface ExerciseRendererProps {
  exercise: ExerciseSectionContent;
  sectionId: string;
  onComplete?: () => void;
  isLessonCompleted?: boolean;
}

interface VerificationResult {
  isCorrect: boolean;
  feedback: string;
  score?: number;
}

export function ExerciseRenderer({ exercise, sectionId, onComplete, isLessonCompleted }: ExerciseRendererProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState(exercise.starterCode || '');
  const [hintIndex, setHintIndex] = useState(0);
  const [allTestsPassed, setAllTestsPassed] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const isPythonExercise = !exercise.language || exercise.language === 'python';
  const isHtmlExercise = exercise.language === 'html';

  const handleShowNextHint = useCallback(() => {
    if (exercise.hints && hintIndex < exercise.hints.length - 1) {
      setHintIndex(prev => prev + 1);
    }
  }, [exercise.hints, hintIndex]);

  const handleTestResults = useCallback((passed: boolean) => {
    setAllTestsPassed(passed);
  }, []);

  const handleVerifyWithAI = useCallback(async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const response = await aiApi.verifyExercise(sectionId, code);
      if (response.success && response.data) {
        setVerificationResult(response.data);
        if (response.data.isCorrect && onComplete) {
          onComplete();
        }
      }
    } catch {
      setVerificationResult({
        isCorrect: false,
        feedback: t('courses.aiVerificationError', 'Erro ao verificar com IA. Tente novamente.'),
      });
    } finally {
      setVerifying(false);
    }
  }, [sectionId, code, onComplete, t]);

  return (
    <Stack gap="lg">
      {/* Problem Statement */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group gap="xs">
            <IconCode size={20} />
            <Text fw={600}>{t('courses.problemStatement')}</Text>
            {exercise.language && (
              <Badge variant="light" color="blue">
                {exercise.language.toUpperCase()}
              </Badge>
            )}
          </Group>
          <MarkdownRenderer content={exercise.problem} />
        </Stack>
      </Paper>

      {/* Code Runner */}
      {isPythonExercise ? (
        <PythonRunner
          initialCode={exercise.starterCode || '# Write your Python code here\n'}
          testCases={exercise.testCases}
          onCodeChange={setCode}
          onTestResults={handleTestResults}
        />
      ) : isHtmlExercise ? (
        <HtmlRunner
          initialCode={exercise.starterCode || '<!-- Write your HTML code here -->\n'}
          onCodeChange={setCode}
        />
      ) : (
        <>
          {/* Generic Code Editor (for other languages) */}
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Text fw={500}>{t('courses.yourCode')}</Text>
              <Textarea
                value={code}
                onChange={(e) => setCode(e.currentTarget.value)}
                minRows={10}
                maxRows={20}
                autosize
                styles={{
                  input: {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                  },
                }}
                placeholder={t('courses.writeCodeHere')}
              />
            </Stack>
          </Paper>

          {/* Test Cases (only for non-Python, since PythonRunner handles its own) */}
          {exercise.testCases && exercise.testCases.length > 0 && (
            <Paper p="md" withBorder>
              <Stack gap="md">
                <Text fw={500}>{t('courses.testCases')}</Text>
                {exercise.testCases.map((testCase, index) => (
                  <Paper key={index} p="sm" bg="gray.0">
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>
                        {testCase.description}
                      </Text>
                      {testCase.input && (
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">{t('courses.input')}:</Text>
                          <Code>{testCase.input}</Code>
                        </Group>
                      )}
                      {testCase.expectedOutput && (
                        <Group gap="xs">
                          <Text size="xs" c="dimmed">{t('courses.expectedOutput')}:</Text>
                          <Code>{testCase.expectedOutput}</Code>
                        </Group>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}
        </>
      )}

      {/* Hints */}
      {exercise.hints && exercise.hints.length > 0 && (
        <Accordion>
          <Accordion.Item value="hints">
            <Accordion.Control
              icon={<IconBulb size={20} />}
            >
              {t('courses.hints')} ({hintIndex + 1}/{exercise.hints.length})
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                {exercise.hints.slice(0, hintIndex + 1).map((hint, index) => (
                  <Alert key={index} icon={<IconBulb size={16} />} color="yellow">
                    {hint}
                  </Alert>
                ))}
                {hintIndex < exercise.hints.length - 1 && (
                  <Button variant="light" size="xs" onClick={handleShowNextHint}>
                    {t('courses.showNextHint')}
                  </Button>
                )}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}

      {/* Solution */}
      {exercise.solution && (
        <Accordion>
          <Accordion.Item value="solution">
            <Accordion.Control
              icon={<IconCode size={20} />}
            >
              {t('courses.viewSolution')}
            </Accordion.Control>
            <Accordion.Panel>
              <CodeBlock
                code={exercise.solution}
                language={exercise.language}
                showLineNumbers={true}
                showCopyButton={true}
                maxHeight={500}
              />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      )}

      {/* AI Verification Result */}
      {verificationResult && (
        <Alert
          color={verificationResult.isCorrect ? 'green' : 'red'}
          title={verificationResult.isCorrect
            ? t('courses.aiCorrect', 'Correto!')
            : t('courses.aiIncorrect', 'Incorreto')}
          icon={verificationResult.isCorrect ? <IconCheck size={16} /> : <IconX size={16} />}
        >
          <Stack gap="xs">
            <Text size="sm">{verificationResult.feedback}</Text>
            {verificationResult.score !== undefined && verificationResult.score !== null && (
              <Group>
                <Badge color={verificationResult.isCorrect ? 'green' : 'red'} variant="light">
                  Score: {verificationResult.score}
                </Badge>
              </Group>
            )}
          </Stack>
        </Alert>
      )}

      {/* Actions */}
      <Group>
        {isLessonCompleted ? (
          <Badge color="green" size="lg" leftSection={<IconCheck size={14} />}>
            {t('courses.alreadyCompleted')}
          </Badge>
        ) : (
          <>
            <Button
              onClick={handleVerifyWithAI}
              loading={verifying}
              color="violet"
              variant="filled"
            >
              {t('courses.verifyWithAI', 'Verificar com IA')}
            </Button>
            <Button
              onClick={onComplete}
              color={allTestsPassed ? 'green' : undefined}
              leftSection={allTestsPassed ? <IconCheck size={16} /> : undefined}
              variant="light"
            >
              {allTestsPassed
                ? t('courses.completeExercise', 'Complete Exercise')
                : t('courses.markAsComplete')}
            </Button>
          </>
        )}
        {!isPythonExercise && !isHtmlExercise && (
          <Button
            variant="subtle"
            onClick={() => setCode(exercise.starterCode || '')}
          >
            {t('courses.resetCode')}
          </Button>
        )}
      </Group>
    </Stack>
  );
}

export default ExerciseRenderer;
