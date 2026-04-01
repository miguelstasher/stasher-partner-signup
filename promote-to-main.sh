#!/bin/bash

# ─────────────────────────────────────────────
#  Stasher — Promote Staging → Main
#  Run this when you're happy with the design
# ─────────────────────────────────────────────

echo ""
echo "🚀  Promoting staging changes to main..."
echo ""

# Make sure we're on staging
git checkout staging

# Show what's changed
echo "📋  Changes being promoted:"
git diff main --name-only
echo ""

read -p "Merge these changes to main and push to GitHub? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ]; then
  git checkout main
  git merge staging --no-edit
  echo ""
  echo "✅  Merged to main."
  read -p "Push to GitHub now? (y/n): " PUSH
  if [ "$PUSH" = "y" ]; then
    git push origin main
    echo "🎉  Live on GitHub!"
  else
    echo "👍  Kept local. Run 'git push origin main' when ready."
  fi
else
  echo "❌  Cancelled. Still on staging."
  git checkout staging
fi
