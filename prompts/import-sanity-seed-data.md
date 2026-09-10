# Import Sanity Seed Data

## Goal

Seed the Sanity `production` dataset for Vertex using the provided seed files:

- `app/studio/[[...tool]]/seed/seed.ndjson`
- `app/studio/[[...tool]]/seed/videos.json`

Do not generate new content and do not modify either seed file.

## Skills and docs read

- `AGENTS.md`
- `sanity-migration`
- `sanity-migration/references/general.md`

## Current context

- Sanity project ID is `2by6dxbo`.
- Dataset is `production`.
- The Studio schema for course, module, lesson, instructor, and category has already been implemented.
- Both seed files exist at the supplied paths.
- The requested import path is the Sanity CLI.

## Decisions and assumptions

- Import `seed.ndjson` with `npx sanity dataset import`.
- Treat `videos.json` as a provided support file to inspect and count, but do not transform or import it unless it is already in Sanity import-compatible format.
- If `videos.json` contains video documents that are not import-compatible NDJSON, report that plainly and do not generate replacement content.
- Use the current `sanity.cli.ts` config and environment, which point to project `2by6dxbo` and dataset `production`.
- Do not print environment secrets.
- Do not modify the seed files.

## Requirements

- Use Sanity CLI import.
- Import only the provided data.
- Verify document counts afterward.
- Report counts by relevant document type.
- Do not use generated content.
- Do not edit the seed files.

## Commands expected

1. Inspect file metadata and light shape/counts without modifying files.
2. Run `npx sanity dataset import "app/studio/[[...tool]]/seed/seed.ndjson" production --replace`.
3. Verify document counts with `npx sanity documents query`.
4. Inspect `videos.json` shape and report whether it can be imported directly.
5. If videos are import-compatible and user has approved importing them, import via Sanity CLI.

## Acceptance criteria

- Sanity CLI import completes successfully for `seed.ndjson`.
- Post-import counts are reported.
- Seed files remain unchanged.
- Any issue with `videos.json` importability is documented instead of worked around by generating content.

## Safety notes

- `--replace` is idempotent for documents with matching IDs, but it can overwrite documents with the same IDs in the target dataset.
- This writes to the Sanity `production` dataset.
- No local seed file edits are allowed.
