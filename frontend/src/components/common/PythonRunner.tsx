import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Stack,
  Button,
  Group,
  Paper,
  Text,
  Code,
  Loader,
  Alert,
  Progress,
  Badge,
  Tooltip,
  ActionIcon,
  Box,
  useMantineColorScheme,
} from '@mantine/core';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import {
  IconPlayerPlay,
  IconTrash,
  IconRefresh,
  IconAlertCircle,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

// Pyodide types
interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  runPython: (code: string) => unknown;
  loadPackagesFromImports: (code: string) => Promise<void>;
  globals: {
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
  };
  FS: {
    writeFile: (path: string, data: string) => void;
    readFile: (path: string, options: { encoding: string }) => string;
  };
}

interface PyodideModule {
  loadPyodide: (config?: { indexURL?: string }) => Promise<PyodideInterface>;
}

declare global {
  interface Window {
    loadPyodide?: PyodideModule['loadPyodide'];
  }
}

// Pyodide CDN URL (latest version)
const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/';

interface TestCase {
  description: string;
  input?: string;
  expectedOutput?: string;
  expectedPattern?: string; // Regex pattern for flexible validation
}

interface PythonRunnerProps {
  initialCode?: string;
  testCases?: TestCase[];
  onCodeChange?: (code: string) => void;
  onTestResults?: (passed: boolean, results: TestResult[]) => void;
  readOnly?: boolean;
  minHeight?: number;
}

interface TestResult {
  description: string;
  passed: boolean;
  expected?: string;
  actual?: string;
  error?: string;
}

type PyodideStatus = 'idle' | 'loading' | 'ready' | 'running' | 'error';

// Global Pyodide instance (singleton to avoid reloading)
let pyodideInstance: PyodideInterface | null = null;
let pyodideLoadingPromise: Promise<PyodideInterface> | null = null;

async function loadPyodideScript(): Promise<void> {
  if (window.loadPyodide) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Pyodide script'));
    document.head.appendChild(script);
  });
}

async function getPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance;

  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = (async () => {
    await loadPyodideScript();

    if (!window.loadPyodide) {
      throw new Error('Pyodide not available');
    }

    const pyodide = await window.loadPyodide({
      indexURL: PYODIDE_CDN,
    });

    pyodideInstance = pyodide;
    return pyodide;
  })();

  return pyodideLoadingPromise;
}

