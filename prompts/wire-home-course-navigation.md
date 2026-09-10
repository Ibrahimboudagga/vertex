# Wire home-page course navigation to the seeded catalog

## Goal

Make the home-page `All Courses` section fully navigable: its `View all courses` action must open the complete seeded course catalog, and each visible course card must open the matching course-detail route.

## Skills and guidance reviewed

- `AGENTS.md`
- `sanity-best-practices`
- Next.js 16 App Router page conventions

## Existing code inspected

- `app/page.tsx` already links its header navigation, hero CTA, and `View all courses` link to `/courses`, but its three visible course cards are static mock objects and are not links.
- `app/courses/page.tsx` is the server-rendered seeded Sanity catalog. Every card links to `/courses/[slug]`.
- `sanity/lib/data.ts` exposes the server-only `getAllCourses()` helper. The listing projection includes course slugs, cover images, levels, module counts, and duration seconds.
- The supplied screenshot is the home-page all-courses section and is the layout source of truth.

## Decisions and assumptions

- Convert the homepage to an async server component and fetch the first three courses from the existing server-only data helper.
- Preserve the attached three-card geometry and render all content from real Sanity fields rather than static mock objects.
- Make the full card surface a semantic link to `/courses/[slug]` and retain the existing `/courses` `View all courses` link.
- Reuse the same duration formatter and optimized Sanity cover image pattern used in the catalog, with an initials fallback when an image is unavailable.
- Do not add client-side fetching, expose tokens, change Sanity data, or alter the separate full catalog route.

## Expected files

- `app/page.tsx`
- `app/globals.css` only for focus/link styling if required
- `prompts/wire-home-course-navigation.md` (this prompt)

## Requirements

- The header Courses link, hero Explore Courses CTA, and View all courses link lead to `/courses`.
- Every visible home course card leads to its real `/courses/[slug]` destination.
- Use three courses from seeded Sanity content and data-derived metadata.
- Preserve the screenshot’s desktop layout and responsive behavior.
- Keep the read token server-only.

## Acceptance criteria

- A learner can reach the full catalog from the highlighted home-page link.
- A learner can open an individual course by clicking any visible home course card.
- The homepage has no static `courses` mock array.
- Type check, lint, and production build pass.

## Checks

1. `./node_modules/.bin/tsc.cmd --noEmit`
2. `npm run lint`
3. `npm run build`
4. Open `/`, activate `View all courses`, and activate a visible course card.
