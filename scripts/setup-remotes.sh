#!/usr/bin/env bash
#
# One-time setup so that a single `git push` sends every commit to BOTH
# the upstream repo and the team fork.
#
# Run once after cloning:
#   bash scripts/setup-remotes.sh
#
# After that, just use `git push` as normal — it goes to both.
set -euo pipefail

UPSTREAM="https://github.com/davre001/FluxPay"
FORK="https://github.com/Dami904/FluxPay"

# Fetch from upstream.
git remote set-url origin "$UPSTREAM"

# Clear any existing push URLs so this script is safe to re-run.
git config --unset-all remote.origin.pushurl 2>/dev/null || true

# Push to BOTH upstream and the fork.
git remote set-url --add --push origin "$UPSTREAM"
git remote set-url --add --push origin "$FORK"

echo "Done. 'origin' now pushes to:"
git remote get-url --push --all origin | sed 's/^/  - /'
echo
echo "From now on, a single 'git push' updates both repos."
