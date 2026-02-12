import { execSync } from 'child_process';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { Commit, CommitType } from './types';
import { COMMIT_TYPES } from './constants';

export function parseConventionalCommit(subject: string): { type: CommitType; scope?: string; description: string } {
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

export function getLastTagSilent(): string | null {
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

export async function getLastTagInteractive(): Promise<string | null> {
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

export async function getCommits(since?: string, until?: string, interactive = false): Promise<Commit[]> {
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
