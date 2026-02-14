import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { sql } from '@codemirror/lang-sql';
import { csharp } from '@replit/codemirror-lang-csharp';
import type { Extension } from '@codemirror/state';

export function getLanguageExtension(language?: string): Extension {
  switch(language?.toLowerCase()) {
    case 'python': return python();
    case 'html': return html();
    case 'css': return css();
    case 'javascript': return javascript();
    case 'typescript': return javascript({ typescript: true });
    case 'csharp':
    case 'c#': return csharp();
    case 'sql': return sql();
    default: return [];
  }
}

export function getLanguageLabel(language?: string): string {
  const labels: Record<string, string> = {
    python: 'Python',
    html: 'HTML',
    css: 'CSS',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    csharp: 'C#',
    'c#': 'C#',
    sql: 'SQL',
    text: 'Text',
  };
  return labels[language?.toLowerCase() || ''] || 'Code';
}

export function getLanguageColor(language?: string): string {
  const colors: Record<string, string> = {
    python: 'blue',
    html: 'orange',
    css: 'violet',
    javascript: 'yellow',
    typescript: 'indigo',
    csharp: 'grape',
    'c#': 'grape',
    sql: 'cyan',
  };
  return colors[language?.toLowerCase() || ''] || 'gray';
}
