# Implement the Vertex Sanity-backed course catalog

## Goal

Create the `/courses` catalog page using the attached three-card UI as the visual reference. Wire every card to the existing seeded Sanity courses and link each card to its existing `/courses/[slug]` detail page.

## Skills and guidance reviewed

- `AGENTS.md`
- `sanity-best-practices`, including its Next.js integration guidance
- Next.js 16 App Router page conventions

## Existing code and data inspected

- `app/page.tsx` currently contains static mock course cards in the home-page course section.
- `app/courses/[slug]/page.tsx` is the existing Sanity-backed detail route.
- `sanity/lib/data.ts`, `sanity/lib/queries.ts`, and `sanity/lib/types.ts` already expose a server-only `getAllCourses()` helper and `CourseListItem` type.
- `app/components/design-system.tsx` provides the existing header/card metadata icons.
- The production dataset has ten seeded course documents with title, summary, level, student count, cover image, module count, and lesson count fields.
- The attached reference defines a bordered three-column card layout with cover/logo artwork, serif title, summary, divider, and level/duration/module metadata.

## Decisions and assumptions

- Add a static server-rendered `/courses` route rather than replacing the homepage hero.
- Fetch only through the existing server-only Sanity data layer. Extend the listing projection/type narrowly if it needs lesson duration values to calculate a real course duration.
- Render all seeded courses in the same three-column layout; the screenshot’s first three visible cards establish the desktop geometry. Remaining course cards appear below.
- Use the Sanity cover image as the card artwork when it exists, optimized through the existing image helper and Next Image. For a missing image, retain a small data-derived initials fallback without changing Sanity content.
- Keep the shared Vertex header visual treatment and update the homepage and header course links to `/courses` where those links currently only target the home anchor.
- Make each card a semantic link to `/courses/[slug]`. The catalog remains public and read-only.
- Match the reference’s desktop spacing, borders, type scale, card proportions, and metadata divider. On narrow screens, collapse the grid to one column.

## Expected files

- `app/courses/page.tsx` (new)
- `app/page.tsx` (links and static mock-card removal/reuse only as needed)
- `app/globals.css`
- `sanity/lib/queries.ts` and `sanity/lib/types.ts` only if the listing projection needs duration data
- `prompts/implement-sanity-course-catalog.md` (this prompt)

## Requirements

- All card text, counts, durations, images, and destination slugs come from Sanity-derived data.
- The desktop grid has three equal cards and follows the supplied reference exactly.
- Format stored duration seconds as human-readable hours/minutes.
- Maintain accessible card links, meaningful image alt text, and decorative icon accessibility behavior.
- Do not expose Sanity tokens, alter the seed files, or write to the production dataset.

## Acceptance criteria

- `/courses` shows the seeded course catalog with working links to existing course detail pages.
- There are no static course objects powering the catalog.
- Cards match the attached UI and remain usable on mobile.
- Type check, lint, and production build pass.

## Checks

1. `./node_modules/.bin/tsc.cmd --noEmit`
2. `npm run lint`
3. `npm run build`
4. Start the dev server and open `/courses` and one course card destination.

## Manual test

1. Open `/courses` and confirm the cards use live seeded titles, summaries, level, duration, module count, and student count.
2. Click a card and confirm it reaches that course’s `/courses/[slug]` page.
3. Compare the first desktop row with the attached card reference.
4. Narrow the browser and confirm that cards stack without clipped metadata.
