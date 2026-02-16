# Changelog

## v1.3.0

*Changes since v1.0.0*

### ⚠️ Breaking Changes

- add unit tests for commit parsing
  - commit format now requires colon after type

### ✨ New Features

- enhance changelog generation with new CLI options and configuration support
- update README and CLI to enhance commit types and improve git repository validation
- enhance CLI with interactive options and improve build process
- add package-lock.json for dependency management
- rename project to "Oh My Changeloggy" and update references in documentation and package.json
- enhance README and add AGENTS.md for improved documentation
  - - Updated README with interactive usage instructions and new features.
- **cli**: add --prepend flag for updating existing changelogs
  - Allows appending new release notes to existing CHANGELOG.md
- **core**: add support for conventional commit scopes
  - Scopes like feat(api): are now parsed and displayed
- initial implementation of changelog-gen CLI
  - Parses conventional commits

### 🐛 Bug Fixes

- add back registry-url for OIDC Trusted Publishing
- update workflow for OIDC Trusted Publishing and fix repo URLs
- force OIDC/Trusted Publishing by unsetting NODE_AUTH_TOKEN
- bump version to 1.2.1 with shebang fix
  - - Fix CLI command not working due to missing shebang
- add shebang to built file and fix CI test execution
  - - Update build script to add shebang and make file executable
- update repository URLs to reflect project rename
- **cli**: resolve version flag conflict with commander
  - Changed --version to --release to avoid conflict

### ♻️ Refactoring

- modularize source code into testable components

### 📚 Documentation

- update README for clarity and consistency in usage instructions
- update README with prepend documentation
- add comprehensive README with usage examples

