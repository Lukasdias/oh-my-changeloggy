export type CommitType =
  | 'feat'
  | 'fix'
  | 'refactor'
  | 'perf'
  | 'docs'
  | 'style'
  | 'test'
  | 'chore'
  | 'build'
  | 'ci'
  | 'revert'
  | 'security'
  | 'deps'
  | 'config'
  | 'other';

export interface Commit {
  hash: string;
  subject: string;
  body: string;
  author: string;
  date: string;
  type: CommitType;
  scope?: string;
  breaking?: string;
}

export interface ChangelogOptions {
  since?: string;
  until?: string;
  output?: string;
  dryRun: boolean;
  format: 'markdown' | 'json';
  includeInternal: boolean;
  release?: string;
  interactive: boolean;
  prepend: boolean;
  autoVersion?: boolean;
  scopeFilter?: string[];
}
