#!/bin/bash
input=$(cat)
file=$(echo "$input" | jq -r '.file // .filePath // empty')

if [ -z "$file" ]; then
  echo '{ "additional_context": "" }'
  exit 0
fi

# Only trigger for source files, not test files
case "$file" in
  *__tests__*|*.test.ts|*.test.tsx)
    echo '{ "additional_context": "" }'
    exit 0
    ;;
esac

cd "$(dirname "$0")/../.." || exit 0
project="tv-guide-app"

context=""

# Determine which test suite to run based on the edited file
case "$file" in
  *server/*)
    result=$(cd "$project/server" && npx jest --no-coverage --silent 2>&1)
    rc=$?
    if [ $rc -ne 0 ]; then
      context="Server tests failed after your edit to $file. Fix the tests or the source code (see self-healing-tests rule):\n$result"
    fi
    ;;
  *src/*)
    result=$(cd "$project" && npx jest --no-coverage --silent 2>&1)
    rc=$?
    if [ $rc -ne 0 ]; then
      context="Frontend tests failed after your edit to $file. Fix the tests or the source code (see self-healing-tests rule):\n$result"
    fi
    ;;
esac

if [ -n "$context" ]; then
  json_context=$(printf '%s' "$context" | jq -Rs .)
  echo "{ \"additional_context\": $json_context }"
else
  echo '{ "additional_context": "" }'
fi
exit 0
