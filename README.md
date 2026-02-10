# Changelog Generator

Generate user-friendly changelogs from git commits. Automatically categorizes changes and transforms technical commits into clear release notes.

## Installation

```bash
bun install
bun run build
npm link  # Makes it globally available as 'changelog-gen'
```

## Usage

```bash
# Generate changelog since last tag
changelog-gen --since last-tag

# Generate changelog for specific date range
changelog-gen --since 2024-01-01 --until 2024-01-31

# Output to file
changelog-gen --since last-tag --output CHANGELOG.md

# Preview without writing
changelog-gen --since last-tag --dry-run

# Include internal commits (chores, CI, etc.)
changelog-gen --since last-tag --include-internal

# Generate JSON output
changelog-gen --since last-tag --format json

# Specify version
changelog-gen --since last-tag --release "v2.5.0"
```

## Features

- Parses conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
- Categorizes changes by type (features, fixes, performance, etc.)
- Filters out internal commits (chores, tests, style changes) by default
- Supports custom date ranges or "last-tag" shorthand
- Outputs Markdown or JSON
- Handles breaking changes detection
- Scope support for monorepos (`feat(api): add endpoint`)

## Commit Format

Uses conventional commits:

```
<type>(<scope>): <subject>

<body>

BREAKING CHANGE: <description>
```

Types:
- `feat`: New features ✨
- `fix`: Bug fixes 🐛
- `refactor`: Code refactoring ♻️
- `perf`: Performance improvements ⚡
- `docs`: Documentation 📚
- `chore`, `ci`, `style`, `test`: Internal (filtered by default)

## License

MIT