# Add privacy-safe PostHog learning analytics

## Goal

Extend Vertex's existing PostHog setup so the search, course, lesson, and video-learning flows produce consistent, useful product analytics without sending personal data other than the authenticated Clerk user id.

## Context inspected

- `AGENTS.md` and the local Next.js 16 documentation for Server/Client Components and Route Handlers.
- PostHog's official Next.js guidance for browser initialization, Clerk-backed identification, and `posthog-node` server capture.
- Existing analytics setup in `instrumentation-client.ts`, `app/lib/posthog-client.ts`, and `app/components/posthog-identity.tsx`.
- Search client and route: `app/search/search-results.tsx` and `app/api/search/route.ts`.
- Lesson page and interactions: `app/lessons/[slug]/page.tsx`, content tabs, bookmark, resource links, sidebar, and course action components.
- `package.json` and `.env.example`.

## Decisions and assumptions

- Keep PostHog's browser SDK for learner interactions that only the browser can observe: result opens, video state, watch milestones, bookmarks, resource opens, module expansion, and tabs.
- Add `posthog-node` only for server-side work. Use it in the search Route Handler to record search execution success/failure after the server operation has actually completed. It must be a no-op when the server token is absent.
- Use Clerk's stable `user.id` as the only identified person property. Remove the existing email, full name, and role properties from `PostHogIdentity`; no Clerk profile data, raw URLs, resource titles, lesson notes, transcripts, exception payloads, or API responses may be captured.
- A learner can type personal information into search. To honor both requested query tracking and the privacy constraint, capture a normalized query text only when it does not contain an obvious email address, phone number, or long identifier. For a potentially sensitive query, omit its text and send only `query_redacted: true`, `query_length`, and `query_word_count`. Apply the same safe query metadata on client and server events.
- Use lower-case snake-case custom event names and lower-case snake-case property names. Prefer stable content ids/slugs, indices, boolean state, result kind, ranking, duration, and positions over display copy.
- Do not add a progress persistence model or a custom video player. Completion is a browser-observed playback completion for the existing YouTube lesson embeds. The existing public browsing model remains unchanged.
- Video analytics are YouTube-only because only YouTube playback is currently implemented. Unsupported providers continue to show the existing unavailable state and emit no playback events.
- Emit watch-depth events once per meaningful milestone (25%, 50%, 75%, 90%, and 100%), never on every player polling interval. Dedupe play, resume, completion, and each milestone for a mounted player.

## Event contract

| Event | Boundary | Safe properties |
| --- | --- | --- |
| `search_performed` | browser | safe/redacted query metadata, query length, word count |
| `search_execution_completed` | server | safe/redacted query metadata, result count, course count, result kinds, elapsed milliseconds |
| `search_execution_failed` | server | safe/redacted query metadata, safe error category, elapsed milliseconds |
| `search_result_opened` | browser | result kind, rank, course id/slug, lesson id/slug, module/lesson numbers, video start seconds when present |
| `search_sort_changed` | browser | selected sort |
| `lesson_video_played` | browser | lesson id/slug, course id/slug when available, provider, start seconds, resumed flag |
| `lesson_video_watch_depth_reached` | browser | lesson id/slug, provider, milestone percent, current seconds, video duration seconds |
| `lesson_resume_used` | browser | lesson id/slug, provider, requested start seconds |
| `lesson_completed` | browser | lesson id/slug, provider, duration seconds, source position |
| `lesson_bookmark_toggled` | browser | lesson id/slug, bookmarked state |
| existing course/module/resource events | browser | retain only their current non-PII content ids, slugs, indices, labels, and state |

PostHog automatic pageviews and exception capture remain enabled. Do not add custom duplicate page-view events. Existing course events should be normalized only where needed to use the shared typed capture helper; preserve their behavior and safe properties.

## Implementation plan

