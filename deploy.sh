#!/bin/bash
# ──────────────────────────────────────────────────
#  WhatsRomance — Deploy to GitHub + Vercel
# ──────────────────────────────────────────────────
#
#  USAGE:
#    1. Create a GitHub Personal Access Token (PAT):
#       https://github.com/settings/tokens/new
#       Scopes needed: repo (full control)
#
#    2. Create a Vercel API Token:
#       https://vercel.com/account/tokens
#       Scope: Full Account
#
#    3. Run this script:
#       export GITHUB_TOKEN="ghp_your_github_token"
#       export VERCEL_TOKEN="your_vercel_api_token"
#       bash deploy.sh
#

set -e

# ── Config ──
GITHUB_REPO="lucasskopek/mensagens"
GITHUB_BRANCH="main"
VERCEL_PROJECT_ID="prj_9RobrZgwLZPzrcMzB066g5QuvFNG"

# ── Check tokens ──
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN not set. Get one at: https://github.com/settings/tokens/new"
  echo "   Required scopes: repo"
  exit 1
fi

if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ VERCEL_TOKEN not set. Get one at: https://vercel.com/account/tokens"
  exit 1
fi

echo "🚀 WhatsRomance Deploy Script"
echo "═════════════════════════════"

# ── Step 1: Push to GitHub ──
echo ""
echo "📤 Step 1: Pushing to GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
git push -u origin ${GITHUB_BRANCH} --force 2>&1
echo "✅ Pushed to https://github.com/${GITHUB_REPO}"

# ── Step 2: Trigger Vercel Deploy ──
echo ""
echo "🚀 Step 2: Triggering Vercel deployment..."

DEPLOY_RESPONSE=$(curl -s -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"mensagens\",
    \"projectId\": \"${VERCEL_PROJECT_ID}\",
    \"gitSource\": {
      \"type\": \"github\",
      \"repoId\": \"${GITHUB_REPO}\",
      \"ref\": \"${GITHUB_BRANCH}\"
    }
  }")

DEPLOY_ID=$(echo "$DEPLOY_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

if [ -z "$DEPLOY_ID" ]; then
  echo "⚠️  Could not trigger deploy via API. The project may auto-deploy from GitHub."
  echo "   Check: https://vercel.com/dashboard"
  echo "   Response: $DEPLOY_RESPONSE"
else
  echo "✅ Deployment triggered: $DEPLOY_ID"
  echo "   Monitor: https://vercel.com/dashboard"
fi

# ── Step 3: Reminder about environment variables ──
echo ""
echo "═════════════════════════════"
echo "📋 Don't forget to set these environment variables on Vercel:"
echo ""
echo "   DATABASE_URL      — PostgreSQL or Turso connection string"
echo "   TURSO_DATABASE_URL — (optional) If using Turso for cloud SQLite"
echo "   TURSO_AUTH_TOKEN   — (optional) Turso auth token"
echo "   WA_SERVICE_URL    — (optional) Baileys service URL (e.g., https://your-vps:3004)"
echo ""
echo "   Set them at: https://vercel.com/dashboard → Project → Settings → Environment Variables"
echo ""
echo "✨ Deploy script complete!"