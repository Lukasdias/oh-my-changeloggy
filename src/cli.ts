import { Command } from 'commander';
import { execSync } from 'child_process';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { run } from './core';
import { interactiveMode } from './ui';

function isGitRepo(): boolean {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

const program = new Command();

program
  .name('oh-my-changeloggy')
  .description('Generate changelogs from git conventional commits')
  .version('1.2.4');

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
      if (!isGitRepo()) {
        console.error(color.red('Error: Not a git repository.'));
        console.error(color.dim('Run this command from within a git repository.'));
        process.exit(1);
      }
      
      const useInteractive = options.interactive && !options.since && !options.output;
      
      if (useInteractive) {
        const interactiveOptions = await interactiveMode();
        await run(interactiveOptions);
      } else {
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
