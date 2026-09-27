#!/usr/bin/env bash
# templatize.sh - Convert runnable mobile-template to copier template
#
# This script transforms the working React Native project into a Copier template.
#
# Usage:
#   ./scripts/templatize.sh [output_dir]
#
# Arguments:
#   output_dir - Target directory for templatized output (default: .templatized)
#
# Strategy:
# - Use .jinja suffix for files that need Jinja2 templating (config files, markdown)
# - Use __PLACEHOLDER__ syntax for TSX files (Jinja2 conflicts with JSX syntax)
# - _tasks.py replaces placeholders after copy

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Script directory (resolve symlinks)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Default output directory
OUTPUT_DIR="${1:-.templatized}"

# Convert to absolute path if relative
if [[ ! "${OUTPUT_DIR}" = /* ]]; then
    OUTPUT_DIR="${PROJECT_ROOT}/${OUTPUT_DIR}"
fi

echo -e "${GREEN}=== Mobile Template - Templatization Script ===${NC}"
echo "Source: ${PROJECT_ROOT}"
echo "Output: ${OUTPUT_DIR}"
echo ""

# Clean output directory if it exists
if [[ -d "${OUTPUT_DIR}" ]]; then
    echo -e "${YELLOW}Removing existing output directory...${NC}"
    rm -rf "${OUTPUT_DIR}"
fi

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Step 1: Copy project excluding dev artifacts
echo -e "${GREEN}[1/6] Copying project (excluding dev artifacts)...${NC}"

EXCLUDE_PATTERNS=(
    ".git"
    "node_modules"
    ".expo"
    "ios"
    "android"
    ".templatized"
    "package-lock.json"
    "coverage"
    ".DS_Store"
    "*.log"
    ".claude/cw-context.json*"
    # Template infrastructure files (not for generated projects)
    "scripts/templatize.sh"
    ".github/workflows/publish-template.yml"
    ".github/workflows/validate-template.yml"
    # Phase completion files
    "phase-*-complete.md"
)

# Build rsync exclude arguments
RSYNC_EXCLUDES=()
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    RSYNC_EXCLUDES+=("--exclude=${pattern}")
done

# Copy using rsync (preserves symlinks, permissions)
rsync -a "${RSYNC_EXCLUDES[@]}" "${PROJECT_ROOT}/" "${OUTPUT_DIR}/"

echo "  Copied $(find "${OUTPUT_DIR}" -type f | wc -l) files"

# Placeholder syntax for TSX files (avoids Jinja2 conflict with JSX)
PLACEHOLDER_NAME="__PROJECT_NAME__"

# Jinja2 syntax with hex codes to avoid brace interpretation in sed
SED_SLUG='\x7B\x7B project_slug \x7D\x7D'
SED_NAME='\x7B\x7B project_name \x7D\x7D'
SED_BUNDLE_ID='\x7B\x7B bundle_id \x7D\x7D'
SED_API_URL='\x7B\x7B api_url \x7D\x7D'

# Step 2: Replace references in config files that become .jinja templates
echo -e "${GREEN}[2/6] Templating config files (.jinja)...${NC}"

# package.json -> package.json.jinja
if [[ -f "${OUTPUT_DIR}/package.json" ]]; then
    sed -i "s/\"mobile-template\"/\"${SED_SLUG}\"/g" "${OUTPUT_DIR}/package.json"
    mv "${OUTPUT_DIR}/package.json" "${OUTPUT_DIR}/package.json.jinja"
    echo "  Templated: package.json -> package.json.jinja"
fi

# app.json -> app.json.jinja
if [[ -f "${OUTPUT_DIR}/app.json" ]]; then
    sed -i "s/\"Mobile Template\"/\"${SED_NAME}\"/g" "${OUTPUT_DIR}/app.json"
    sed -i "s/\"slug\": \"mobile-template\"/\"slug\": \"${SED_SLUG}\"/g" "${OUTPUT_DIR}/app.json"
    sed -i "s/\"scheme\": \"mobile-template\"/\"scheme\": \"${SED_SLUG}\"/g" "${OUTPUT_DIR}/app.json"
    mv "${OUTPUT_DIR}/app.json" "${OUTPUT_DIR}/app.json.jinja"
    echo "  Templated: app.json -> app.json.jinja"
fi

# .env.example -> .env.example.jinja
if [[ -f "${OUTPUT_DIR}/.env.example" ]]; then
    sed -i "s|EXPO_PUBLIC_API_URL=http://localhost:8000|EXPO_PUBLIC_API_URL=${SED_API_URL}|g" "${OUTPUT_DIR}/.env.example"
    sed -i "s|EXPO_PUBLIC_USE_MOCKS=true|EXPO_PUBLIC_USE_MOCKS={{ 'true' if use_mocks else 'false' }}|g" "${OUTPUT_DIR}/.env.example"
    mv "${OUTPUT_DIR}/.env.example" "${OUTPUT_DIR}/.env.example.jinja"
    echo "  Templated: .env.example -> .env.example.jinja"
fi

# Step 3: Replace references in TSX files with placeholders
echo -e "${GREEN}[3/6] Adding placeholders to TSX files...${NC}"

TSX_PLACEHOLDER_COUNT=0
while IFS= read -r -d '' file; do
    if grep -q "Mobile Template" "$file" 2>/dev/null; then
        sed -i "s/Mobile Template/${PLACEHOLDER_NAME}/g" "$file"
        ((TSX_PLACEHOLDER_COUNT++)) || true
        echo "  Updated: ${file#${OUTPUT_DIR}/} (placeholder)"
    fi
done < <(find "${OUTPUT_DIR}" -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "*/node_modules/*" -print0 2>/dev/null)

echo "  Added placeholders in ${TSX_PLACEHOLDER_COUNT} TSX/TS files"

# Step 4: Update markdown documentation
echo -e "${GREEN}[4/6] Templating markdown files (.jinja)...${NC}"

MD_COUNT=0
for mdfile in "${OUTPUT_DIR}"/*.md; do
    if [[ -f "$mdfile" ]]; then
        if grep -qE "mobile-template|Mobile Template" "$mdfile" 2>/dev/null; then
            sed -i "s/mobile-template/${SED_SLUG}/g" "$mdfile"
            sed -i "s/Mobile Template/${SED_NAME}/g" "$mdfile"
            mv "$mdfile" "${mdfile}.jinja"
            ((MD_COUNT++)) || true
            echo "  Templated: $(basename "$mdfile") -> $(basename "$mdfile").jinja"
        fi
    fi
done
echo "  Updated ${MD_COUNT} markdown files at root"

# Step 5: Verify output
echo -e "${GREEN}[5/6] Verifying output...${NC}"

# Check .jinja files exist
JINJA_COUNT=$(find "${OUTPUT_DIR}" -name "*.jinja" | wc -l)
echo "  Created ${JINJA_COUNT} .jinja template files"

# Check placeholders in source files
PLACEHOLDER_COUNT=$(grep -r "${PLACEHOLDER_NAME}" "${OUTPUT_DIR}" --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l || echo 0)
echo "  Added ${PLACEHOLDER_COUNT} placeholder references in source files"

# Verify copier.yaml preserved
if [[ -f "${OUTPUT_DIR}/copier.yaml" ]]; then
    echo "  Preserved: copier.yaml"
else
    echo -e "${RED}  ERROR: copier.yaml not found${NC}"
fi

# Verify _tasks.py preserved
if [[ -f "${OUTPUT_DIR}/_tasks.py" ]]; then
    echo "  Preserved: _tasks.py"
else
    echo -e "${RED}  ERROR: _tasks.py not found${NC}"
fi

# Step 6: Verify no remaining hardcoded references
echo -e "${GREEN}[6/6] Checking for remaining hardcoded references...${NC}"

# Search for remaining references in non-.jinja files
REMAINING_REFS=$(find "${OUTPUT_DIR}" -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
       -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" \
       -o -name "*.md" -o -name "*.html" -o -name "*.css" \
       -o -name ".env*" \) \
    -not -name "*.jinja" \
    -not -name "copier.yaml" \
    -not -path "*/.git/*" \
    -not -path "*/node_modules/*" \
    -exec grep -l -E "mobile-template|Mobile Template" {} \; 2>/dev/null || true)

if [[ -n "${REMAINING_REFS}" ]]; then
    echo -e "${RED}ERROR: Found remaining template references in:${NC}"
    echo "${REMAINING_REFS}" | while read -r file; do
        echo "  - ${file}"
        grep -n -E "mobile-template|Mobile Template" "$file" 2>/dev/null | head -3 | sed 's/^/      /'
    done
    echo ""
    echo -e "${YELLOW}These files may need to be added to templatize.sh${NC}"
    exit 1
else
    echo "  No remaining hardcoded references found"
fi

# Summary
echo ""
echo -e "${GREEN}=== Templatization Complete ===${NC}"
echo ""
echo "Output directory: ${OUTPUT_DIR}"
echo ""
echo "Directory structure:"
ls -la "${OUTPUT_DIR}/" | head -20

echo ""
echo "To test the template:"
echo "  copier copy ${OUTPUT_DIR} /tmp/test-mobile-project \\"
echo "    --data project_name=\"My App\" \\"
echo "    --data project_slug=\"my-app\" \\"
echo "    --data bundle_id=\"com.example.myapp\" \\"
echo "    --defaults --trust"
echo ""
echo "To verify the generated project:"
echo "  cd /tmp/test-mobile-project"
echo "  npm install"
echo "  npm run lint"
echo "  npm run typecheck"
echo "  npm test"
