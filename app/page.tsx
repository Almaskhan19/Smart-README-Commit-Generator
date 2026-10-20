'use client';

import { useState } from 'react';
import { GenerationMode, GenerateResponse } from '@/types/generator';
import { MarkdownPreview } from '@/components/MarkdownPreview';
import {
  FileText,
  GitCommit,
  Sparkles,
  Copy,
  Check,
  Terminal,
  Download,
  Eye,
  Code2,
  ExternalLink,
  Zap,
  RotateCcw,
  Tag,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

const README_PRESETS = [
  {
    label: '🚀 Next.js 16 SaaS',
    title: 'Nexus Cloud Analytics',
    input: `{
  "name": "nexus-cloud",
  "version": "1.0.0",
  "description": "High performance real-time analytics dashboard with AI insights",
  "dependencies": {
    "next": "^16.4.0",
    "react": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@google/genai": "^2.30.0",
    "lucide-react": "^1.60.0"
  }
}`
  },
  {
    label: '🐍 Python CLI Engine',
    title: 'DevGuard CLI',
    input: `# DevGuard - Secret Scanner & Dependency Auditor
- Scans repositories for hardcoded API keys, tokens, and credentials.
- Checks local virtualenvs against the latest CVE databases.
- Integrates with GitHub Actions and pre-commit git hooks.
- Written in Python 3.12 with Click, Rich, and PyYAML.`
  },
  {
    label: '⚡ Rust Microservice',
    title: 'VoltStream Ingestor',
    input: `# VoltStream
- High-throughput WebSocket message streaming broker written in Rust.
- Zero-copy deserialization using Cap'n Proto.
- Sub-millisecond latency under 100k concurrent client connections.
- Prometheus metrics exporter on port 9090.`
  }
];

const COMMIT_PRESETS = [
  {
    label: '🛡️ Auth Rate-Limit Security Fix',
    input: `Modified app/api/auth/login.ts:
- Implemented sliding window rate limiting (max 5 failed attempts per 15 minutes per IP)
- Fixed security vulnerability where empty password threw 500 error instead of 400 Bad Request
- Upgraded JWT signing algorithm to RS256 with key rotation support`
  },
  {
    label: '💳 Stripe Checkout Integration',
    input: `Added app/api/billing/checkout/route.ts and components/PricingTable.tsx:
- Added Stripe webhook handler for subscription renewals and cancellations
- Built interactive pricing selector with monthly and annual discount toggles
- Stored customer stripe_customer_id in Supabase users table`
  },
  {
    label: '♻️ Database Schema & ORM Migration',
    input: `Modified prisma/schema.prisma and migrations/20261020_init:
- Added composite index on (team_id, created_at) to speed up timeline queries by 85%
- Renamed user_profiles.avatarUrl to user_profiles.avatar_url for naming convention consistency
- Removed deprecated v1 analytics tables`
  }
];

export default function HomePage() {
  const [mode, setMode] = useState<GenerationMode>('readme');
  const [projectTitle, setProjectTitle] = useState('');
  const [rawInput, setRawInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('Analyzing context...');
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // View state: 'preview' (rendered markdown) or 'raw' (code view)
  const [viewMode, setViewMode] = useState<'preview' | 'raw'>('preview');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyToClipboard = (text: string, label: string = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    showToast(label);
  };

  const handleDownloadReadme = () => {
    if (!result?.readme?.markdown) return;
    const blob = new Blob([result.readme.markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'README.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded README.md!');
  };

  const handleGenerate = async () => {
    if (!rawInput.trim()) return;
    setIsLoading(true);
    setError(null);

    // Dynamic phase transitions
    const phases = ['Analyzing inputs...', 'Invoking Gemini 2.5 Flash...', 'Formatting structured output...'];
    let phaseIndex = 0;
    setLoadingPhase(phases[0]);
    const phaseInterval = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % phases.length;
      setLoadingPhase(phases[phaseIndex]);
    }, 1200);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          rawInput,
          projectTitle: mode === 'readme' ? projectTitle : undefined,
        }),
      });

      const data: GenerateResponse = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to generate output.');
        return;
      }

      setResult(data);
      showToast(mode === 'readme' ? 'README generated successfully!' : 'Commits generated successfully!');
    } catch {
      setError('Network error: Could not reach the generation server.');
    } finally {
      clearInterval(phaseInterval);
      setIsLoading(false);
    }
  };

  const applyPreset = (preset: { label: string; title?: string; input: string }) => {
    setError(null);
    if (preset.title) setProjectTitle(preset.title);
    setRawInput(preset.input);
    showToast(`Loaded preset: ${preset.label}`);
  };

  const handleReset = () => {
    setRawInput('');
    setProjectTitle('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col relative selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -left-40 w-[500px] h-[500px] bg-indigo-900/10 blur-[140px] rounded-full" />
        <div className="absolute top-[60%] -right-40 w-[500px] h-[500px] bg-purple-900/10 blur-[140px] rounded-full" />
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#030712]/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                DevDoc AI
              </h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-950/90 text-indigo-300 border border-indigo-800/60">
                v0.1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Smart README & Conventional Commit Studio
            </p>
          </div>
        </div>

        {/* Central Mode Switcher */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => { setMode('readme'); setResult(null); setError(null); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
              mode === 'readme'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            README Studio
          </button>
          <button
            onClick={() => { setMode('commit'); setResult(null); setError(null); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition cursor-pointer ${
              mode === 'commit'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            Conventional Commits
          </button>
        </div>

        {/* Status & GitHub Repo Link */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">Gemini 2.5 Flash</span>
          </div>

          <a
            href="https://github.com/Almaskhan19/Smart-README-Commit-Generator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition shadow-sm hover:border-slate-600 cursor-pointer"
          >
            <GitHubIcon className="w-3.5 h-3.5 text-slate-300" />
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </header>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Preset chips bar */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Quick Presets:
          </span>
          {(mode === 'readme' ? README_PRESETS : COMMIT_PRESETS).map((preset, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(preset)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-950/80 hover:text-indigo-300 hover:border-indigo-700/60 border border-slate-700/60 text-slate-300 transition cursor-pointer font-medium"
            >
              {preset.label}
            </button>
          ))}
          {rawInput && (
            <button
              onClick={handleReset}
              className="ml-auto text-xs px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition flex items-center gap-1 cursor-pointer"
              title="Clear inputs"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        {/* Dual Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT: Input Configuration Column */}
          <section className="flex flex-col bg-slate-900/70 backdrop-blur-md border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="h-6 w-6 rounded-md bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="font-bold text-slate-100 text-sm sm:text-base">
                  {mode === 'readme' ? 'Project Context & Dependencies' : 'Code Changes & Git Diff'}
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {rawInput.length} chars
              </span>
            </div>

            {mode === 'readme' && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Project Title <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nexus Cloud Analytics"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full rounded-xl bg-slate-950/90 border border-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {mode === 'readme'
                  ? 'Paste package.json, requirements.txt, or project bullet points:'
                  : 'Paste git diff, pull request summary, or list of modified files:'}
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={
                  mode === 'readme'
                    ? '{\n  "name": "my-app",\n  "dependencies": {\n    "next": "^16.4.0"\n  }\n}\n\nOr write:\n- A real-time collaboration dashboard\n- Built with WebSockets and Tailwind CSS\n- Redis caching layer'
                    : 'diff --git a/app/api/auth.ts b/app/api/auth.ts\n+ Added argon2 password verification\n+ Limited login requests to 5 per minute per IP'
                }
                rows={14}
                className="w-full rounded-xl bg-slate-950/90 border border-slate-800 p-4 font-mono text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-y transition leading-relaxed"
              />
            </div>

            {error && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-start gap-2.5">
                <span className="text-red-400 font-bold">Error:</span>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isLoading || !rawInput.trim()}
              className="mt-5 w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 cursor-pointer disabled:cursor-not-allowed group"
            >
              <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
              {isLoading ? (
                <span>{loadingPhase}</span>
              ) : (
                <span>{mode === 'readme' ? 'Generate Production README.md' : 'Generate Conventional Commits'}</span>
              )}
            </button>
          </section>

          {/* RIGHT: Output Studio Column */}
          <section className="flex flex-col bg-slate-900/70 backdrop-blur-md border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl relative min-h-[580px]">
            {/* Header / View Switcher */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80 gap-2">
              <div className="flex items-center gap-2.5">
                <span className="h-6 w-6 rounded-md bg-purple-600/20 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="font-bold text-slate-100 text-sm sm:text-base">
                  {mode === 'readme' ? 'Generated README' : 'Generated Conventional Commits'}
                </h2>
              </div>

              {/* View Switcher for README */}
              {mode === 'readme' && result?.readme && (
                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                        viewMode === 'preview'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    <button
                      onClick={() => setViewMode('raw')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                        viewMode === 'raw'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      Markdown
                    </button>
                  </div>

                  <button
                    onClick={handleDownloadReadme}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    title="Download README.md"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => copyToClipboard(result.readme!.markdown, 'Copied full README markdown!')}
                    className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-white font-medium transition cursor-pointer shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                </div>
              )}
            </div>

            {/* Output Content Area */}
            <div className="flex-1 rounded-xl bg-slate-950/90 border border-slate-800/80 p-5 overflow-y-auto max-h-[640px]">
              {!result ? (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                  <div className="h-16 w-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center mb-4 text-indigo-400">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-slate-200 text-base mb-1">
                    Studio Ready for Input
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed mb-6">
                    Select a preset above or paste your project details on the left, then click Generate to produce production-ready output.
                  </p>
                  <div className="grid grid-cols-2 gap-3 max-w-xs w-full text-left">
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                      <div className="font-semibold text-indigo-400 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Badges & Tables
                      </div>
                      Structured documentation syntax.
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                      <div className="font-semibold text-purple-400 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Conventional
                      </div>
                      Standard semantic commits.
                    </div>
                  </div>
                </div>
              ) : mode === 'readme' && result.readme ? (
                <div className="space-y-5">
                  {/* Recommended Repository Tags */}
                  {result.readme.suggestedTags && result.readme.suggestedTags.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <Tag className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Recommended GitHub Repository Topics:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {result.readme.suggestedTags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => copyToClipboard(tag, `Copied tag #${tag}!`)}
                            className="text-xs bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 px-2.5 py-1 rounded-lg transition cursor-pointer font-mono"
                            title="Click to copy tag"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rendered View or Raw Markdown View */}
                  {viewMode === 'preview' ? (
                    <MarkdownPreview content={result.readme.markdown} />
                  ) : (
                    <pre className="font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                      {result.readme.markdown}
                    </pre>
                  )}
                </div>
              ) : (
                /* Conventional Commits Output */
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>Generated {result.commits?.length || 0} Conventional Commit Suggestions:</span>
                    <button
                      onClick={() => {
                        const allHeaders = result.commits?.map(c => c.fullHeader).join('\n') || '';
                        copyToClipboard(allHeaders, 'Copied all commit headers!');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      Copy All Headers
                    </button>
                  </div>

                  {result.commits?.map((commit, idx) => {
                    const badgeStyles: Record<string, string> = {
                      feat: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-400',
                      fix: 'bg-amber-950/80 border-amber-700/60 text-amber-400',
                      docs: 'bg-sky-950/80 border-sky-700/60 text-sky-400',
                      refactor: 'bg-purple-950/80 border-purple-700/60 text-purple-400',
                      perf: 'bg-cyan-950/80 border-cyan-700/60 text-cyan-400',
                      chore: 'bg-slate-800/90 border-slate-700/60 text-slate-300',
                    };

                    const style = badgeStyles[commit.type] || badgeStyles.chore;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[11px] font-mono uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-md border ${style}`}>
                              {commit.type}
                            </span>
                            <code className="text-xs sm:text-sm font-semibold text-slate-100 font-mono">
                              {commit.fullHeader}
                            </code>
                          </div>
                          <button
                            onClick={() => copyToClipboard(commit.fullHeader, 'Copied commit message!')}
                            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md transition cursor-pointer shrink-0"
                            title="Copy commit message"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed pl-1 border-l-2 border-slate-800">
                          {commit.bodyExplanation}
                        </p>

                        <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                          <code className="text-[11px] font-mono text-slate-400 truncate max-w-[80%]">
                            git commit -m &quot;{commit.fullHeader}&quot;
                          </code>
                          <button
                            onClick={() => copyToClipboard(`git commit -m "${commit.fullHeader}"`, 'Copied git command!')}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                          >
                            Copy Command
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Studio Footer Info */}
        <footer className="mt-8 border-t border-slate-800/80 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Token Leakage Protocol • Strict Environment Isolation</span>
          </div>
          <div>
            Powered by Google Gemini 2.5 Flash • Next.js 16 • Tailwind CSS v4
          </div>
        </footer>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/50 text-slate-100 text-xs sm:text-sm font-medium shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
