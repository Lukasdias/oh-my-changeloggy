# Changelog

## v1.2.0

*Changes since v1.1.0*

### ✨ New Features

- **cli**: add --prepend flag for updating existing changelogs
  - Allows appending new release notes to existing CHANGELOG.md
- **core**: add support for conventional commit scopes
  - Scopes like feat(api): are now parsed and displayed
- initial implementation of changelog-gen CLI
  - Parses conventional commits

### 🐛 Bug Fixes

- **cli**: resolve version flag conflict with commander
  - Changed --version to --release to avoid conflict

### 📚 Documentation

- update README with prepend documentation
- add comprehensive README with usage examples

## v1.1.0

*Changes since v1.0.0*

### ✨ New Features

- **core**: add support for conventional commit scopes
  - Scopes like feat(api): are now parsed and displayed
- initial implementation of changelog-gen CLI
  - Parses conventional commits

### 🐛 Bug Fixes

- **cli**: resolve version flag conflict with commander
  - Changed --version to --release to avoid conflict

### 📚 Documentation

- add comprehensive README with usage examples

