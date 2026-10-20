import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { GenerateRequest, GenerateResponse } from '@/types/generator';
import { checkRateLimit } from '@/lib/rate-limit';

// 1. Strict Schema for README Mode
const readmeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    markdown: {
      type: Type.STRING,
      description:
        'Complete, professional GitHub README.md content formatted in clean Markdown with badges, features, tech stack, and setup steps.',
    },
    suggestedTags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        '5 to 7 lowercase GitHub repository topic tags (e.g., nextjs, typescript, tailwindcss).',
    },
  },
  required: ['markdown', 'suggestedTags'],
};

// 2. Strict Schema for Conventional Commits Mode
const commitSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ['feat', 'fix', 'docs', 'refactor', 'chore', 'perf'],
      },
      scope: {
        type: Type.STRING,
        description: 'Short module or file scope, e.g., auth, ui, api, db.',
      },
      subject: {
        type: Type.STRING,
        description: 'Imperative, lowercase commit summary under 60 characters.',
      },
      fullHeader: {
        type: Type.STRING,
        description: 'Formatted as type(scope): subject',
      },
      bodyExplanation: {
        type: Type.STRING,
        description: '1-2 sentence explanation of why this change was made and its impact.',
      },
    },
    required: ['type', 'scope', 'subject', 'fullHeader', 'bodyExplanation'],
  },
};

export async function POST(req: NextRequest) {
  try {
    // Apply Rate Limiting by client IP first to guard endpoint
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'local-dev';
    const rateStatus = checkRateLimit(clientIp, 5, 60_000);

    if (!rateStatus.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Please wait ${rateStatus.resetInSeconds}s before generating again.`,
        },
        { status: 429 }
      );
    }

    // Check API Key configuration
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Server misconfiguration: Missing GEMINI_API_KEY in .env.local' },
        { status: 500 }
      );
    }

    // Validate Request Body
    const body = (await req.json()) as GenerateRequest;
    const { mode, rawInput, projectTitle } = body;

    if (!rawInput || rawInput.trim().length < 10) {
      return NextResponse.json(
        {
          error: 'Please provide at least 10 characters of input code, configuration, or notes.',
        },
        { status: 400 }
      );
    }

    // Initialize GoogleGenAI client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Configure Prompt & Schema based on Mode
    const isReadme = mode === 'readme';
    const prompt = isReadme
      ? `Generate a production-grade GitHub README.md for a project titled "${
          projectTitle || 'Modern Software Project'
        }". Analyze the following input (package.json, dependencies, or notes) and include an Overview, Key Features, Tech Stack table, and Local Quickstart instructions:\n\n${rawInput}`
      : `Analyze the following git diff or developer notes and break them down into 2 to 4 clean, atomic Conventional Commits:\n\n${rawInput}`;

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: isReadme ? readmeSchema : commitSchema,
        temperature: 0.3,
      },
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new Error('Empty response received from Gemini model.');
    }

    const parsedData = JSON.parse(rawJson);
    const payload: GenerateResponse = isReadme
      ? { mode: 'readme', readme: parsedData }
      : { mode: 'commit', commits: parsedData };

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'X-RateLimit-Remaining': String(rateStatus.remaining),
      },
    });
  } catch (err: unknown) {
    console.error('[GENERATE_API_ERROR]:', err);
    const message = err instanceof Error ? err.message : 'Unexpected server error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
