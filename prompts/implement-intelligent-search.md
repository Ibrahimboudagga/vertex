# Implement intelligent course search

## Goal

Add Vertex's intelligent, grounded search experience: a full search-results page that accepts a learner's plain-language query, calls a server-only Next.js API, connects that API to the Sanity Context MCP and the supplied OpenRouter model through the Vercel AI SDK, and renders ranked lesson and video-moment result cards that link directly to the appropriate lesson (and timestamp when available).

## Guidance read

- `AGENTS.md`
- `create-agent-with-sanity-context` — Context MCP endpoint, authentication, initial context, tool discovery, and Studio prerequisites.
- `dial-your-context` — concise Context instructions and a restricted GROQ filter.
- `shape-your-agent` — a small, behavioral system prompt that never invents content.
- `sanity-best-practices` (including GROQ and Next.js references) — projected, typed GROQ, reverse references, server-only Sanity clients, and query safety.
- Current local Next.js 16 guides for route handlers, server/client boundaries, and data fetching.

## Existing code and data inspected

- This is a Next.js 16 App Router application with an embedded Sanity Studio at `/studio`.
- `sanity/lib/client.ts` and `sanity/lib/fetch.ts` already provide a server-only Sanity read client and fetch helper.
- The home page has a static `.hero-search` input; there is no `/search` page or `/api/search` route.
- The content model has `course`, embedded `courseModule`, and `lesson` documents. Courses point to ordered lesson references; a lesson does not point back to a course.
- `seed.ndjson` contains 6 categories, 5 instructors, 10 courses, and 120 lessons. `videos.json` contains 120 video metadata records. Neither file contains `video` documents or `sanity.agentContext` documents.
- `package.json` does not yet include the Vercel AI SDK, OpenAI provider, MCP SDK, Zod, or `react-markdown`.
- The checked `.env.local` does not currently contain non-empty values for `OPENROUTER_API_KEY`, `SANITY_API_READ_TOKEN`, or a Context MCP URL. Existing Sanity environment variables remain in `.env.example`.
- `lesson.duration` is defined as a string in the Studio schema, while the supplied content and frontend types use numeric seconds. This should be corrected as part of the search-compatible content model.

## Decisions and assumptions

- Create this work from `origin/main` on a new `feat/intelligent-search` branch after approval, so it does not mix with the open lesson-page pull request.
- No search-results reference image was supplied. Reuse the existing Vertex typography, warm palette, card treatments, header, icons, and responsive behavior; do not introduce a separate visual language.
- Use `POST /api/search` with a validated JSON body. It remains dynamic and uncached because it invokes a model and request-specific query.
- Use a full `/search?q=…` page. The page owns the query in the URL; a small client component submits the request, handles loading/error/empty states, and changes sorting without exposing secrets.
- Add a dedicated `video` document type keyed by a sanitized URL-derived ID. It stores a URL, chapter `{startSeconds, label}` entries, and short transcript `{startSeconds, text}` chunks. It is internal-only and never shown as a standalone result.
- Add a `sanity.agentContext` document with slug `vertex-search`, scope it to published `course`, `lesson`, `instructor`, `category`, and `video` documents, and keep its instructions limited to non-obvious Vertex relationships: course membership is a reverse reference through `course.modules[].lessons`; use chapters before transcript chunks; Portable Text must be projected to plain text; do not return whole transcript arrays.
- Import generated video and Context documents through a new, dedicated import artifact or script derived from `videos.json`; do not alter `seed.ndjson` or `videos.json`. The import will be idempotent and inspectable before it is run.
- Generate result cards with a strict Zod schema. Before returning them, validate that each lesson/course/video reference and timestamp was actually obtained from Sanity; discard invalid or invented references rather than presenting them.
- The route fetches and caches the Context MCP `/initial-context` on the server, connects with a bearer `SANITY_API_READ_TOKEN`, exposes discovered MCP tools to the OpenAI-backed model, and excludes the redundant `initial_context` tool.
- The inline system prompt is short and behavioral: search Vertex courses only, return structured cards rather than chat, use MCP data only, never invent facts or timestamps, prefer chapters then transcript chunks, and report no match honestly. The Context document keeps the related data/query deltas.
- Do not enable embeddings or call `text::semanticSimilarity()`. Use tokenized, wildcarded keyword matches with `pt::text(notes)` and relevance-aware GROQ ranking as the fallback when semantic search is unavailable.
- Initial results must include every grounded match returned by the search process, ordered by relevance. The UI offers a client-side sort control with “Most relevant” as default and title ordering as a secondary view.
- Since no currently supplied transcript/chapter data exists, video-moment cards will appear only after the generated video documents have chapter/chunk data. Lesson cards remain fully functional over the existing course/lesson content.

## Implementation plan

