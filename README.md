# oh-my-changeloggy

Generate changelogs from git conventional commits.

## Install

```bash
npx oh-my-changeloggy
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

`feat`, `fix`, `refactor`, `perf`, `docs`, `chore`, `ci`, `style`, `test`, `build`

Internal types (chore, ci, style, test, build) filtered by default.

## Dev

```bash
bun install
bun run build
./dist/index.js --since last-tag
```

MIT