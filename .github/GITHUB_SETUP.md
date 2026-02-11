# GitHub Setup Guide

## Automated (via Workflows)

I've created 3 workflows in `.github/workflows/`:

### 1. CI (`ci.yml`)
**Triggers:** Push/PR to main
- Runs tests on Node 18 & 20
- Builds the project
- Type checking

### 2. Deploy (`deploy.yml`) 
**Triggers:** Push to main (or manual)
- Checks if package.json version changed
- Builds and publishes to npm automatically
- Creates GitHub Release with auto-generated notes

### 3. Release (`release.yml`)
**Triggers:** Git tag push (e.g., `v1.2.0`)
- Generates changelog from commits since last tag
- Creates GitHub Release with changelog
- Attaches build artifacts
- Publishes to npm

## Manual Setup Required

### 1. Repository Secrets

Go to **Settings > Secrets and variables > Actions** and add:

**`NPM_TOKEN`**
1. Generate token at https://www.npmjs.com/settings/tokens
2. Select "Automation" token type
3. Copy token value
4. Add as repository secret

### 2. About Section (GitHub UI)

Go to your repo main page and click the ⚙️ gear icon next to "About":

**Suggested content:**
```
Generate beautiful changelogs from git commits with an interactive TUI
```

**Topics to add:**
- `changelog`
- `git`
- `cli`
- `conventional-commits`
- `release-notes`
- `tui`
- `developer-tools`
- `npm`
- `typescript`

**Website:** Leave empty or add your personal site

### 3. Releases Section

This will be automatically populated when you:
- Push a tag: `git tag v1.3.0 && git push origin v1.3.0`
- Or update version in package.json and push to main

The workflows will create releases with changelogs automatically!

## How to Release

### Option 1: Automatic (recommended)
1. Update `version` in `package.json` (e.g., `1.2.0` → `1.3.0`)
2. Commit: `git commit -m "chore: bump version to 1.3.0"`
3. Push to main: `git push origin main`
4. Workflow automatically publishes and creates release

### Option 2: Manual Tag
1. `git tag v1.3.0`
2. `git push origin v1.3.0`
3. Workflow creates release and publishes

### Option 3: GitHub UI
1. Go to **Releases > Draft a new release**
2. Create new tag: `v1.3.0`
3. Auto-generate release notes or write custom
4. Publish release
5. Workflow publishes to npm automatically

## Branch Protection (Optional but Recommended)

Go to **Settings > Branches > Add rule**:

**Branch name pattern:** `main`

**Enable:**
- [x] Require a pull request before merging
- [x] Require status checks to pass before merging
  - Status checks: `test`, `lint`
- [x] Require conversation resolution before merging
- [x] Include administrators

This ensures CI passes before merging to main.

## Social Preview (Optional)

Go to **Settings > Social preview > Edit**: Upload an image (1280×640px) for social media cards when sharing the repo.

## Quick Checklist

- [x] CI workflow created
- [x] Deploy workflow created  
- [x] Release workflow created
- [ ] Add NPM_TOKEN secret
- [ ] Set up About section
- [ ] Enable branch protection (optional)
- [ ] Push first version update to test deployment

Once you add the NPM_TOKEN secret, everything will work automatically!