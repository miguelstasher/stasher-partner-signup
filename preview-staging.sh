#!/bin/bash

# ─────────────────────────────────────────────
#  Stasher — Local Staging Preview
#  Run design changes locally before pushing
# ─────────────────────────────────────────────

CURRENT_BRANCH=$(git branch --show-current)

echo ""
echo "🔀  Switching to staging branch..."
git checkout staging

echo ""
echo "✅  You are now on: $(git branch --show-current)"
echo "🌐  Starting local preview at http://localhost:3000"
echo ""
echo "──────────────────────────────────────────"
echo "  Make your design changes freely here."
echo "  Nothing goes to GitHub until you merge."
echo "──────────────────────────────────────────"
echo ""
echo "  When happy with the design, run:"
echo "  ./promote-to-main.sh"
echo ""
echo "  To discard all staging changes, run:"
echo "  git checkout staging -- . && git reset --hard"
echo ""

npm run preview
