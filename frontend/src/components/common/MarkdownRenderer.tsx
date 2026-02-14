import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TypographyStylesProvider, Code } from '@mantine/core';
import { CodeBlock } from './CodeBlock';
import classes from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content: string;
  allowImages?: boolean;
  allowLinks?: boolean;
}

/**
 * MarkdownRenderer Component
 *
 * Renders markdown content using react-markdown with Mantine styling.
 * Supports GitHub Flavored Markdown (GFM) including:
 * - Headers, bold, italic
 * - Code blocks and inline code
 * - Links and images
 * - Tables
 * - Strikethrough (~~text~~)
 * - Task lists (- [ ] item)
 * - Autolinks
 *
 * @param content - The markdown string to render
 * @param allowImages - Whether to render images (default: true)
 * @param allowLinks - Whether to render clickable links (default: true)
 */
export function MarkdownRenderer({
  content,
  allowImages = true,
  allowLinks = true,
}: MarkdownRendererProps) {
  return (
    <div className={classes.root}>
      <TypographyStylesProvider>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: allowImages
              ? undefined
              : () => null,
            a: allowLinks
              ? ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                )
              : ({ children }) => <span>{children}</span>,
            code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : undefined;
              const inline = !className;

              return !inline ? (
                <CodeBlock
                  code={String(children).replace(/\n$/, '')}
                  language={language}
                  showLineNumbers={true}
                  showCopyButton={true}
                />
              ) : (
                <Code>{children}</Code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </TypographyStylesProvider>
    </div>
  );
}
