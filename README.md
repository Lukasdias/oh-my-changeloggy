# oh-my-changeloggy

Generate changelogs from git conventional commits.

## Install

```bash
# With Bun (recommended)
bun install -g oh-my-changeloggy

# With npm
npm install -g oh-my-changeloggy
```

## Usage

```bash
# Interactive
changeloggy

# CLI
changeloggy --since last-tag --release v1.0.0 -o CHANGELOG.md

# Prepend to existing
changeloggy --since v1.1.0 --release v1.2.0 -o CHANGELOG.md --prepend

# Include internal commits
changeloggy --since last-tag --include-internal

# JSON output
changeloggy --since last-tag --format json
```

## Output

**Markdown:**
```markdown
# Changelog

## v1.2.0 (2026-02-12)

### ✨ New Features

- **cli**: add --prepend flag for updating existing changelogs
- **core**: add support for conventional commit scopes

### 🐛 Bug Fixes

- add back registry-url for OIDC Trusted Publishing

### ♻️ Refactoring

- modularize source code into testable components
```

**JSON:**
```json
{
  "feat": [
    {
      "hash": "fa4e029",
      "subject": "add --prepend flag for updating existing changelogs",
      "scope": "cli",
      "author": "Lukasdias",
      "date": "2026-02-10"
    }
  ],
  "fix": [...]
}
```

## Commit Types

`feat`, `fix`, `refactor`, `perf`, `security`, `deps`, `docs`, `config`, `style`, `test`, `chore`, `ci`, `build`, `revert`

Internal types (chore, ci, style, test, build, deps, config) filtered by default.

## Development

```bash
bun install
bun run dev        # Run in development
bun run typecheck  # Type checking
bun run build      # Build to dist/
bun run test       # Run tests
```

## Release

```bash
bun run release patch   # 1.2.4 -> 1.2.5
bun run release minor   # 1.2.4 -> 1.3.0
bun run release major   # 1.2.4 -> 2.0.0
```

MIT