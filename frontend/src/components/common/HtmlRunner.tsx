import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Stack,
  Paper,
  Badge,
  Group,
  ActionIcon,
  Tooltip,
  Box,
  useMantineColorScheme,
} from '@mantine/core';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface HtmlRunnerProps {
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
  minHeight?: number;
}

export function HtmlRunner({
  initialCode = '',
  onCodeChange,
  readOnly = false,
  minHeight = 200,
}: HtmlRunnerProps) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const [code, setCode] = useState(initialCode);
  const [previewHtml, setPreviewHtml] = useState(initialCode);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCode(initialCode);
    setPreviewHtml(initialCode);
  }, [initialCode]);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      onCodeChange?.(newCode);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setPreviewHtml(newCode);
      }, 300);
    },
    [onCodeChange]
  );

  const resetCode = useCallback(() => {
    setCode(initialCode);
    setPreviewHtml(initialCode);
    onCodeChange?.(initialCode);
  }, [initialCode, onCodeChange]);

  const editorHeight = Math.max(300, minHeight);
  const previewHeight = Math.max(280, minHeight);

  return (
    <Stack gap="md">
      {/* Editor */}
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between">
            <Badge color="orange" variant="light">
              HTML
            </Badge>
            <Tooltip label={t('python.reset', 'Reset code')}>
              <ActionIcon variant="light" onClick={resetCode} disabled={readOnly}>
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <CodeMirror
            value={code}
            height={`${editorHeight}px`}
            extensions={[html()]}
            theme={colorScheme === 'dark' ? 'dark' : 'light'}
            onChange={(value) => handleCodeChange(value)}
            readOnly={readOnly}
            placeholder={t('html.placeholder', '<!-- Write your HTML code here... -->')}
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

      {/* Preview */}
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Badge color="green" variant="light">
            {t('html.preview', 'Preview')}
          </Badge>
          <Box
            style={{
              height: `${previewHeight}px`,
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: 'var(--mantine-radius-sm)',
              overflow: 'hidden',
              backgroundColor: '#fff',
            }}
          >
            <iframe
              srcDoc={previewHtml}
              title="HTML Preview"
              sandbox="allow-scripts"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block',
              }}
            />
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default HtmlRunner;
