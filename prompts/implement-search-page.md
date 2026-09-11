# Implement the Vertex search-results page

## Goal

Rebuild the `/search` page to match `design/vertex-search.png` precisely at desktop width, while retaining the existing grounded Sanity Context search flow. The page must show real ranked video-moment and lesson results, with each action opening the correct on-site lesson and video timestamp.

## Guidance read

- `AGENTS.md` — reproduce supplied UI exactly, preserve client/server boundaries, use the full search-results page pattern, and do not expose tokens or transcripts.
- `sanity-best-practices` and its Next.js reference — continue to use the existing server-only Sanity helper and Next.js App Router data-fetching boundaries.
- Next.js `01-app/01-getting-started/06-fetching-data.md` — keep the page server-rendered for URL parsing and retain client-side fetching only in the interactive results component.

## Existing implementation inspected

- The supplied desktop reference is `design/vertex-search.png`.
- `app/search/page.tsx` reads the `q` URL parameter, renders the shared header, and mounts `SearchResults`.
- `app/search/search-results.tsx` posts the query only to `/api/search`, renders loading/error/empty states, supports relevance/title sort, and links video results to `/lessons/[slug]?start=<seconds>`.
- `app/api/search/route.ts` validates input and calls `runIntelligentSearch` server-side.
- `sanity/lib/search.ts` returns grounded `SearchResponse` data with course, module, lesson, thumbnail, description, key points, and stored video timestamps. No browser token or direct Sanity client exists.
- Search-specific CSS already lives in `app/globals.css`; the shared header, colours, fonts, and `Icon` component are reusable.
- The current worktree is on `feat/video-ingestion`; unrelated untracked files are `design/vertex-lesson.png` and `posthog-self-driving-report.md`. The new supplied `design/vertex-search.png` is a reference input and must not be modified.

## Visual decisions

- Match the reference hierarchy: centered `Search results` pill, large `Results for “<query>”` heading with only the query in orange, centered grounded count, a full-width white search bar, and a secondary results-count/sort row.
- Show the `⌘ K` visual hint in the search field and make it useful: on macOS Command+K and on other platforms Control+K move focus to the field without overriding normal typing or form submission.
- Render desktop cards as the reference’s wide horizontal list. Video cards use a 16:9 Sanity thumbnail or a neutral real-data fallback, a play overlay, stored start timestamp, video tag, course lockup, lesson/module metadata, and `Watch from <timestamp>` action.
- Render lesson cards with a content-summary panel derived from the real result key points/description, course lockup, lesson/module metadata, lesson tag, and `View lesson` action. Do not hardcode course names, lesson text, timestamps, or decorative course data from the mockup.
- Use the course/lesson images supplied by search data when available. Fallbacks may use only a course initial or content-derived icon treatment.
- Keep loading, error, and no-results states, but style them consistently with the supplied canvas and provide the catalog action in the bottom callout/empty state.
- Add responsive behavior: narrow the centered column, stack metadata/actions where needed, shrink media, and make cards readable on mobile. Do not add unrelated product features or alter the search ranking/data flow.

## Files expected to change

- `app/search/page.tsx`
- `app/search/search-results.tsx`
- `app/globals.css`
- `app/components/design-system.tsx` only if the exact reference needs a missing shared icon
- focused UI/helper tests only if they can be added without introducing a test framework

## Requirements

1. The search page must read the query from `?q=`, preserve it in the form, and submit a new query with standard navigation.
2. The browser calls only `/api/search`; it must not receive Sanity or model credentials, raw transcript arrays, or Context MCP details.
3. The top and list result counts must come from `SearchResponse`, never reference-image constants.
4. Video cards must retain `?start=<result.startSeconds>` and lesson cards must link to their real `lessonSlug`.
5. Sort controls must keep the existing most-relevant default and lesson-title option.
6. All interactive controls need accessible names, keyboard focus styling, and semantic headings/lists.
7. The supplied `design/vertex-search.png`, supplied seed files, and unrelated user worktree files remain unchanged.

## Security

- Do not change `.env` files, the server route’s validation, or server-only Sanity/MCP/LLM code.
- Render query text normally through React so it remains escaped; do not use `dangerouslySetInnerHTML` for highlight styling.
- Keep all provider/player navigation internal to the lesson page.

## Acceptance criteria

- At the reference desktop width, `/search?q=data%20fetching` visually matches the supplied centered page, search form, sort row, mixed video/lesson card layout, and catalog callout.
- Every displayed result is populated solely from the existing `SearchResponse` shape.
- Video actions seek to the stored timestamp on the existing lesson page; lesson actions open the correct lesson.
- Loading, error, empty, sorting, native form submission, and Command/Control+K focus work.
- The layout adapts cleanly below tablet and phone widths.

## Checks

1. Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
2. Start the app and inspect `/search?q=data%20fetching` at the reference desktop size and mobile width.
3. With configured Sanity/Context/OpenRouter server credentials, confirm a video and a lesson result render and their actions produce the expected `/lessons/[slug]` URLs, including `start` for a video result.
4. Verify empty, loading, server-configuration-error, sort, keyboard shortcut, and form-submit states.
5. Confirm no seed/reference/unrelated files changed with `git diff --` against their paths.

## Manual test steps

1. Run `npm run dev`, open `/search?q=data%20fetching`, and compare it with `design/vertex-search.png` at 1440px width.
2. Press Command+K (or Control+K), type a new query, and submit.
3. Change the sort control and confirm only the rendered order changes.
4. Open a video result; verify the lesson URL contains its stored `start` value and the embedded player begins there.
5. Open a lesson result and confirm it loads the correct lesson page.
6. Try a query with no grounded match and confirm the catalog callout appears.
