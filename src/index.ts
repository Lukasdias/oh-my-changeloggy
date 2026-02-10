import { Command } from 'commander';
import { execSync } from 'child_process';
import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface Commit {
  hash: string;
  subject: string;
  body: string;
  author: string;
  date: string;
  type: CommitType;
  scope?: string;
}

type CommitType = 
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
  | 'other';

interface ChangelogOptions {
  since?: string;
  until?: string;
  output?: string;
  dryRun: boolean;
  format: 'markdown' | 'json';
  includeInternal: boolean;
  release?: string;
}

const COMMIT_TYPES: Record<CommitType, { label: string; emoji: string; description: string }> = {
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

const INTERNAL_TYPES: CommitType[] = ['chore', 'ci', 'style', 'test', 'build'];

function parseConventionalCommit(subject: string): { type: CommitType; scope?: string; description: string } {
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
  
  if (!match) {
    return { type: 'other', description: subject };
  }
  
  const [, type, scope, description] = match;
  return {
    type: (type as CommitType) in COMMIT_TYPES ? (type as CommitType) : 'other',
    scope,
    description,
  };
}

function getLastTag(): string | null {
  try {
    const result = execSync('git describe --tags --abbrev=0', { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim();
  } catch {
    return null;
  }
}

function getCommits(since?: string, until?: string): Commit[] {
  const format = '%H|%s|%b|%an|%ad|';
  let command = `git log --format="${format}" --date=short`;
  
  if (since) {
    const lastTag = getLastTag();
    if (since === 'last-tag' && lastTag) {
      command += ` ${lastTag}..HEAD`;
    } else {
      command += ` --since="${since}"`;
    }
  }
  
  if (until) {
    command += ` --until="${until}"`;
  }
  
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    
    return output
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.split('|');
        const subject = parts[1] || '';
        const parsed = parseConventionalCommit(subject);
        
        return {
          hash: parts[0]?.substring(0, 7) || '',
          subject: parsed.description,
          body: parts[2] || '',
          author: parts[3] || '',
          date: parts[4] || '',
          type: parsed.type,
          scope: parsed.scope,
        };
      });
  } catch (error) {
    console.error('Error reading git log:', error);
    return [];
  }
}

function categorizeCommits(commits: Commit[], includeInternal: boolean): Map<CommitType, Commit[]> {
  const categories = new Map<CommitType, Commit[]>();
  
  for (const commit of commits) {
    if (!includeInternal && INTERNAL_TYPES.includes(commit.type)) {
      continue;
    }
    
    if (!categories.has(commit.type)) {
      categories.set(commit.type, []);
    }
    categories.get(commit.type)!.push(commit);
  }
  
  return categories;
}

function formatMarkdown(
  categories: Map<CommitType, Commit[]>, 
  version?: string,
  since?: string
): string {
  const date = new Date().toISOString().split('T')[0];
  const versionStr = version || `Unreleased (${date})`;
  
  let output = `# Changelog\n\n`;
  output += `## ${versionStr}\n\n`;
  
  if (since) {
    output += `*Changes since ${since}*\n\n`;
  }
  
  const typeOrder: CommitType[] = ['feat', 'fix', 'perf', 'refactor', 'docs', 'revert', 'other'];
  
  for (const type of typeOrder) {
    const commits = categories.get(type);
    if (!commits || commits.length === 0) continue;
    
    const typeInfo = COMMIT_TYPES[type];
    output += `### ${typeInfo.label}\n\n`;
    
    for (const commit of commits) {
      const scope = commit.scope ? `**${commit.scope}**: ` : '';
      const breaking = commit.body.includes('BREAKING CHANGE') ? ' ⚠️ **BREAKING**' : '';
      output += `- ${scope}${commit.subject}${breaking}\n`;
      
      if (commit.body && !commit.body.includes('BREAKING CHANGE')) {
        const bodyLines = commit.body.split('\n').filter(line => line.trim());
        if (bodyLines.length > 0) {
          output += `  - ${bodyLines[0]}\n`;
        }
      }
    }
    
    output += '\n';
  }
  
  return output;
}

function formatJSON(categories: Map<CommitType, Commit[]>): string {
  const result: Record<string, any[]> = {};
  
  for (const [type, commits] of categories) {
    result[type] = commits.map(c => ({
      hash: c.hash,
      subject: c.subject,
      scope: c.scope,
      author: c.author,
      date: c.date,
    }));
  }
  
  return JSON.stringify(result, null, 2);
}

async function generateChangelog(options: ChangelogOptions): Promise<string> {
  const commits = getCommits(options.since, options.until);
  
  if (commits.length === 0) {
    console.log('No commits found in the specified range.');
    process.exit(0);
  }
  
  const categories = categorizeCommits(commits, options.includeInternal);
  
  if (options.format === 'json') {
    return formatJSON(categories);
  }
  
  return formatMarkdown(categories, options.release, options.since);
}

const program = new Command();

program
  .name('changelog-gen')
  .description('Generate user-friendly changelogs from git commits')
  .version('1.0.0');

program
  .option('-s, --since <date>', 'Start date (YYYY-MM-DD) or "last-tag"')
  .option('-u, --until <date>', 'End date (YYYY-MM-DD)')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .option('-d, --dry-run', 'Show what would be generated without writing', false)
  .option('-f, --format <format>', 'Output format (markdown|json)', 'markdown')
  .option('-i, --include-internal', 'Include internal commits (chore, ci, etc.)', false)
  .option('-r, --release <version>', 'Release version number for the changelog')
  .action(async (options) => {
    try {
      if (!existsSync('.git')) {
        console.error('Error: Not a git repository. Run from project root.');
        process.exit(1);
      }
      
      const changelog = await generateChangelog(options);
      
      if (options.dryRun) {
        console.log('\n=== Generated Changelog (Dry Run) ===\n');
        console.log(changelog);
        console.log('\n=== End ===\n');
      } else if (options.output) {
        const outputPath = resolve(options.output);
        writeFileSync(outputPath, changelog);
        console.log(`Changelog written to ${outputPath}`);
      } else {
        console.log(changelog);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });

program.parse();