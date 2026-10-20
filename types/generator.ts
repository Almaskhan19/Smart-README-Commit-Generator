export type GenerationMode = 'readme' | 'commit';

export interface GenerateRequest {
  mode: GenerationMode;
  rawInput: string;
  projectTitle?: string;
}

export interface CommitSuggestion {
  type: 'feat' | 'fix' | 'docs' | 'refactor' | 'chore' | 'perf';
  scope: string;
  subject: string;
  fullHeader: string;
  bodyExplanation: string;
}

export interface ReadmeOutput {
  markdown: string;
  suggestedTags: string[];
}

export interface GenerateResponse {
  mode: GenerationMode;
  readme?: ReadmeOutput;
  commits?: CommitSuggestion[];
  error?: string;
}
