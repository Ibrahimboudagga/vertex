# Implement expandable course content and in-site lesson playback

## Goal

Make the Course Content module rows interactive so a learner can expand a module, see its seeded lessons, open a lesson, and watch that lesson’s seeded YouTube video inside Vertex.

## Skills and guidance reviewed

- `AGENTS.md`
- `sanity-best-practices`, including its Next.js integration guidance and video-hosting guidance
- Next.js 16 documentation for dynamic routes, page conventions, static params, and `notFound`

## Existing code and data inspected

- `app/courses/[slug]/page.tsx` renders module rows as non-interactive articles. Its chevron is purely decorative and no lesson routes exist.
- `sanity/lib/data.ts` provides server-only helpers for a lesson by slug and all lesson slugs.
- `sanity/lib/queries.ts` already projects lesson video URL, notes, key points, resources, and reverse course context.
- The production seed has 120 lesson documents. Their video URLs are YouTube watch URLs, for example `https://www.youtube.com/watch?v=GErEgIOMy_4`.
- The supplied screenshot establishes the course-content row layout.

## Decisions and assumptions

- Create a small client-only module accordion component. It receives already-fetched module/lesson data as props, owns only open/closed UI state, and makes no browser fetches or writes.
- Replace course-page module rows with the accordion. Each module remains visually consistent with the supplied rows; when open, it reveals ordered lesson links and their durations.
- Add `/lessons/[slug]` as an App Router server page, generated from the existing lesson slugs and using `notFound()` for invalid routes.
- Convert the seeded YouTube watch URL to a privacy-enhanced YouTube embed URL. Render the provider iframe inside Vertex and support an optional non-negative `?start=<seconds>` query parameter for seekable entries.
- The current seed is YouTube-only. Do not claim Vimeo or Bunny support; show an honest unavailable-player state if a future record has an unsupported URL.
- Render real lesson title, course context, module context, duration, key points, optional pro tip, and resource links from Sanity. Do not add progress writes, analytics, or a custom media player.
- Keep the Sanity read client server-only and do not expose any token to the accordion or embed.

## Expected files

- `app/courses/components/course-modules.tsx` (new client accordion)
- `app/courses/[slug]/page.tsx`
- `app/lessons/[slug]/page.tsx` (new)
- `app/globals.css`
- `prompts/implement-expandable-course-content-and-lessons.md` (this prompt)

## Requirements

- Clicking or keyboard-activating a module toggles its lesson list.
- Every revealed lesson is a link to `/lessons/[lesson-slug]`.
- The lesson page plays seeded YouTube videos through an accessible in-site iframe with a descriptive title.
- The start query is validated as a non-negative integer before it is used in the embed URL.
- Preserve the existing course-page desktop style and make expanded rows/lesson page responsive.
- Do not modify seed files or production Sanity documents.

## Security

- Data is fetched exclusively in server components through existing server-only functions.
- The client accordion receives only serializable display data.
- No browser-side Sanity request, Sanity token, or content/progress write is added.

## Acceptance criteria

- Course modules expand to show their real lessons.
- Every lesson opens a real `/lessons/[slug]` route.
- Seeded YouTube video plays inside Vertex.
- Invalid lesson slugs produce a 404.
- Type check, lint, production build, and browser navigation checks pass.

## Checks

1. `./node_modules/.bin/tsc.cmd --noEmit`
2. `npm run lint`
3. `npm run build`
4. Open a course, expand a module, open a lesson, and confirm the video iframe appears.
5. Open `/lessons/no-such-lesson` and confirm the 404 page.
