'use client';

import { useState } from 'react';
import { GenerationMode, GenerateResponse } from '@/types/generator';
import { FileText, GitCommit, Sparkles, Copy, Check, Terminal } from 'lucide-react';

const SAMPLE_PACKAGE_JSON = `{
  "name": "nexus-analytics",
  "version": "1.0.0",
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "@google/genai": "^0.1.1"
  }
}`;

const SAMPLE_GIT_DIFF = `Modified app/api/auth/login.ts:
- Added rate limiting middleware (max 5 attempts per minute)
- Fixed bug where empty password threw 500 instead of 400 Bad Request
- Updated JWT token expiry from 30d to 7d for security`;

export default function HomePage() {
  const [mode, setMode] = useState<GenerationMode>('readme');
  const [projectTitle, setProjectTitle] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const loadSample = () => {
    if (mode === 'readme') {
      setProjectTitle('Nexus Analytics Engine');
      setRawInput(SAMPLE_PACKAGE_JSON);
    } else {
      setRawInput(SAMPLE_GIT_DIFF);
    }
  };

  const handleGenerate = async () => {
    if (!rawInput.trim()) return;
    setIsLoading(true);

    // Day 1 Mock Response (We will replace this with a real fetch('/api/generate') on Day 2)
    setTimeout(() => {
      if (mode === 'readme') {
        setResult({
          mode: 'readme',
          readme: {
            markdown: `# ${projectTitle || 'Project Title'}\n\n## Overview\nGenerated cleanly from your input configuration.\n\n## Tech Stack\n- Next.js (App Router)\n- TypeScript\n- Tailwind CSS`,
            suggestedTags: ['nextjs', 'typescript', 'ai-tools'],
          },
        });
      } else {
        setResult({
          mode: 'commit',
          commits: [
            {
              type: 'feat',
              scope: 'auth',
              subject: 'add rate limiting middleware to login endpoint',
              fullHeader: 'feat(auth): add rate limiting middleware to login endpoint',
              bodyExplanation: 'Restricts login attempts to 5 per minute to prevent brute-force attacks.',
            },
            {
              type: 'fix',
              scope: 'auth',
              subject: 'return 400 status on empty password payload',
              fullHeader: 'fix(auth): return 400 status on empty password payload',
              bodyExplanation: 'Prevents unhandled 500 server crashes when credentials are omitted.',
            },
          ],
        });
      }
      setIsLoading(false);
    }, 600);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg leading-none">DevDoc AI</h1>
            <p className="text-xs text-slate-400 mt-1">Smart README & Conventional Commit Studio</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => { setMode('readme'); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
              mode === 'readme'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            README Generator
          </button>
          <button
            onClick={() => { setMode('commit'); setResult(null); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition cursor-pointer ${
              mode === 'commit'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            Commit Messages
          </button>
        </div>
      </header>

      {/* Split-Screen Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-w-7xl w-full mx-auto">
        {/* Left Column: Input Panel */}
        <section className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">
              {mode === 'readme' ? '1. Paste package.json or Project Notes' : '1. Paste Git Diff or Change Summary'}
            </h2>
            <button
              onClick={loadSample}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              Load sample input
            </button>
          </div>

          {mode === 'readme' && (
            <input
              type="text"
              placeholder="Project Name (e.g., CloudDeploy CLI)"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="mb-3 w-full rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          )}

          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={
              mode === 'readme'
                ? 'Paste your package.json, requirements.txt, or bullet points describing your project...'
                : 'Paste your git diff output or list the files and bugs you fixed...'
            }
            className="flex-1 min-h-[320px] w-full rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
          />

          <button
            onClick={handleGenerate}
            disabled={isLoading || !rawInput.trim()}
            className="mt-4 w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 font-medium text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? 'Generating Structured Output...' : `Generate ${mode === 'readme' ? 'README.md' : 'Conventional Commits'}`}
          </button>
        </section>

        {/* Right Column: Output Preview */}
        <section className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-200">2. Structured Output</h2>
            {result?.readme && (
              <button
                onClick={() => copyToClipboard(result.readme!.markdown)}
                className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md text-slate-200 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Markdown'}
              </button>
            )}
          </div>

          <div className="flex-1 rounded-lg bg-slate-950 border border-slate-800 p-4 overflow-y-auto min-h-[320px]">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm text-center px-6">
                <Sparkles className="w-8 h-8 mb-2 text-slate-700" />
                <p>Load a sample on the left and click Generate to test your UI state.</p>
              </div>
            ) : result.mode === 'readme' && result.readme ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {result.readme.suggestedTags.map((tag) => (
                    <span key={tag} className="text-xs bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 px-2.5 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
                <pre className="font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {result.readme.markdown}
                </pre>
              </div>
            ) : (
              <div className="space-y-3">
                {result.commits?.map((commit, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-semibold text-emerald-400">{commit.fullHeader}</code>
                      <button
                        onClick={() => copyToClipboard(commit.fullHeader)}
                        className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">{commit.bodyExplanation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
