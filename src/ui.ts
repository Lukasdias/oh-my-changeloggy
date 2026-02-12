import { existsSync } from 'fs';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { ChangelogOptions } from './types';
import { getLastTagInteractive } from './git';

export async function interactiveMode(): Promise<ChangelogOptions> {
  p.intro(`${color.bgCyan(color.black(' oh-my-changeloggy '))}`);
  
  if (!existsSync('.git')) {
    p.log.error(color.red('Error: Not a git repository. Run from project root.'));
    process.exit(1);
  }
  
  const lastTag = await getLastTagInteractive();
  
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
