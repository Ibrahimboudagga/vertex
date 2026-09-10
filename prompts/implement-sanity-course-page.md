# Implement the Vertex Sanity-backed course page

## Goal

Build the Vertex course-detail route from `design/vertex-course.png`, wired to the existing seeded Sanity course, instructor, category, module, and lesson data. The reference image is the source of truth for the desktop design; make the same structure responsive for smaller screens.

## Skills and guidance reviewed

- `AGENTS.md`
- `sanity-best-practices`, including the Next.js and image guidance
- Next.js 16 App Router documentation for dynamic routes, `notFound`, and `generateStaticParams`

## Existing code and content inspected

- `app/page.tsx`, `app/globals.css`, and `app/components/design-system.tsx`
- `sanity/lib/data.ts`, `sanity/lib/queries.ts`, `sanity/lib/types.ts`, and `sanity/lib/image.ts`
- `sanity/schemaTypes/course.ts` and `sanity/schemaTypes/lesson.ts`
- `design/vertex-course.png`
- The production Sanity dataset. `nextjs-app-router-in-depth` has 4 modules and 12 lessons. It stores lesson durations as seconds, has no learning outcomes, and contains no `isPopular` value.

## Decisions and assumptions

- Create `/courses/[slug]` as an App Router server page. It will fetch a course only through the existing server-only Sanity data layer and return `notFound()` for an unknown slug.
- Use `generateStaticParams()` from the existing course-slug helper, with asynchronous `params`, following the installed Next.js 16 docs.
- Extend the course query/types only as required to calculate and display real module and lesson totals. Format the seeded numeric lesson durations into readable hours/minutes in the page. Do not alter the production dataset.
- Keep the reference layout: shared header, breadcrumbs, course hero, metadata/actions, learning-outcomes panel, course-content list, and sticky progress footer.
- Where the seed has no cover image, retain the reference’s graphic-card treatment as a presentation fallback. Where outcomes or popular status are absent, derive concise display items from module data or hide only the optional badge; never invent stored Sanity values.
- Use real links to `/courses/[slug]` and lesson URLs where data permits. Continue Learning, bookmark, module expansion, and progress display remain presentational because no progress/write route exists yet.
- Reuse the current design-system icons and existing global CSS patterns, adding only the icons/styles needed for the reference.
- Keep all Sanity tokens server-side. Do not expose tokens or write to Sanity.

## Expected files

- `app/courses/[slug]/page.tsx` (new)
- `app/globals.css`
- `app/components/design-system.tsx` if reference-specific icons are needed
- `sanity/lib/queries.ts` and `sanity/lib/types.ts` only if the page needs a safer data projection/type correction
- `prompts/implement-sanity-course-page.md` (this prompt)

## Requirements

- Match the supplied desktop reference’s hierarchy, spacing, colors, typography, borders, and sticky lower progress bar.
- Preserve sensible responsive behavior: stack the hero content, make outcome cards single-column, and allow the course-content rows to wrap gracefully.
- Render course title, summary, level, instructor/category when displayed, student count, module total, lesson total, modules, module summaries, and lesson data from Sanity.
- Render a compact initial portion of the curriculum with a client-side/presentational “Show all modules” control only if appropriate; no client-side data fetches.
- Use accessible headings, labels, buttons, and semantic links. Decorative icons must stay hidden from assistive technology.
- Do not alter seed files or Sanity documents.

## Security

- The page is read-only and uses the server-only Sanity fetch helper.
- No private Sanity or Clerk values may be sent to client components.

## Acceptance criteria

- `/courses/nextjs-app-router-in-depth` renders with current Sanity content and follows the supplied course-page design.
- The route has a proper 404 for nonexistent slugs.
- Module and lesson counts come from the course data, and total duration is calculated from the seeded lesson durations.
- The page works at desktop and narrow viewport widths.
- Type check, lint, and production build pass.

## Checks

1. `./node_modules/.bin/tsc.cmd --noEmit`
2. `npm run lint`
3. `npm run build`
4. Run `npm run dev` and open `/courses/nextjs-app-router-in-depth`.

## Manual test

1. Verify the breadcrumb returns to the course list/home surface.
2. Confirm that the title, description, curriculum, counts, and durations match the seeded Next.js course.
3. Confirm the course header and content panel visually follow `design/vertex-course.png`.
4. Visit `/courses/no-such-course` and confirm it renders the Next.js 404 page.
5. Reduce the browser width and confirm the hero, outcomes, and curriculum remain usable.
