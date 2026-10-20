'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse lines into structured blocks
  const parseBlocks = () => {
    const lines = content.split('\n');
    const blocks: React.ReactNode[] = [];
    let i = 0;
    let blockIndex = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim() || 'text';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        const fullCode = codeLines.join('\n');
        const currentIndex = blockIndex++;
        blocks.push(
          <div key={currentIndex} className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90 shadow-md">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-900/70 text-xs text-slate-400">
              <span className="font-mono text-indigo-400 font-medium">{lang}</span>
              <button
                onClick={() => copyCode(fullCode, currentIndex)}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Copy code"
              >
                {copiedIndex === currentIndex ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 font-mono text-xs sm:text-sm text-slate-200 overflow-x-auto leading-relaxed">
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        i++;
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        blocks.push(
          <h1 key={blockIndex++} className="text-2xl sm:text-3xl font-extrabold text-white mt-6 mb-3 pb-2 border-b border-slate-800 tracking-tight flex items-center gap-2">
            {formatInline(line.slice(2))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        blocks.push(
          <h2 key={blockIndex++} className="text-xl sm:text-2xl font-bold text-slate-100 mt-6 mb-2.5 pb-1.5 border-b border-slate-800/60 tracking-tight">
            {formatInline(line.slice(3))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        blocks.push(
          <h3 key={blockIndex++} className="text-base sm:text-lg font-semibold text-indigo-300 mt-5 mb-2 tracking-tight">
            {formatInline(line.slice(4))}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('#### ')) {
        blocks.push(
          <h4 key={blockIndex++} className="text-sm sm:text-base font-semibold text-slate-200 mt-4 mb-1.5">
            {formatInline(line.slice(5))}
          </h4>
        );
        i++;
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        blocks.push(
          <blockquote key={blockIndex++} className="my-3 pl-4 border-l-4 border-indigo-500/80 bg-indigo-950/20 py-2 pr-3 rounded-r-lg text-sm text-slate-300 italic">
            {formatInline(line.slice(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
          listItems.push(lines[i].trim().slice(2));
          i++;
        }
        blocks.push(
          <ul key={blockIndex++} className="my-3 space-y-1.5 pl-5 list-disc text-slate-300 text-sm">
            {listItems.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {formatInline(item)}
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Tables
      if (line.includes('|') && lines[i + 1]?.includes('---')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].includes('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        const headers = tableLines[0].split('|').map(h => h.trim()).filter(Boolean);
        const rows = tableLines.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean));

        blocks.push(
          <div key={blockIndex++} className="my-4 overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300 divide-y divide-slate-800">
              <thead className="bg-slate-900/90 text-slate-200 font-semibold">
                <tr>
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="px-3.5 py-2.5">{formatInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/50 transition">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 font-mono text-xs">{formatInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      // Empty lines
      if (!line.trim()) {
        i++;
        continue;
      }

      // Standard paragraph
      blocks.push(
        <p key={blockIndex++} className="my-2 text-sm sm:text-base leading-relaxed text-slate-300">
          {formatInline(line)}
        </p>
      );
      i++;
    }

    return blocks;
  };

  // Helper to handle inline markdown styles (bold, code, links, badges)
  const formatInline = (text: string): React.ReactNode => {
    // Regex matching bold, code, markdown links, or plain text
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Badges / Images: ![alt](url)
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    let lastIndex = 0;

    while ((match = imgRegex.exec(text)) !== null) {
      const [fullMatch, alt, src] = match;
      if (match.index > lastIndex) {
        parts.push(parseFormattedText(text.substring(lastIndex, match.index), key++));
      }
      parts.push(
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key++}
          src={src}
          alt={alt}
          className="inline-block mr-1.5 my-1 rounded"
          loading="lazy"
        />
      );
      lastIndex = match.index + fullMatch.length;
    }

    if (lastIndex < text.length) {
      parts.push(parseFormattedText(text.substring(lastIndex), key++));
    }

    return parts.length ? parts : remaining;
  };

  const parseFormattedText = (str: string, parentKey: number): React.ReactNode => {
    // Split by markdown elements: `code`, **bold**, [link](url)
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
    const tokens = str.split(tokenRegex);

    return (
      <span key={parentKey}>
        {tokens.map((token, idx) => {
          if (token.startsWith('`') && token.endsWith('`')) {
            return (
              <code
                key={idx}
                className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80 font-mono text-xs text-indigo-300"
              >
                {token.slice(1, -1)}
              </code>
            );
          }
          if (token.startsWith('**') && token.endsWith('**')) {
            return (
              <strong key={idx} className="font-semibold text-white">
                {token.slice(2, -2)}
              </strong>
            );
          }
          if (token.startsWith('[') && token.includes('](')) {
            const labelMatch = token.match(/\[([^\]]+)\]/);
            const urlMatch = token.match(/\(([^)]+)\)/);
            if (labelMatch && urlMatch) {
              return (
                <a
                  key={idx}
                  href={urlMatch[1]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition"
                >
                  {labelMatch[1]}
                </a>
              );
            }
          }
          return token;
        })}
      </span>
    );
  };

  return (
    <div className="prose prose-invert max-w-none space-y-1">
      {parseBlocks()}
    </div>
  );
}
