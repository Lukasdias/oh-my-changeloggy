import { readFileSync } from 'fs';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { Commit, CommitType } from './types';
import { COMMIT_TYPES, INTERNAL_TYPES } from './constants';

export function categorizeCommits(commits: Commit[], includeInternal: boolean): Map<CommitType, Commit[]> {
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

export function formatMarkdown(
  categories: Map<CommitType, Commit[]>,
  version?: string,
  since?: string,
  breakingChanges?: Commit[]
): string {
  const date = new Date().toISOString().split('T')[0];
  const versionStr = version || `Unreleased (${date})`;

  let output = `# Changelog\n\n`;
  output += `## ${versionStr}\n\n`;

  if (since) {
    output += `*Changes since ${since}*\n\n`;
  }

  if (breakingChanges && breakingChanges.length > 0) {
    output += `### ⚠️ Breaking Changes\n\n`;
    for (const commit of breakingChanges) {
      const scope = commit.scope ? `**${commit.scope}**: ` : '';
      output += `- ${scope}${commit.subject}\n`;
      if (commit.breaking && commit.breaking !== 'Breaking change') {
        output += `  - ${commit.breaking}\n`;
      }
    }
    output += '\n';
  }

  const typeOrder: CommitType[] = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'style', 'revert', 'other'];

  for (const type of typeOrder) {
    const commits = categories.get(type as CommitType);
    if (!commits || commits.length === 0) continue;

    const typeInfo = COMMIT_TYPES[type as CommitType];
    output += `### ${typeInfo.label}\n\n`;

    for (const commit of commits) {
      const scope = commit.scope ? `**${commit.scope}**: ` : '';
      output += `- ${scope}${commit.subject}\n`;

      if (commit.body) {
        const bodyLines = commit.body.split('\n').filter(line => line.trim() && !line.match(/^BREAKING[ -]CHANGE:/));
        if (bodyLines.length > 0) {
          output += `  - ${bodyLines[0]}\n`;
        }
      }
    }

    output += '\n';
  }

  return output;
}

export function formatJSON(categories: Map<CommitType, Commit[]>): string {
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

export function previewCategories(categories: Map<CommitType, Commit[]>): void {
  p.log.message('');
  p.log.step('Changelog Summary:');
  
  const typeOrder: CommitType[] = ['feat', 'fix', 'perf', 'refactor', 'docs', 'revert', 'other'];
  let totalCount = 0;
  
  for (const type of typeOrder) {
    const commits = categories.get(type as CommitType);
    if (!commits || commits.length === 0) continue;
    
    totalCount += commits.length;
    const typeInfo = COMMIT_TYPES[type as CommitType];
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

export function prependToChangelog(newContent: string, filePath: string): string {
  let existingContent = '';
  
  try {
    existingContent = readFileSync(filePath, 'utf-8');
  } catch {
    return newContent;
  }
  
  const contentWithoutHeader = newContent.replace(/^# Changelog\n\n/, '');
  
  const headerMatch = existingContent.match(/^# Changelog\n*/);
  if (headerMatch) {
    const headerEnd = headerMatch[0].length;
    return existingContent.slice(0, headerEnd) + contentWithoutHeader + existingContent.slice(headerEnd);
  }
  
  return newContent + '\n' + existingContent;
}
