import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Stack,
  Paper,
  Badge,
  Group,
  ActionIcon,
  Tooltip,
  Box,
  SimpleGrid,
  useMantineColorScheme,
} from '@mantine/core';
import CodeMirror from '@uiw/react-codemirror';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface CssRunnerProps {
  initialCss?: string;
  htmlTemplate?: string;
  onCodeChange?: (css: string) => void;
  readOnly?: boolean;
  minHeight?: number;
}

export function CssRunner({
  initialCss = '',
  htmlTemplate = '<div class="container"><h1>Título</h1><p>Parágrafo de exemplo.</p></div>',
  onCodeChange,
  readOnly = false,
  minHeight = 200,
}: CssRunnerProps) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const [cssCode, setCssCode] = useState(initialCss);
  const [htmlCode, setHtmlCode] = useState(htmlTemplate);
  const [previewDoc, setPreviewDoc] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildSrcDoc = useCallback((currentCss: string, currentHtml: string) => {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${currentCss}
</style>
</head>
<body>
${currentHtml}
</body>
</html>`;
  }, []);

  useEffect(() => {
    setCssCode(initialCss);
    setHtmlCode(htmlTemplate);
    setPreviewDoc(buildSrcDoc(initialCss, htmlTemplate));
  }, [initialCss, htmlTemplate, buildSrcDoc]);

  const schedulePreviewUpdate = useCallback(
    (newCss: string, newHtml: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setPreviewDoc(buildSrcDoc(newCss, newHtml));
      }, 300);
    },
    [buildSrcDoc]
  );

  const handleCssChange = useCallback(
    (value: string) => {
      setCssCode(value);
      onCodeChange?.(value);
      schedulePreviewUpdate(value, htmlCode);
    },
    [htmlCode, onCodeChange, schedulePreviewUpdate]
  );

  const handleHtmlChange = useCallback(
    (value: string) => {
      setHtmlCode(value);
      schedulePreviewUpdate(cssCode, value);
    },
    [cssCode, schedulePreviewUpdate]
  );

  const resetCode = useCallback(() => {
    setCssCode(initialCss);
    setHtmlCode(htmlTemplate);
    setPreviewDoc(buildSrcDoc(initialCss, htmlTemplate));
    onCodeChange?.(initialCss);
  }, [initialCss, htmlTemplate, buildSrcDoc, onCodeChange]);

  const editorHeight = Math.max(280, minHeight);
  const previewHeight = Math.max(280, minHeight);

  return (
    <Stack gap="md">
      {/* Dual editors */}
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {/* CSS Editor */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Badge color="blue" variant="light">
                CSS
              </Badge>
              <Tooltip label={t('python.reset', 'Reset code')}>
                <ActionIcon variant="light" onClick={resetCode} disabled={readOnly}>
                  <IconRefresh size={16} />
                </ActionIcon>
              </Tooltip>
            </Group>
            <CodeMirror
              value={cssCode}
              height={`${editorHeight}px`}
              extensions={[css()]}
              theme={colorScheme === 'dark' ? 'dark' : 'light'}
              onChange={handleCssChange}
              readOnly={readOnly}
              placeholder={t('css.placeholder', '/* Write your CSS here... */')}
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

        {/* HTML Template Editor */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Group justify="space-between">
              <Badge color="orange" variant="light">
                HTML
              </Badge>
            </Group>
            <CodeMirror
              value={htmlCode}
              height={`${editorHeight}px`}
              extensions={[html()]}
              theme={colorScheme === 'dark' ? 'dark' : 'light'}
              onChange={handleHtmlChange}
              readOnly={readOnly}
              placeholder={t('html.placeholder', '<!-- HTML template here -->')}
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
      </SimpleGrid>

      {/* Live Preview */}
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
              srcDoc={previewDoc}
              title="CSS Preview"
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

export default CssRunner;
