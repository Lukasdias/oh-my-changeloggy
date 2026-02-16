#!/bin/bash

set -e

cd "$(dirname "$0")/.."

if [ $# -eq 0 ]; then
  echo "Usage: bun release <patch|minor|major>"
  exit 1
fi

VERSION_TYPE=$1
FORCE=${2:-false}

current_version=$(node -p "require('./package.json').version")
echo "Current version: $current_version"

major=$(echo "$current_version" | cut -d. -f1)
minor=$(echo "$current_version" | cut -d. -f2)
patch=$(echo "$current_version" | cut -d. -f3)

case "$VERSION_TYPE" in
  patch)
    patch=$((patch + 1))
    ;;
  minor)
    minor=$((minor + 1))
    patch=0
    ;;
  major)
    major=$((major + 1))
    minor=0
    patch=0
    ;;
  *)
    echo "Invalid version type. Use: patch, minor, or major"
    exit 1
    ;;
esac

new_version="$major.$minor.$patch"
echo "Bumping to: $new_version"

sed -i "s/\"version\": \"$current_version\"/\"version\": \"$new_version\"/" package.json

git add package.json
git commit -m "chore: release v$new_version" || true

if git rev-parse "v$new_version" >/dev/null 2>&1; then
  if [ "$FORCE" = "--force" ] || [ "$FORCE" = "-f" ]; then
    echo "Tag v$new_version exists, deleting..."
    git tag -d "v$new_version"
  else
    echo "Tag v$new_version already exists. Use --force to recreate"
    exit 1
  fi
fi

git tag "v$new_version"

echo "Pushing to origin..."
git push origin main --tags

echo ""
echo "Released v$new_version"
echo "GitHub Actions will publish to npm"
