import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { ChangelogOptions, Commit } from './types';
import { getCommits, getLastTagSilent } from './git';
import { categorizeCommits, previewCategories, formatJSON, formatMarkdown, prependToChangelog } from './formatter';
import { detectVersionBump, incrementVersion, generateStats, formatStats } from './version';

function filterByScope(commits: Commit[], scopes: string[] | undefined): Commit[] {
  if (!scopes || scopes.length === 0) return commits;
  return commits.filter(c => !c.scope || scopes.includes(c.scope));
}

export async function generateChangelog(options: ChangelogOptions): Promise<{ content: string; breakingChanges: Commit[] }> {
  let commits = await getCommits(options.since, options.until, options.interactive);

  if (commits.length === 0) {
    if (options.interactive) {
      p.log.warn(color.yellow('No commits found in the specified range.'));
    }
    process.exit(0);
  }

  commits = filterByScope(commits, options.scopeFilter);

  const breakingChanges = commits.filter(c => c.breaking);
  const categories = categorizeCommits(commits, options.includeInternal);

  if (options.dryRun) {
    const stats = generateStats(commits, options.includeInternal);
    console.log(color.dim('─'.repeat(40)));
    console.log(color.bold('Dry Run Stats:'));
    console.log(formatStats(stats, options.includeInternal));
    console.log(color.dim('─'.repeat(40)));

    if (options.autoVersion) {
      const bump = detectVersionBump(commits);
      const lastTag = getLastTagSilent();
      if (lastTag) {
        const newVersion = incrementVersion(lastTag.replace(/^v/, ''), bump.type);
        console.log(`\n${color.bold('Suggested version:')} ${color.green('v' + newVersion)} (${bump.reason})`);
      }
    }
    console.log('');
  }

  if (options.interactive) {
    previewCategories(categories);
  }

  if (options.format === 'json') {
    return { content: formatJSON(categories), breakingChanges };
  }

  return { content: formatMarkdown(categories, options.release, options.since, breakingChanges), breakingChanges };
}

export async function run(options: ChangelogOptions) {
  try {
    const { content } = await generateChangelog(options);

    if (options.output) {
      const outputPath = resolve(options.output);
      const shouldPrepend = options.prepend && existsSync(outputPath);
      const contentToWrite = shouldPrepend
        ? prependToChangelog(content, outputPath)
        : content;

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
        p.outro(color.green('Done!'));
      } else {
        writeFileSync(outputPath, contentToWrite);
        console.log(color.green(`✓ Changelog ${shouldPrepend ? 'updated' : 'written'} to ${outputPath}`));
      }
    } else {
      console.log('\n' + content);
      if (options.interactive) {
        p.outro(color.green('Done!'));
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.interactive) {
      p.log.error(color.red(`Error: ${message}`));
      p.outro(color.red('Failed'));
    } else {
      console.error(color.red(`Error: ${message}`));
    }
    process.exit(1);
  }
}