1. Add a compact client analytics module with a typed event map, a shared `captureEvent` helper, and a privacy helper for search query metadata. It must remain client-only and never import a server token.
2. Update the identity component so it calls `posthog.identify(user.id)` with no person properties, and resets when the Clerk identity changes or ends.
3. Add a server-only PostHog helper using `posthog-node`. Read a server-only capture token and host from environment variables, set serverless-friendly batching/flush behavior, and safely flush/shutdown after each capture. Do not let analytics failures change the search API response.
4. Instrument the search Route Handler. Time the server call, obtain the Clerk user id when present, and capture a safe completed or failed execution event without logging request text or provider details. Keep current Zod validation, response status codes, and dynamic behavior.
5. Instrument the search UI to capture a user search intent once per submitted query, each result card open with its rank and kind, and sort changes. Do not capture raw result copy or the full URL.
6. Replace the lesson page's static YouTube iframe with a narrowly scoped client `LessonVideo` component. Build the existing nocookie embed URL with JavaScript API enabled and monitor the YouTube iframe API for play, progress milestones, end, and requested start time. Preserve autoplay policy, title, responsive styling, and the lesson page's server-side data fetching.
7. Pass only necessary stable lesson/course metadata into the player, bookmark, tabs, sidebar navigation, and resource components. Add high-signal interaction events for the bookmark and tab selection; retain or normalize current course/module/lesson/resource events without recording personal or rich-content text.
8. Add public and server-only PostHog variables to `.env.example`, with comments describing which must stay server-only. Do not add real values or modify `.env.local`.
9. Update dependencies and lockfile only for `posthog-node` if it is not already available.

## Files expected to change

- `package.json` and `package-lock.json`
- `.env.example`
- `instrumentation-client.ts` only if configuration alignment is needed
- `app/lib/posthog-client.ts`
- `app/lib/posthog-server.ts` (new)
- `app/lib/analytics.ts` or a similarly focused client-safe analytics module (new)
- `app/components/posthog-identity.tsx`
- `app/api/search/route.ts`
- `app/search/search-results.tsx`
- `app/lessons/[slug]/page.tsx`
- `app/lessons/[slug]/lesson-video.tsx` (new)
- `app/lessons/[slug]/lesson-bookmark-button.tsx`
- `app/lessons/[slug]/lesson-content-tabs.tsx`
- `app/lessons/[slug]/lesson-resource-link.tsx`
- `app/lessons/[slug]/lesson-sidebar.tsx` and course interaction files only as needed to pass stable safe metadata

## Security and privacy requirements

- Server PostHog configuration is never imported by a Client Component and no server environment value uses a `NEXT_PUBLIC_` prefix.
- Identify only with the Clerk user id. Do not set email, name, public/private metadata, IP-derived information, or custom person properties.
- Do not record search queries that look potentially identifying; use the redaction behavior described above.
- Do not record video URLs, resource URLs, Portable Text, transcripts, user agent, error message/stack text, or LLM/Sanity payloads.
- Do not authenticate-gate public search or lesson playback merely for analytics; anonymous browser events may remain anonymous.
- Analytics must be best-effort: unavailable configuration or a PostHog failure must never break the page, search response, or player.

## Acceptance criteria

- A signed-in user is identified in PostHog solely by their Clerk user id, with no email/name/role properties.
- Search emits a privacy-safe intent event; completed searches and failures are also recorded by the server when configured, without disrupting their response.
- Opening either card kind reports `search_result_opened` with `result_kind` (`video` or `lesson`) and its rank.
- A YouTube lesson reports one play event, one resume event for a positive `start` parameter, depth milestones no more than once each, and a completion event on natural end.
- Existing course, module, lesson selection, and resource interactions continue to work and contain no PII.
- The product remains usable when either PostHog environment configuration is absent.
- No design, content, Sanity schema, auth behavior, or data model is changed.

## Checks to run

1. `npm install posthog-node` if needed.
2. `npx tsc --noEmit`.
3. `npm run lint`.
4. `npm run build` because the search Route Handler and lesson route change.
5. Run the dev server and manually test the flows below with PostHog configured.

## Manual test steps

1. Sign in, load a lesson, and inspect the PostHog person: only the Clerk id is used; no email or name property appears.
2. Search for a non-sensitive phrase. Confirm intent and server completion events include result metadata, not result copy or notes.
3. Search with an email-like string. Confirm the query text is absent and the event is marked redacted.
4. Open both a video result and a lesson result. Confirm each has the correct `result_kind` and rank.
5. Open a video result with `?start=<seconds>`, play the YouTube lesson, cross every depth threshold, and let it finish. Confirm each event emits once and no player behavior regresses.
6. Toggle a bookmark, switch Notes, expand modules, select a lesson, use Continue Learning, and open a resource. Confirm the UI still works and the events use only safe ids/state.
7. Temporarily omit PostHog variables, restart development, and verify search, course, and lesson pages still work without runtime analytics errors.
