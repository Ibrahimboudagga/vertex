# Seed Sanity Sample Content

## Goal

Ensure the Sanity `production` dataset has realistic Vertex sample content for the catalog and cross-course search:

- a handful of instructors
- a handful of categories
- at least 10 courses
- modules inside each course
- lessons related to programming, development, AI, infrastructure, and adjacent technical learning topics

Keep relations consistent so a module is covered by its lessons, and a course is covered by its modules.

## Skills and docs read

- `AGENTS.md`
- `sanity-migration`
- `content-modeling-best-practices`
- Existing prompt `prompts/import-sanity-seed-data.md`

## Current context

- Sanity project ID is `2by6dxbo`.
- Dataset is `production`.
- Existing local seed file `app/studio/[[...tool]]/seed/seed.ndjson` contains:
  - 6 categories
  - 5 instructors
  - 120 lessons
  - 10 courses
  - 141 total documents
- The existing seed content has already been imported once into `production`.
- The user wrote “nurses”; based on the catalog/search context, this is assumed to mean “courses.”

## Decisions and assumptions

- First verify the current Sanity dataset counts and relationship consistency.
- Do not duplicate sample data if the imported seed already satisfies the requested count and topic coverage.
- If top-up content is needed, create deterministic NDJSON content locally under `migration/` and import it with the Sanity CLI.
- Use stable IDs for sample documents so reruns converge.
- Do not generate content that conflicts with existing imported documents.
- Keep modules embedded in courses and lessons as referenced documents.

## Requirements

- Use Sanity CLI or deterministic import files, not manual Studio clicking.
- Verify document counts after any import.
- Verify that course module lesson references resolve.
- Verify that lessons relate to their containing module topics.
- Do not add unrelated content outside Vertex learning topics.

## Acceptance criteria

- Dataset has at least:
  - 5 instructors
  - 5 categories
  - 10 courses
  - lessons referenced from course modules
- Every course has at least one module.
- Every module has at least one lesson reference.
- Lesson references resolve to existing lesson documents.
- Counts are reported from Sanity after verification/import.

## Checks to run

1. `npx sanity documents query` for type counts.
2. `npx sanity documents query` for courses with module and lesson counts.
3. `npx sanity documents query` for unresolved lesson references.
4. If content is imported, rerun count and relationship checks afterward.

## Manual test steps

1. Open `/studio`.
2. Confirm Courses, Lessons, Instructors, and Categories are populated.
3. Open several courses and confirm modules and lessons are coherent.
4. Use frontend catalog/search once available to confirm content appears.
