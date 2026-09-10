# Implement the Vertex lesson page

## Goal

Rebuild `app/lessons/[slug]/page.tsx` to reproduce `design/vertex-lesson.png` at desktop size and adapt it responsibly for smaller screens. The page must continue to use real, seeded Sanity content and play the lesson video on-page.

## Skills and documentation consulted

- `sanity-best-practices`: Next.js integration, GROQ projection, and Portable Text guidance.
- Next.js 16 local documentation: App Router dynamic routes, server/client component boundaries, and server data fetching.

## Code inspected

- `app/lessons/[slug]/page.tsx` already resolves lesson data server-side, validates the `start` query parameter, and converts supported YouTube URLs to privacy-enhanced embed URLs.
- `sanity/lib/data.ts`, `sanity/lib/queries.ts`, and `sanity/lib/types.ts` expose a server-only data layer, but the lesson query currently returns only a narrow module context.
- `sanity/schemaTypes/lesson.ts` and the existing seed data provide video URL, duration, notes Portable Text, key points, optional pro tip, resources, and ordered course modules with lesson references.
- `app/courses/components/course-modules.tsx`, `app/components/design-system.tsx`, and `app/globals.css` contain reusable course patterns and the page styling approach.

## Decisions and assumptions

- Keep the route public and retain the server-only Sanity fetch boundary; no Sanity token, write operation, or player credential reaches the browser.
- Expand the existing lesson GROQ projection to return the containing course's ordered modules, the active module/lesson indices, and adjacent lessons. Do not add a parent-course field to lesson documents.
- Use the stored module order and lesson reference order to derive all labels such as `Lesson 5.1`, sidebar numbering, previous lesson, and next lesson.
- Keep the existing YouTube privacy-enhanced iframe and the safe integer `start` parameter. Unsupported or malformed providers retain the existing graceful unavailable-player state.
- Render Sanity `notes` through `PortableText`; the Lesson Content tab is active initially, while Notes is a presentational tab state as specified by the product brief.
- Build the sidebar/module interactions in a small client component only where browser state is required. Keep all content querying and primary page rendering in the server page.
- Use the seeded lesson's first Portable Text paragraph as the short main-page overview, where available. Never invent a lesson summary.
- Use stored data only for duration, level, student count, resources, course cover, and lesson list. Progress/completion marks remain presentational because the current project has no progress write/read route.
- Do not modify the supplied image or seed files.

## Files expected to change

- `app/lessons/[slug]/page.tsx`
- `app/lessons/[slug]/lesson-player.tsx` (new, only if client-side tabs/bookmark UI requires it)
- `app/lessons/[slug]/lesson-sidebar.tsx` (new client component for collapsible course modules)
- `app/lessons/[slug]/lesson-resource-link.tsx` (only if required for the revised resource card UI)
- `sanity/lib/queries.ts`
- `sanity/lib/types.ts`
- `app/components/design-system.tsx`
- `app/globals.css`

## Requirements

1. Match the reference's desktop structure: global header, persistent course sidebar, breadcrumb, lesson badge/title/meta, bookmark control, video region, two content tabs, overview/key points/pro tip, resources, and sticky previous/next lesson navigation.
2. Make sidebar module rows expandable, with the active lesson visibly highlighted and direct links to all seeded lessons.
3. Wire previous and next controls to real adjacent seeded lessons, disabling or hiding a direction when an adjacent lesson does not exist.
4. Retain accessible semantics: labelled navigation regions, buttons with `aria-expanded`/`aria-controls`, iframe title, visible keyboard focus, and no keyboard-only interaction traps.
5. Render notes safely as Portable Text; external resources must keep `target="_blank"` and `rel="noreferrer"`.
6. Preserve responsive behaviour: below the desktop breakpoint, stack/hide the sidebar sensibly, maintain a usable player aspect ratio, and make bottom navigation fit mobile widths.
7. Avoid unrelated schema, seed, authentication, analytics, Studio, or GitHub changes.

## Security considerations

- All Sanity requests remain in server-only modules.
- Validate player URLs before producing iframe URLs and only use the established YouTube no-cookie embed origin.
- Continue validating `start` as a non-negative safe integer.
- Never interpolate untrusted values into GROQ; retain parameterized query values.
- Keep external resource links isolated with `rel="noreferrer"`.

## Acceptance criteria

- Opening any valid `/lessons/<seeded-slug>` renders the matching seeded lesson in the reference-inspired layout.
- The video appears in an in-page YouTube embed for seeded YouTube URLs and honours `?start=<seconds>`.
- The sidebar identifies the active lesson and links to every course lesson.
- Main content, key points, optional pro tip, and resource cards are all driven by Sanity data.
- Previous/next controls use real adjacent lesson links.
- The route is responsive, type checks, lints, and completes a production build.

## Checks to run

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`
4. Run `npm run dev` and inspect one seeded lesson route at desktop and mobile widths.

## Manual test steps

1. Open a seeded lesson from a course's Course Content accordion.
2. Confirm the title, badge, duration, course/module hierarchy, cover, and lesson list are loaded from Sanity.
3. Play the embedded video and open the same route with `?start=60` to verify seek behaviour.
4. Expand another sidebar module and select a different lesson.
5. Switch between Lesson Content and Notes, then use previous/next navigation.
6. Check keyboard focus, sidebar visibility, and bottom navigation at narrow width.
