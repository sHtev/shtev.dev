#!/bin/sh
# Put the public CV at site/public/cv.pdf (git-ignored) before a build.
# With PRIVATE_ASSETS_BUCKET set: download it from the private bucket.
# Otherwise: write a placeholder for local builds, or in CI only when ALLOW_PLACEHOLDER_CV=1
# (pull-request checks); a deploy without the real CV fails.
set -eu

out="$(cd "$(dirname "$0")/.." && pwd)/site/public/cv.pdf"

if [ -n "${PRIVATE_ASSETS_BUCKET:-}" ]; then
  aws s3 cp "s3://$PRIVATE_ASSETS_BUCKET/cv/cv.pdf" "$out" --only-show-errors
  echo "fetch-cv: downloaded cv.pdf"
elif [ -n "${CI:-}" ] && [ "${ALLOW_PLACEHOLDER_CV:-}" != "1" ]; then
  echo "fetch-cv: PRIVATE_ASSETS_BUCKET is not set" >&2
  exit 1
elif [ ! -f "$out" ]; then
  printf '%s\n' '%PDF-1.4' \
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj' \
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj' \
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj' \
    '4 0 obj << /Length 52 >> stream' \
    'BT /F1 24 Tf 72 760 Td (CV placeholder - local build) Tj ET' \
    'endstream endobj' \
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj' \
    'trailer << /Root 1 0 R >>' \
    '%%EOF' >"$out"
  echo "fetch-cv: wrote a placeholder cv.pdf (local build)"
fi