1. Install current compatible server dependencies: `ai`, `@ai-sdk/openai`, `@ai-sdk/mcp`, `zod`, and `react-markdown` only if the chosen AI SDK transport requires them. Use their official package documentation to confirm the current APIs before implementation.
2. Add server-only search modules under `sanity/lib/` (or a clearly named `app/lib/` server module) for the Context URL, authenticated initial-context retrieval, MCP client/tool setup, OpenRouter's OpenAI-compatible provider, result-schema validation, and Sanity-backed grounding checks. Keep all secrets in server-only modules.
3. Add `video` and `sanity.agentContext` schema types, register them, and add both to Studio structure. Correct `lesson.duration` to a number of seconds so the schema matches the existing 120 seeded documents and existing frontend types.
4. Add an idempotent local generator/import artifact for the provided `videos.json`, plus the `vertex-search` Context configuration document. It must create only the new video/context documents and never rewrite the two supplied seed files.
5. Add `app/api/search/route.ts`: validate query length and shape with Zod, reject malformed requests, invoke the server-side agent, normalize and verify result references, return typed JSON, and avoid putting provider/MCP errors or secret details in client responses.
6. Add `/search` server page and client result UI. Include the Vertex header, accessible search form, query/state announcement, result count, sort control, loading state, empty state linking to `/courses`, and two card variants:
   - video moments: course name/cover, module + lesson number/title, thumbnail, a short grounded description, timestamp/clip label, and `Watch from …` linking to `/lessons/<slug>?start=<seconds>`;
   - lessons: course name/cover, module + lesson number/title, key points, a grounded description, and a link to the lesson page.
7. Wire the home hero search input to navigate to `/search?q=…`; support Enter and form submission accessibly.
8. Update `.env.example` with only the new variable names and safe explanatory comments: `OPENAI_API_KEY`, optional model identifier, and Context slug/URL configuration. Do not commit values, tokens, prompts containing credentials, or transcripts.
9. Update types and relevant Sanity query/data helpers to keep course/module/lesson labels, lesson duration, image projection, and result links strongly typed.

## Files expected to change or be added

- `package.json`, `package-lock.json`, `.env.example`
- `sanity/schemaTypes/index.ts`, new `sanity/schemaTypes/video.ts`, new `sanity/schemaTypes/agentContext.ts`, `sanity/schemaTypes/lesson.ts`, `sanity/structure.ts`
- New server-only search modules under `sanity/lib/` (Context/MCP client, result types, grounding query/helper)
- New import/generation artifact under `sanity/seed/` or `scripts/` plus a focused documented command
- `app/api/search/route.ts`
- `app/search/page.tsx` and focused client UI components
- `app/page.tsx`, `app/globals.css`, and icon definitions only as necessary for the integrated search UI
- `sanity/lib/queries.ts`, `sanity/lib/data.ts`, `sanity/lib/types.ts` as needed for typed course/lesson result context

## Security and data boundaries

- The browser calls only `/api/search`; it never receives or imports a Sanity token, OpenRouter key, MCP client, full schema context, transcript chunks, or arbitrary GROQ access.
- `SANITY_API_READ_TOKEN` must use the least-privilege Viewer role and stays server-only. `OPENROUTER_API_KEY` stays server-only.
- The API uses input validation, bounded query length, bounded response/result fields, timeout/error handling, and neutral client-facing errors.
- Search is read-only. It neither mutates content nor learner progress.
- Result links are constructed from validated Sanity slugs and non-negative timestamps. Externally sourced URLs are not returned as navigation actions.

## Acceptance criteria

- Searching from the home page opens `/search?q=<query>`.
- The results page queries through the server route; no private environment value appears in client source or network payloads.
- The route uses the Sanity Context MCP with authenticated initial context and model tool calls when valid credentials and a deployed Studio are available.
- The search only returns actual courses/lessons, derives their module positions from course ordering, and never fabricates timestamps or descriptions.
- Video cards target the on-site lesson player with `?start=<seconds>`; lesson cards open the correct lesson.
- A query with no matches gives a useful, grounded empty state and link to the course catalog.
- The page is keyboard accessible and responsive, preserving existing Vertex visual patterns.
- The provided `seed.ndjson` and `videos.json` are byte-for-byte unchanged.

## Verification

1. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` from the web workspace; report real output.
2. Run the video/context generator in dry-run mode, compare document counts, and verify that the two supplied seed files have no diff.
3. With a valid Viewer token and a deployed Studio, call the Context MCP `tools/list` and `/initial-context`; confirm the `vertex-search` context document's filter and instructions are active.
4. Import only the new video/context documents with the Sanity CLI, then query document counts and spot-check that `video.url` values match lessons' `videoUrl` values.
5. Run the dev server, submit a typical query (for example, `Next.js routing`), verify lesson cards and any available grounded video cards, then open a video result and confirm the lesson player receives the `start` parameter.
6. Test malformed/empty/very long API input, an unknown query, keyboard submission, sort switching, and the responsive search page.

## Manual test steps

1. Set the server-only values in `.env.local`: `SANITY_API_READ_TOKEN`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, plus the existing Sanity project and dataset configuration.
2. Deploy the Studio application and schema; Sanity Context requires an actual deployed Studio, not only a local schema.
3. Import the generated `video` and `sanity.agentContext` documents using the documented CLI command.
4. Start the app with `npm run dev`, visit `/`, enter a natural-language learning question, and press Enter.
5. On `/search`, confirm each card opens the shown course/lesson and that a video-moment result begins playback at the displayed time.
