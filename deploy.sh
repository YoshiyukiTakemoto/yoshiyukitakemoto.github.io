#!/bin/sh
# Build and publish dist/ to the gh-pages branch (GitHub Pages source).
set -e
cd "$(dirname "$0")"
node build.mjs
rev=$(git rev-parse --short HEAD)
tmp=$(mktemp -d)
cp -R dist/. "$tmp"
cd "$tmp"
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy $rev"
git push -q -f "$(git -C "$OLDPWD" remote get-url origin)" gh-pages
rm -rf "$tmp"
echo "Deployed $rev"