export function PythonRunner({
  initialCode = '',
  testCases = [],
  onCodeChange,
  onTestResults,
  readOnly = false,
  minHeight = 200,
}: PythonRunnerProps) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<PyodideStatus>('idle');
  const [loadProgress, setLoadProgress] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const pyodideRef = useRef<PyodideInterface | null>(null);

  // Update code when initialCode changes
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      onCodeChange?.(newCode);
    },
    [onCodeChange]
  );

  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;

    setStatus('loading');
    setLoadProgress(10);

    try {
      // Simulate progress while loading
      const progressInterval = setInterval(() => {
        setLoadProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const pyodide = await getPyodide();
      pyodideRef.current = pyodide;

      clearInterval(progressInterval);
      setLoadProgress(100);
      setStatus('ready');

      return pyodide;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to load Python environment');
      throw err;
    }
  }, []);

  const captureOutput = useCallback((pyodide: PyodideInterface) => {
    // Redirect stdout and stderr to capture print statements
    pyodide.runPython(`
import sys
from io import StringIO

class OutputCapture:
    def __init__(self):
        self.stdout = StringIO()
        self.stderr = StringIO()
        self._original_stdout = sys.stdout
        self._original_stderr = sys.stderr

    def start(self):
        sys.stdout = self.stdout
        sys.stderr = self.stderr

    def stop(self):
        sys.stdout = self._original_stdout
        sys.stderr = self._original_stderr

    def get_output(self):
        return self.stdout.getvalue()

    def get_error(self):
        return self.stderr.getvalue()

    def clear(self):
        self.stdout = StringIO()
        self.stderr = StringIO()
        sys.stdout = self.stdout
        sys.stderr = self.stderr

__output_capture__ = OutputCapture()
    `);
  }, []);

  const runCode = useCallback(async () => {
    setOutput('');
    setError(null);
    setTestResults([]);
    setExecutionTime(null);

    try {
      const pyodide = await loadPyodide();
      setStatus('running');

      // Initialize output capture on first run
      captureOutput(pyodide);

      const startTime = performance.now();

      // Start capturing output
      pyodide.runPython('__output_capture__.clear(); __output_capture__.start()');

      // Load any required packages from imports
      try {
        await pyodide.loadPackagesFromImports(code);
      } catch {
        // Ignore package loading errors - they'll be caught when running
      }

      // Run the user's code with timeout, wrapped in try/except to capture full traceback
      const timeoutMs = 10000; // 10 second timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout (10s)')), timeoutMs);
      });

      // Wrap user code in try/except to capture Python traceback
      const wrappedCode = `
import traceback as __tb__
__exec_error__ = None
try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as __e__:
    __exec_error__ = ''.join(__tb__.format_exception(type(__e__), __e__, __e__.__traceback__))
`;

      await Promise.race([pyodide.runPythonAsync(wrappedCode), timeoutPromise]);

      // Stop capturing and get output
      pyodide.runPython('__output_capture__.stop()');
      const capturedOutput = pyodide.runPython('__output_capture__.get_output()') as string;
      const capturedStderr = pyodide.runPython('__output_capture__.get_error()') as string;
      const execError = pyodide.runPython('__exec_error__') as string | null;

      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));

      // Check for execution error first, then stderr
      if (execError) {
        // Clean up the traceback for readability
        const cleanError = execError
          .replace(/File "<exec>", /g, '')
          .replace(/Traceback \(most recent call last\):\s*/g, '')
          .trim();
        setError(cleanError || execError);
      } else if (capturedStderr) {
        setError(capturedStderr);
      }
      setOutput(capturedOutput || (execError ? '' : '(No output)'));
      setStatus('ready');
    } catch (err: unknown) {
      setStatus('ready');

      // Handle JavaScript-level errors (timeout, Pyodide loading issues, etc.)
      let errorMessage: string;

      if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = String(err);
      }

      setError(errorMessage || 'An unexpected error occurred');
    }
  }, [code, loadPyodide, captureOutput]);

  const runTests = useCallback(async () => {
    if (testCases.length === 0) return;

    setOutput('');
    setError(null);
    setTestResults([]);

    try {
      const pyodide = await loadPyodide();
      setStatus('running');
      captureOutput(pyodide);

      const results: TestResult[] = [];

      for (const testCase of testCases) {
        try {
          pyodide.runPython('__output_capture__.clear(); __output_capture__.start()');

          // If there's input, we need to mock input() function
          if (testCase.input) {
            const inputs = testCase.input.split('\n');
            pyodide.runPython(`
__test_inputs__ = ${JSON.stringify(inputs)}
__test_input_index__ = 0

def input(prompt=''):
    global __test_input_index__
    if __test_input_index__ < len(__test_inputs__):
        result = __test_inputs__[__test_input_index__]
        __test_input_index__ += 1
        return result
    return ''
            `);
          }

          await pyodide.runPythonAsync(code);

          pyodide.runPython('__output_capture__.stop()');
          const actual = (pyodide.runPython('__output_capture__.get_output()') as string).trim();

          let passed: boolean;
          let expected: string;

          if (testCase.expectedPattern) {
            // Use regex pattern for flexible validation
            const regex = new RegExp(testCase.expectedPattern);
            passed = regex.test(actual);
            expected = testCase.expectedPattern;
          } else {
            // Exact match
            expected = testCase.expectedOutput?.trim() || '';
            passed = actual === expected;
          }

          results.push({
            description: testCase.description,
            passed,
            expected: testCase.expectedPattern ? `(padrão) ${expected}` : expected,
            actual,
          });
        } catch (err) {
          results.push({
            description: testCase.description,
            passed: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      setTestResults(results);
      setStatus('ready');

      const allPassed = results.every((r) => r.passed);
      onTestResults?.(allPassed, results);
    } catch (err) {
      setStatus('ready');
      setError(err instanceof Error ? err.message : 'Failed to run tests');
    }
  }, [code, testCases, loadPyodide, captureOutput, onTestResults]);

  const clearOutput = useCallback(() => {
    setOutput('');
    setError(null);
    setTestResults([]);
    setExecutionTime(null);
  }, []);

  const resetCode = useCallback(() => {
    setCode(initialCode);
    clearOutput();
    onCodeChange?.(initialCode);
  }, [initialCode, clearOutput, onCodeChange]);

  const isLoading = status === 'loading';
  const isRunning = status === 'running';
  const isDisabled = isLoading || isRunning;

  return (
    <Stack gap="md">
      {/* Code Editor */}
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="xs">
              <Badge color="blue" variant="light">
                Python 3.12
              </Badge>
              {status === 'ready' && (
                <Badge color="green" variant="light" leftSection={<IconCheck size={12} />}>
                  {t('python.ready', 'Ready')}
                </Badge>
              )}
              {executionTime !== null && (
                <Text size="xs" c="dimmed">
                  {t('python.executionTime', 'Execution time')}: {executionTime}ms
                </Text>
              )}
            </Group>
            <Group gap="xs">
              <Tooltip label={t('python.reset', 'Reset code')}>
                <ActionIcon
                  variant="light"
                  onClick={resetCode}
                  disabled={isDisabled || readOnly}
                >
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          <CodeMirror
            value={code}
            height={`${Math.max(200, minHeight)}px`}
            extensions={[python()]}
            theme={colorScheme === 'dark' ? 'dark' : 'light'}
            onChange={(value) => handleCodeChange(value)}
            readOnly={readOnly || isRunning}
            placeholder={t('python.placeholder', '# Write your Python code here...')}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightActiveLine: true,
              foldGutter: true,
              autocompletion: false,
              bracketMatching: true,
              indentOnInput: true,
            }}
          />
        </Stack>
      </Paper>

      {/* Loading Progress */}
      {isLoading && (
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Group gap="sm">
              <Loader size="sm" />
              <Text size="sm">
                {loadProgress < 50
                  ? t('python.loadingRuntime', 'Loading Python runtime...')
                  : t('python.initializingEnvironment', 'Initializing environment...')}
              </Text>
            </Group>
            <Progress value={loadProgress} size="sm" animated />
            <Text size="xs" c="dimmed">
              {t('python.firstLoadNote', 'First load may take a few seconds (~15MB download)')}
            </Text>
          </Stack>
        </Paper>
      )}

      {/* Action Buttons */}
      <Group>
        <Button
          leftSection={isRunning ? <Loader size={14} color="white" /> : <IconPlayerPlay size={16} />}
          onClick={runCode}
          disabled={isDisabled || !code.trim()}
          loading={isRunning}
        >
          {isRunning ? t('python.running', 'Running...') : t('python.run', 'Run Code')}
        </Button>

        {testCases.length > 0 && (
          <Button
            variant="light"
            leftSection={<IconCheck size={16} />}
            onClick={runTests}
            disabled={isDisabled || !code.trim()}
          >
            {t('python.runTests', 'Run Tests')} ({testCases.length})
          </Button>
        )}

        <Button
          variant="subtle"
          leftSection={<IconTrash size={16} />}
          onClick={clearOutput}
          disabled={!output && !error && testResults.length === 0}
        >
          {t('python.clearOutput', 'Clear Output')}
        </Button>
      </Group>

      {/* Output */}
      {(output || error) && (
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text fw={500} size="sm">
              {t('python.output', 'Output')}:
            </Text>
            {output && (
              <Code
                block
                style={{
                  whiteSpace: 'pre-wrap',
                  maxHeight: '300px',
                  overflow: 'auto',
                }}
              >
                {output}
              </Code>
            )}
            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                variant="light"
                styles={{ icon: { alignSelf: 'center' } }}
              >
                <Code
                  block
                  style={{
                    whiteSpace: 'pre-wrap',
                    backgroundColor: 'transparent',
                    color: 'inherit',
                  }}
                >
                  {error}
                </Code>
              </Alert>
            )}
          </Stack>
        </Paper>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={500} size="sm">
                {t('python.testResults', 'Test Results')}
              </Text>
              <Badge
                color={testResults.every((r) => r.passed) ? 'green' : 'red'}
                variant="light"
              >
                {testResults.filter((r) => r.passed).length}/{testResults.length}{' '}
                {t('python.passed', 'passed')}
              </Badge>
            </Group>

            <Stack gap="xs">
              {testResults.map((result, index) => (
                <Paper
                  key={index}
                  p="sm"
                  withBorder
                  style={{
                    borderColor: result.passed
                      ? 'var(--mantine-color-green-6)'
                      : 'var(--mantine-color-red-6)',
                  }}
                >
                  <Stack gap="xs">
                    <Group gap="xs">
                      {result.passed ? (
                        <IconCheck size={16} color="var(--mantine-color-green-6)" />
                      ) : (
                        <IconX size={16} color="var(--mantine-color-red-6)" />
                      )}
                      <Text size="sm" fw={500}>
                        {result.description}
                      </Text>
                    </Group>

                    {!result.passed && (
                      <Box pl="md">
                        {result.error ? (
                          <Text size="xs" c="red">
                            {t('python.error', 'Error')}: {result.error}
                          </Text>
                        ) : (
                          <>
                            <Text size="xs" c="dimmed">
                              {t('python.expected', 'Expected')}:{' '}
                              <Code>{result.expected || '(empty)'}</Code>
                            </Text>
                            <Text size="xs" c="dimmed">
                              {t('python.actual', 'Actual')}:{' '}
                              <Code>{result.actual || '(empty)'}</Code>
                            </Text>
                          </>
                        )}
                      </Box>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

export default PythonRunner;
