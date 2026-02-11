# Oh My Changeloggy

Generate user-friendly changelogs from git commits with an interactive terminal UI.

## Quick Start

```bash
# Interactive mode
npx oh-my-changeloggy

# CLI mode
changeloggy --since last-tag --release v1.0.0 -o CHANGELOG.md
```

## Features

- **Interactive TUI**: Beautiful prompts with [@clack/prompts](https://github.com/bombshell-dev/clack)
- **Conventional Commits**: Parses `feat:`, `fix:`, `refactor:`, etc.
- **Smart Filtering**: Hides internal commits (chores, tests, CI) by default
- **Update Existing**: `--prepend` flag adds new releases without losing history
- **Multiple Formats**: Markdown or JSON output

## Usage

### Interactive Mode

```bash
changeloggy
```

Guides you through selecting commits, format, and output options.

### CLI Mode

```bash
# Basic usage
changeloggy --since last-tag

# With version
changeloggy --since v1.0.0 --release v1.1.0 -o CHANGELOG.md

# Update existing changelog
changeloggy --since v1.1.0 --release v1.2.0 -o CHANGELOG.md --prepend

# Include all commits
changeloggy --since last-tag --include-internal

# JSON output
changeloggy --since last-tag --format json
```

## Commit Format

Supports conventional commits:

```
<type>(<scope>): <subject>

<body>

BREAKING CHANGE: <description>
```

Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `chore`, `ci`, `style`, `test`, `build`

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Test locally
./dist/index.js --since last-tag

# Link for local testing
npm link
changeloggy --help
```

## License

MIT