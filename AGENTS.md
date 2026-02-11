# Agent Context

## Project Overview

This is `changelog-gen`, a CLI tool that generates changelogs from git commits.

## Architecture

```
src/
  index.ts          # Main entry point - CLI logic, git parsing, formatting
```

## Key Concepts

- **Conventional Commits**: Parses commit messages like `feat(api): add endpoint`
- **Commit Types**: feat, fix, refactor, perf, docs, chore, ci, style, test, build
- **Categories**: Groups commits by type with emoji headers
- **Scopes**: Optional scope in parentheses (e.g., `feat(cli): ...`)
- **Internal Types**: chore, ci, style, test, build - filtered by default

## File Formats

### Git Log Format
Uses special separators (\x1f and \x1e) to parse git log output reliably:
```
%H%x1f%s%x1f%b%x1f%an%x1f%ad%x1e
```

### Output Formats

**Markdown** (default):
```markdown
## v1.0.0

### ✨ New Features
- **scope**: description
```

**JSON**:
```json
{
  "feat": [{"hash": "abc123", "subject": "...", "scope": "api"}]
}
```

## Dependencies

- `@clack/prompts`: Interactive TUI prompts
- `commander`: CLI argument parsing
- `picocolors`: Terminal colors

## Build

Uses Bun for building:
```bash
bun build ./src/index.ts --outfile ./dist/index.js --target node
```

## Scripts

- `build`: Build the CLI
- `dev`: Run in development mode
- `test`: Run tests
- `prepublishOnly`: Build before publishing

## Common Tasks

### Adding a new commit type

1. Add to `CommitType` union type
2. Add to `COMMIT_TYPES` record with emoji and label
3. Optionally add to `INTERNAL_TYPES` if it should be filtered by default

### Modifying output format

Edit `formatMarkdown()` or `formatJSON()` functions in `src/index.ts`.

### Adding a new CLI option

1. Add `.option()` in the Command setup
2. Add to `ChangelogOptions` interface
3. Handle in `interactiveMode()` if interactive
4. Use in `run()` function