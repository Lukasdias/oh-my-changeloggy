import { existsSync, readFileSync } from 'fs';
import { ChangelogOptions } from './types';

export interface ConfigFile {
  since?: string;
  output?: string;
  format?: 'markdown' | 'json';
  includeInternal?: boolean;
  scopes?: string[];
}

export function loadConfig(): Partial<ChangelogOptions> {
  if (!existsSync('.changeloggy.json')) {
    return {};
  }

  try {
    const content = readFileSync('.changeloggy.json', 'utf-8');
    const config: ConfigFile = JSON.parse(content);

    return {
      since: config.since,
      output: config.output,
      format: config.format,
      includeInternal: config.includeInternal,
      scopeFilter: config.scopes,
    };
  } catch {
    return {};
  }
}

export function mergeWithConfig(options: Partial<ChangelogOptions>): ChangelogOptions {
  const config = loadConfig();

  return {
    dryRun: false,
    format: 'markdown',
    includeInternal: false,
    interactive: true,
    prepend: false,
    ...config,
    ...options,
  };
}
