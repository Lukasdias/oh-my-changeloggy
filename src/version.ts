import { Commit, CommitType } from './types';

export interface VersionBump {
  type: 'major' | 'minor' | 'patch';
  reason: string;
}

export function detectVersionBump(commits: Commit[]): VersionBump {
  let hasBreaking = false;
  let hasFeat = false;
  let hasFix = false;

  for (const commit of commits) {
    if (commit.breaking) {
      hasBreaking = true;
    } else if (commit.type === 'feat') {
      hasFeat = true;
    } else if (commit.type === 'fix') {
      hasFix = true;
    }
  }

  if (hasBreaking) {
    return {
      type: 'major',
      reason: 'Breaking changes detected',
    };
  }

  if (hasFeat) {
    return {
      type: 'minor',
      reason: 'New features detected',
    };
  }

  if (hasFix) {
    return {
      type: 'patch',
      reason: 'Bug fixes detected',
    };
  }

  return {
    type: 'patch',
    reason: 'Maintenance changes',
  };
}

export function incrementVersion(currentVersion: string, bumpType: 'major' | 'minor' | 'patch'): string {
  const match = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)(-.*)?$/);
  if (!match) return currentVersion;

  let [, major, minor, patch, prerelease] = match;
  let m = parseInt(major, 10);
  let n = parseInt(minor, 10);
  let p = parseInt(patch, 10);

  switch (bumpType) {
    case 'major':
      m++;
      n = 0;
      p = 0;
      break;
    case 'minor':
      n++;
      p = 0;
      break;
    case 'patch':
      p++;
      break;
  }

  return `${m}.${n}.${p}${prerelease || ''}`;
}

export interface ChangelogStats {
  total: number;
  breaking: number;
  feat: number;
  fix: number;
  internal: number;
  other: number;
}

export function generateStats(commits: Commit[], includeInternal: boolean): ChangelogStats {
  const internalTypes: CommitType[] = ['chore', 'ci', 'style', 'test', 'build', 'deps', 'config'];

  return {
    total: commits.length,
    breaking: commits.filter(c => c.breaking).length,
    feat: commits.filter(c => c.type === 'feat').length,
    fix: commits.filter(c => c.type === 'fix').length,
    internal: commits.filter(c => internalTypes.includes(c.type)).length,
    other: commits.filter(c => !['feat', 'fix'].includes(c.type) && !internalTypes.includes(c.type)).length,
  };
}

export function formatStats(stats: ChangelogStats, includeInternal: boolean): string {
  const parts = [
    `${stats.total} commits`,
    stats.breaking > 0 ? `${stats.breaking} breaking` : null,
    stats.feat > 0 ? `${stats.feat} feat` : null,
    stats.fix > 0 ? `${stats.fix} fix` : null,
  ].filter(Boolean);

  if (includeInternal && stats.internal > 0) {
    parts.push(`${stats.internal} internal`);
  } else if (!includeInternal && stats.internal > 0) {
    parts.push(`${stats.internal} internal (filtered)`);
  }

  return parts.join(', ');
}
