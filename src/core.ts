import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { ChangelogOptions } from './types';
import { getCommits } from './git';
import { categorizeCommits, previewCategories, formatJSON, formatMarkdown, prependToChangelog } from './formatter';

export async function generateChangelog(options: ChangelogOptions): Promise<string> {
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

export async function run(options: ChangelogOptions) {
  try {
    const changelog = await generateChangelog(options);
    
    if (options.output) {
      const outputPath = resolve(options.output);
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
