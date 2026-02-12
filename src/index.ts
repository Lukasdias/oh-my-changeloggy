import { Command } from 'commander';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import * as p from '@clack/prompts';
import color from 'picocolors';

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
  interactive: boolean;
  prepend: boolean;
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

function getLastTagSilent(): string | null {
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

async function getLastTagInteractive(): Promise<string | null> {
  const s = p.spinner();
  s.start('Checking for latest tag...');
  
  try {
    const result = execSync('git describe --tags --abbrev=0', { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const tag = result.trim();
    s.stop(`Found tag: ${color.cyan(tag)}`);
    return tag;
  } catch {
    s.stop(color.yellow('No tags found'));
    return null;
  }
}

async function getCommits(since?: string, until?: string, interactive = false): Promise<Commit[]> {
  const format = '%H%x1f%s%x1f%b%x1f%an%x1f%ad%x1e';
  let command = `git log --format="${format}" --date=short --no-merges`;
  
  if (since) {
    const lastTag = interactive ? await getLastTagInteractive() : getLastTagSilent();
    if (since === 'last-tag' && lastTag) {
      command += ` ${lastTag}..HEAD`;
    } else {
      command += ` --since="${since}"`;
    }
  }
  
  if (until) {
    command += ` --until="${until}"`;
  }
  
  const s = interactive ? p.spinner() : null;
  if (s) s.start('Analyzing git history...');
  
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    
    const commits = output
      .split('\x1e')
      .map(entry => entry.trim())
      .filter(entry => entry.length > 0)
      .map(entry => {
        const parts = entry.split('\x1f');
        const subject = parts[1]?.trim() || '';
        const parsed = parseConventionalCommit(subject);
        
        return {
          hash: parts[0]?.trim().substring(0, 7) || '',
          subject: parsed.description,
          body: parts[2]?.trim() || '',
          author: parts[3]?.trim() || '',
          date: parts[4]?.trim() || '',
          type: parsed.type,
          scope: parsed.scope,
        };
      });
    
    if (s) s.stop(`Found ${color.green(commits.length.toString())} commits`);
    return commits;
  } catch (error) {
    if (s) s.stop(color.red('Failed to read git history'));
    throw error;
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
  
  const typeOrder: CommitType[] = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'style', 'revert', 'other'];
  
  for (const type of typeOrder) {
    const commits = categories.get(type as CommitType);
    if (!commits || commits.length === 0) continue;
    
    const typeInfo = COMMIT_TYPES[type as CommitType];
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

function previewCategories(categories: Map<CommitType, Commit[]>): void {
  p.log.message('');
  p.log.step('Changelog Summary:');
  
  const typeOrder: CommitType[] = ['feat', 'fix', 'perf', 'refactor', 'docs', 'revert', 'other'];
  let totalCount = 0;
  
  for (const type of typeOrder) {
    const commits = categories.get(type);
    if (!commits || commits.length === 0) continue;
    
    totalCount += commits.length;
    const typeInfo = COMMIT_TYPES[type];
    const colorFn = type === 'feat' ? color.green : 
                   type === 'fix' ? color.yellow :
                   type === 'perf' ? color.cyan :
                   type === 'docs' ? color.blue :
                   color.gray;
    
    p.log.message(`  ${typeInfo.emoji} ${colorFn(typeInfo.label)}: ${commits.length}`);
  }
  
  p.log.message(`  ${color.dim('─'.repeat(30))}`);
  p.log.message(`  Total: ${color.bold(totalCount.toString())} changes`);
  p.log.message('');
}

async function interactiveMode(): Promise<ChangelogOptions> {
  p.intro(`${color.bgCyan(color.black(' oh-my-changeloggy '))}`);
  
  // Check git repo
  if (!existsSync('.git')) {
    p.log.error(color.red('Error: Not a git repository. Run from project root.'));
    process.exit(1);
  }
  
  const lastTag = await getLastTagInteractive();
  
  // Ask for range
  const rangeType = await p.select({
    message: 'Which commits to include?',
    options: [
      { value: 'last-tag', label: 'Since last tag', hint: lastTag ? lastTag : 'No tags found' },
      { value: 'date', label: 'Since specific date' },
      { value: 'all', label: 'All commits' },
    ],
  });
  
  if (p.isCancel(rangeType)) {
    p.outro(color.yellow('Cancelled'));
    process.exit(0);
  }
  
  let since: string | undefined;
  let until: string | undefined;
  
  if (rangeType === 'last-tag') {
    since = 'last-tag';
  } else if (rangeType === 'date') {
    since = await p.text({
      message: 'Enter start date (YYYY-MM-DD)',
      placeholder: '2024-01-01',
      validate: (value) => {
        if (!value) return 'Date is required';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Invalid date format';
      },
    }) as string;
    
    if (p.isCancel(since)) {
      p.outro(color.yellow('Cancelled'));
      process.exit(0);
    }
  }
  
  // Ask for options
  const includeInternal = await p.confirm({
    message: 'Include internal commits (chores, tests, CI)?',
    initialValue: false,
  });
  
  if (p.isCancel(includeInternal)) {
    p.outro(color.yellow('Cancelled'));
    process.exit(0);
  }
  
  const format = await p.select({
    message: 'Output format',
    options: [
      { value: 'markdown', label: 'Markdown' },
      { value: 'json', label: 'JSON' },
    ],
    initialValue: 'markdown',
  });
  
  if (p.isCancel(format)) {
    p.outro(color.yellow('Cancelled'));
    process.exit(0);
  }
  
  const shouldRelease = await p.confirm({
    message: 'Set a release version?',
    initialValue: false,
  });
  
  if (p.isCancel(shouldRelease)) {
    p.outro(color.yellow('Cancelled'));
    process.exit(0);
  }
  
  let release: string | undefined;
  if (shouldRelease) {
    release = await p.text({
      message: 'Enter version',
      placeholder: 'v1.0.0',
    }) as string;
    
    if (p.isCancel(release)) {
      p.outro(color.yellow('Cancelled'));
      process.exit(0);
    }
  }
  
  const shouldWrite = await p.confirm({
    message: 'Write to file?',
    initialValue: false,
  });
  
  if (p.isCancel(shouldWrite)) {
    p.outro(color.yellow('Cancelled'));
    process.exit(0);
  }
  
  let output: string | undefined;
  let prepend = false;
  
  if (shouldWrite) {
    output = await p.text({
      message: 'Output file path',
      placeholder: 'CHANGELOG.md',
      initialValue: 'CHANGELOG.md',
    }) as string;
    
    if (p.isCancel(output)) {
      p.outro(color.yellow('Cancelled'));
      process.exit(0);
    }
    
    // Ask about prepending if file exists
    if (existsSync(output)) {
      const shouldPrepend = await p.confirm({
        message: `File ${output} exists. Prepend new entries instead of overwriting?`,
        initialValue: true,
      });
      
      if (p.isCancel(shouldPrepend)) {
        p.outro(color.yellow('Cancelled'));
        process.exit(0);
      }
      
      prepend = shouldPrepend as boolean;
    }
  }
  
  return {
    since,
    until,
    output,
    dryRun: false,
    format: format as 'markdown' | 'json',
    includeInternal: includeInternal as boolean,
    release,
    interactive: true,
    prepend,
  };
}

async function generateChangelog(options: ChangelogOptions): Promise<string> {
  const commits = await getCommits(options.since, options.until, options.interactive);
  
  if (commits.length === 0) {
    if (options.interactive) {
      p.log.warn(color.yellow('No commits found in the specified range.'));
    }
    process.exit(0);
  }
  
  const categories = categorizeCommits(commits, options.includeInternal);
  
  if (options.interactive) {
    previewCategories(categories);
  }
  
  if (options.format === 'json') {
    return formatJSON(categories);
  }
  
  return formatMarkdown(categories, options.release, options.since);
}

function prependToChangelog(newContent: string, filePath: string): string {
  let existingContent = '';
  
  try {
    existingContent = readFileSync(filePath, 'utf-8');
  } catch {
    // File doesn't exist, will create new
    return newContent;
  }
  
  // Remove the "# Changelog" header from new content if it exists
  const contentWithoutHeader = newContent.replace(/^# Changelog\n\n/, '');
  
  // Find the position after "# Changelog" header in existing content
  const headerMatch = existingContent.match(/^# Changelog\n*/);
  if (headerMatch) {
    const headerEnd = headerMatch[0].length;
    return existingContent.slice(0, headerEnd) + contentWithoutHeader + existingContent.slice(headerEnd);
  }
  
  // If no header found, prepend new content
  return newContent + '\n' + existingContent;
}

async function run(options: ChangelogOptions) {
  try {
    const changelog = await generateChangelog(options);
    
    if (options.output) {
      const outputPath = resolve(options.output);
      
      // Handle prepend logic
      const shouldPrepend = options.prepend && existsSync(outputPath);
      const contentToWrite = shouldPrepend 
        ? prependToChangelog(changelog, outputPath)
        : changelog;
      
      if (options.interactive) {
        const s = p.spinner();
        if (shouldPrepend) {
          s.start(`Appending to existing ${color.cyan(outputPath)}...`);
        } else {
          s.start(`Writing to ${color.cyan(outputPath)}...`);
        }
        writeFileSync(outputPath, contentToWrite);
        s.stop(color.green(`✓ ${shouldPrepend ? 'Updated' : 'Written to'} ${outputPath}`));
        
        p.log.success('Changelog generated successfully!');
        p.log.info(color.dim(`Next steps: Review ${outputPath} and commit your changes`));
        p.outro(color.green('Done! 🎉'));
      } else {
        writeFileSync(outputPath, contentToWrite);
        console.log(color.green(`✓ Changelog ${shouldPrepend ? 'updated' : 'written'} to ${outputPath}`));
      }
    } else {
      console.log('\n' + changelog);
      if (options.interactive) {
        p.outro(color.green('Done! 🎉'));
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.interactive) {
      p.log.error(color.red(`Error: ${message}`));
      p.outro(color.red('Failed ❌'));
    } else {
      console.error(color.red(`Error: ${message}`));
    }
    process.exit(1);
  }
}

// Main CLI
const program = new Command();

program
  .name('oh-my-changeloggy')
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
  .option('-p, --prepend', 'Prepend to existing CHANGELOG.md instead of overwriting', false)
  .option('--no-interactive', 'Skip interactive prompts (use flags only)')
  .action(async (options) => {
    try {
      if (!existsSync('.git')) {
        p.log.error(color.red('Error: Not a git repository. Run from project root.'));
        process.exit(1);
      }
      
      // If no options provided, use interactive mode
      const useInteractive = options.interactive && !options.since && !options.output;
      
      if (useInteractive) {
        const interactiveOptions = await interactiveMode();
        await run(interactiveOptions);
      } else {
        // CLI mode - silent
        await run({
          ...options,
          interactive: false,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(color.red(`Error: ${message}`));
      process.exit(1);
    }
  });

program.parse();