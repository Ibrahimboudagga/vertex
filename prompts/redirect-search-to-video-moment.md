# Redirect intelligent search to the best video moment

## Goal

Make a submitted Vertex search take the learner directly to the best grounded video moment selected by the existing Sanity Context + LLM search pipeline. The destination must remain the in-site lesson page and preserve the returned timestamp so the embedded player starts at the matched point.

## Skills and context used

- `create-agent-with-sanity-context`: verified that the existing server-side agent uses the correct pattern—Sanity Context MCP with a private token, schema initial context, tool calls, and an LLM-generated structured plan.
- `sanity-best-practices`: preserve the server-only Sanity/LLM boundary and keep content reads grounded in returned Sanity documents.
- Local Next.js App Router documentation: preserve server/client boundaries; the interactive submit behavior belongs in a small Client Component while the LLM request stays in the existing Route Handler.
- Inspected `app/page.tsx`, `app/search/page.tsx`, `app/search/search-results.tsx`, `app/api/search/route.ts`, `sanity/lib/search.ts`, `sanity/lib/search-types.ts`, and the lesson video route/player.

## Current behavior

1. The home search form submits to `/search?q=<query>`.
2. The results page calls `POST /api/search`.
3. The server-side Sanity Context + LLM planner returns ranked `lesson` and timestamped `video` results.
4. A user must manually click a video result before reaching `/lessons/<slug>?start=<seconds>`.
5. The lesson route and YouTube player already use `start` to seek in-page playback.

## Decision

Create one reusable Client Component for search forms. On submit, it will:

1. Validate and trim the query using the same 2–240 character constraints as the API.
2. Record the existing privacy-safe `search_performed` browser event with a `search_surface` property.
3. Call the existing `POST /api/search` endpoint.
4. Select the first ranked result whose `kind` is `video`.
5. Navigate with `router.push()` to `/lessons/<lessonSlug>?start=<startSeconds>`.
6. If the search has no video moments, fails, or returns invalid data, navigate to `/search?q=<query>` so the learner can see the normal full results, empty state, or error state.

The LLM continues to determine only real lesson ids and timestamps through Sanity Context. The browser never calls Sanity, Context MCP, or the LLM directly, and it will never construct a timestamp of its own.

## Scope

- Use the redirecting search form on the home page.
- Replace the results-page search form with the same component, so a new query submitted there behaves consistently.
- Keep the existing results page for direct visits and no-video fallback. Do not automatically redirect a `/search?q=` route, because that would make the fallback loop and remove access to ranked results.
- Preserve the existing result card actions and analytics. The immediate redirect event must include only safe query metadata and a non-PII surface identifier.
- Keep the page visuals intact. A minimal submitting state may only prevent duplicate submissions and improve accessibility; it must not change the supplied UI design.

## Files expected to change

- `app/components/intelligent-search-form.tsx` (new)
- `app/page.tsx`
- `app/search/search-results.tsx`
- `prompts/redirect-search-to-video-moment.md`

## Security and privacy

- Continue to use the existing server Route Handler for the LLM request.
- Do not expose any Sanity, OpenRouter, or PostHog server configuration to the browser.
- Reuse `getSafeSearchQueryProperties()`; never send raw query text when it resembles an email address, phone number, or long identifier.
- Capture content ids/slugs and timestamps only through existing search response data. Do not capture notes, transcripts, descriptions, or video URLs.

## Acceptance criteria

- Submitting a query with a timestamped video result redirects directly to the lesson route with the exact returned `start` value.
- The YouTube player begins at that location using the existing lesson page behavior.
- The first ranked video result is used; the client does not invent a lesson or seek point.
- A query with no video result falls back to `/search?q=<query>` and retains the existing results/empty/error experience.
- The direct search path captures one privacy-safe `search_performed` event and does not duplicate it after landing on the lesson page.
- All current server-only LLM/Sanity boundaries, cards, and playback analytics continue to work.

## Checks

1. `npx tsc --noEmit`.
2. `npm run lint`.
3. `npm run build` because routing and Client Component behavior change.
4. With search credentials configured, submit a query known to match a video chapter and verify the URL contains the returned `start` value.
5. Submit a query with no video result and verify the normal `/search?q=` fallback.
6. Verify the lesson player starts at the requested time and that the direct search emits one privacy-safe event.

## Sanity Context workflow status

- Agent implementation: already present and retained.
- Studio context configuration: already consumed through `SANITY_CONTEXT_MCP_URL` / `SANITY_CONTEXT_SLUG`; no schema or deployment change is needed.
- Conversation Insights and agent tuning: deliberately out of scope for this routing improvement. They can be added later if the user wants to analyze failed queries or improve ranking behavior.
