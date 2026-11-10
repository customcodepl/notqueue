#!/usr/bin/env bash
# Post-deploy smoke check: $URL/api/v1/health must answer 200 from fra1
# (ADR-0003) and report the deployed commit ($DEPLOY_SHA). Retries cover the
# moment right after the deploy, when the alias may still point elsewhere.
set -euo pipefail

endpoint="${URL}/api/v1/health"
expected_version="${DEPLOY_SHA:0:7}"
body_file=$(mktemp)

for attempt in 1 2 3 4 5; do
  status=$(curl -sS -o "$body_file" -w '%{http_code}' "$endpoint" || true)
  version=$(jq -r '.version // empty' "$body_file" 2>/dev/null || true)
  region=$(jq -r '.region // empty' "$body_file" 2>/dev/null || true)
  echo "Attempt ${attempt}: ${endpoint} → ${status}, version ${version:-?}, region ${region:-?}"
  if [ "$status" = "200" ] && [ "$version" = "$expected_version" ] && [ "$region" = "fra1" ]; then
    exit 0
  fi
  sleep 10
done

echo "Smoke check failed: expected 200, version ${expected_version} and region fra1" >&2
exit 1
