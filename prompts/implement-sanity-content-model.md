# Implement Sanity Content Model and Data Layer

## Goal

Implement the Vertex Sanity content model and Studio setup for courses, embedded modules, lessons, instructors, and categories. Add the server-side read client and typed data layer needed by the Next.js app to read catalog, course, lesson, instructor, and category content.

## Skills and docs read

- `AGENTS.md`
- `sanity-best-practices`
- `sanity-best-practices/references/schema.md`
- `sanity-best-practices/references/nextjs.md`
- `content-modeling-best-practices`
- `content-modeling-best-practices/references/reference-vs-embedding.md`
- `content-modeling-best-practices/references/separation-of-concerns.md`

## Code inspected

- `package.json`
- `sanity.config.ts`
- `sanity.cli.ts`
- `sanity/env.ts`
- `sanity/schemaTypes/index.ts`
- `sanity/structure.ts`
- `sanity/lib/client.ts`
- `sanity/lib/live.ts`
- `sanity/lib/image.ts`
- `schemaTypes/index.ts`
- `app/layout.tsx`
- `app/studio/[[...tool]]/page.tsx`

## Current project shape

- Next.js app lives at the repo root.
- Sanity scaffold added an embedded Studio route at `app/studio/[[...tool]]/page.tsx`.
- Sanity project files currently live at the repo root and `sanity/`.
- `sanity/schemaTypes/index.ts` is empty.
- `next-sanity`, `sanity`, `@sanity/image-url`, and `@sanity/vision` are installed.
- The project guidance prefers a standalone Studio long-term, but the user has asked to implement the current Studio now.

## Decisions and assumptions

- Keep the current generated Studio route working at `/studio` for this step because it already exists and the user explicitly asked for Studio implementation.
- Model reusable content as documents:
  - `course`
  - `lesson`
  - `instructor`
  - `category`
- Model modules as embedded objects inside `course`, per `AGENTS.md`.
- Use lesson references inside each course module.
- Do not add video transcript documents, progress records, search config, Clerk-gated pages, or PostHog in this step.
- Keep fields semantic and content-centered, not presentation-centered.
- Use Sanity `defineType`, `defineField`, and `defineArrayMember`.
- Use Sanity icons from individual `@sanity/icons/*` subpaths.
- Use `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and `NEXT_PUBLIC_SANITY_API_VERSION` for public configuration.
- Use `SANITY_API_READ_TOKEN` only on the server for private dataset reads.
- Keep browser code from receiving the read token.

## Schema requirements

### Course document

- `title`
- `slug`
- `summary`
- `coverImage`
- `level`
- `price`
- `isPopular`
- `studentCount`
- `outcomes`
- `instructor` reference
- `category` reference
- `modules` embedded array

### Module object

- `title`
- `summary`
- `lessons` ordered lesson references

### Lesson document

- `title`
- `slug`
- `videoUrl`
- `thumbnail`
- `duration`
- `freePreview`
- `studentCount`
- `notes` Portable Text
- `keyPoints`
- `proTip`
- `resources`

### Instructor document

- `name`
- `slug`
- `photo`
- `expertise`
- `bio`

### Category document

- `title`
- `slug`
- `description`

## Studio requirements

- Register all schema types.
- Add a clear Studio structure grouped around Courses, Lessons, Instructors, and Categories.
- Add previews that show useful titles/subtitles/media.
- Keep the Vision plugin available.

## Data-layer requirements

- Add a server-only Sanity client module.
- Add a `sanityFetch` helper suitable for server reads.
- Add GROQ queries for:
  - all courses
  - course by slug
  - all course slugs
  - lesson by slug with reverse course/module context
  - all lesson slugs
  - instructor by slug
  - all instructor slugs
  - all categories
- Export useful TypeScript types for projected query results.
- Include `_key` in array projections.
- Do not return private tokens to the browser.

## Files expected to change

- `sanity/schemaTypes/index.ts`
- `sanity/schemaTypes/course.ts`
- `sanity/schemaTypes/lesson.ts`
- `sanity/schemaTypes/instructor.ts`
- `sanity/schemaTypes/category.ts`
- `sanity/schemaTypes/objects/courseModule.ts`
- `sanity/schemaTypes/objects/learningOutcome.ts`
- `sanity/schemaTypes/objects/resource.ts`
- `sanity/structure.ts`
- `sanity/lib/client.ts`
- `sanity/lib/live.ts`
- `sanity/lib/queries.ts`
- `sanity/lib/fetch.ts`
- `sanity/lib/types.ts`
- `.env.example`

## Security considerations

- Keep `SANITY_API_READ_TOKEN` server-only.
- Do not print or read `.env.local` contents.
- Public `NEXT_PUBLIC_SANITY_*` variables may be used for client-safe config.
- Any future content writes must happen through server code only.

## Acceptance criteria

- Studio can load with all requested schema types.
- Courses can embed ordered modules.
- Modules can reference ordered lessons.
- Lessons do not store their parent course.
- Course and lesson queries return the relationships needed by the app.
- Data fetching code is server-only where tokens are involved.
- Build and lint pass, aside from known unrelated reference warnings.

## Checks to run

1. `npm run lint`
2. `.\node_modules\.bin\tsc.cmd --noEmit`
3. `npm run build`
4. `npm run dev`
5. Open `http://localhost:3000/studio` and confirm the Studio route loads.

## Manual test steps

1. Open `/studio`.
2. Confirm document lists exist for Courses, Lessons, Instructors, and Categories.
3. Create a Category.
4. Create an Instructor.
5. Create a Lesson.
6. Create a Course with one Module referencing the Lesson.
7. Confirm the course preview displays title, level, instructor, and category context.
