import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { Paper, Group, Badge, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { IconCopy, IconCheck } from '@tabler/icons-react';
import { getLanguageExtension, getLanguageLabel, getLanguageColor } from '../../utils/codemirror-languages';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  fileName?: string;
  maxHeight?: number | string;
  minHeight?: number | string;
}

export function CodeBlock({
  code,
  language,
  showLineNumbers = true,
  showCopyButton = true,
  fileName,
  maxHeight,
  minHeight,
}: CodeBlockProps) {
  const { colorScheme } = useMantineColorScheme();
  const clipboard = useClipboard({ timeout: 2000 });

  const extensions = useMemo(() => {
    return [
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      getLanguageExtension(language),
    ];
  }, [language]);

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <Group justify="space-between" px="md" py="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Group gap="xs">
          {language && (
            <Badge size="sm" color={getLanguageColor(language)} variant="light">
              {getLanguageLabel(language)}
            </Badge>
          )}
          {fileName && (
            <Badge size="sm" color="gray" variant="light">
              {fileName}
            </Badge>
          )}
        </Group>
        {showCopyButton && (
          <ActionIcon
            variant="subtle"
            color={clipboard.copied ? 'teal' : 'gray'}
            onClick={() => clipboard.copy(code)}
            title={clipboard.copied ? 'Copied!' : 'Copy code'}
          >
            {clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </ActionIcon>
        )}
      </Group>

      {/* Code Editor */}
      <CodeMirror
        value={code}
        theme={colorScheme === 'dark' ? 'dark' : 'light'}
        readOnly={true}
        editable={false}
        extensions={extensions}
        basicSetup={{
          lineNumbers: showLineNumbers,
          highlightActiveLineGutter: false,
          highlightActiveLine: false,
          foldGutter: false,
        }}
        style={{
          fontSize: '14px',
          minHeight: minHeight || '100px',
          maxHeight: maxHeight || 'none',
          overflow: 'auto',
        }}
      />
    </Paper>
  );
}
