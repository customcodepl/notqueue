#!/usr/bin/env bash
# Post-deploy smoke check: $URL must answer 200. The fra1 assertion on
# x-vercel-id is added with /api/v1/health (F-FOUND-API): the static home page
# never reaches a function.
set -euo pipefail

for attempt in 1 2 3 4 5; do
  status=$(curl -sS -o /dev/null -w '%{http_code}' "$URL" || true)
  echo "Attempt ${attempt}: ${URL} → ${status}"
  [ "$status" = "200" ] && exit 0
  sleep 10
done

echo "Smoke check failed: ${URL} did not return 200" >&2
exit 1
