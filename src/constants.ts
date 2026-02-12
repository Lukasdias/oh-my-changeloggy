import { CommitType } from './types';

export const COMMIT_TYPES: Record<CommitType, { label: string; emoji: string; description: string }> = {
  feat: { label: '✨ New Features', emoji: '✨', description: 'New features' },
  fix: { label: '🐛 Bug Fixes', emoji: '🐛', description: 'Bug fixes' },
  refactor: { label: '♻️ Refactoring', emoji: '♻️', description: 'Code refactoring' },
  perf: { label: '⚡ Performance', emoji: '⚡', description: 'Performance improvements' },
  docs: { label: '📚 Documentation', emoji: '📚', description: 'Documentation changes' },
  style: { label: '💄 Styling', emoji: '💄', description: 'Code style changes' },
  test: { label: '✅ Tests', emoji: '✅', description: 'Test changes' },
  chore: { label: '🔧 Chores', emoji: '🔧', description: 'Build/tooling changes' },
  build: { label: '📦 Build', emoji: '📦', description: 'Build system changes' },
  ci: { label: '🔄 CI/CD', emoji: '🔄', description: 'CI/CD changes' },
  revert: { label: '⏪ Reverts', emoji: '⏪', description: 'Reverted changes' },
  other: { label: '📝 Other', emoji: '📝', description: 'Other changes' },
};

export const INTERNAL_TYPES: CommitType[] = ['chore', 'ci', 'style', 'test', 'build'];
