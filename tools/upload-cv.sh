#!/bin/sh
# Upload the public CV to the private bucket the build fetches it from.
# Usage: PRIVATE_ASSETS_BUCKET=<bucket> tools/upload-cv.sh ~/Documents/CVs/CV-I-2026-SWG-Web.pdf
set -eu

pdf="${1:?usage: upload-cv.sh <pdf>}"
: "${PRIVATE_ASSETS_BUCKET:?set PRIVATE_ASSETS_BUCKET (terraform output private_assets_bucket)}"

case "$pdf" in
  *-Web.pdf) ;;
  *)
    echo "upload-cv: expected the public Web CV (*-Web.pdf, no phone number), got $pdf" >&2
    exit 1
    ;;
esac

aws s3 cp "$pdf" "s3://$PRIVATE_ASSETS_BUCKET/cv/cv.pdf" --content-type application/pdf --only-show-errors
echo "upload-cv: uploaded $pdf"
