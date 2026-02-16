#!/usr/bin/env bun

import { $ } from 'bun';

async function build() {
  console.log('Building oh-my-changeloggy...');

  const result = await Bun.build({
    entrypoints: ['./src/cli.ts'],
    outdir: './dist',
    target: 'node',
    minify: true,
    splitting: false,
  });

  if (!result.success) {
    console.error('Build failed:');
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  // Add shebang
  const fs = await import('fs');
  const cliPath = './dist/cli.js';
  const content = fs.readFileSync(cliPath, 'utf-8');
  fs.writeFileSync(cliPath, `#!/usr/bin/env node\n${content}`);
  
  await $`chmod +x ${cliPath}`;
  console.log('✓ Build complete');
}

build().catch(console.error);
