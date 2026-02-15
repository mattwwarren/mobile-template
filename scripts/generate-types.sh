#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SPEC_FILE="${PROJECT_DIR}/../specs/openapi.json"
OUTPUT_DIR="${PROJECT_DIR}/src/api/generated"
OUTPUT_FILE="${OUTPUT_DIR}/types.ts"

if [ ! -f "$SPEC_FILE" ]; then
  echo "OpenAPI spec not found at $SPEC_FILE"
  echo "Export it from fastapi-template first: ./scripts/export-openapi.sh"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Generating TypeScript types from OpenAPI spec..."
npx openapi-typescript "$SPEC_FILE" -o "$OUTPUT_FILE"
echo "Types generated at $OUTPUT_FILE"
