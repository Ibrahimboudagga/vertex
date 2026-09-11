# Fix the Vertex course action buttons

## Goal

Make the two actions shown on a course page behave visibly: Continue Learning opens the first seeded lesson, and Bookmark toggles its saved state in the interface.

## Skills and documentation consulted

- Existing Next.js App Router conventions already inspected for dynamic page routing and client/server boundaries.

## Code inspected

- `app/courses/[slug]/course-actions.tsx` renders both controls as buttons, but their click handlers only call the optional PostHog `captureEvent` helper.
- `app/courses/[slug]/page.tsx` already derives and passes the first ordered seeded lesson to Continue Learning.
- `app/lib/posthog-client.ts` safely no-ops when analytics configuration is absent, which explains why the current actions have no visible effect.

## Decisions and assumptions

- Continue Learning will use a client-side Next.js navigation to `/lessons/<first-seeded-lesson-slug>`, while still recording the existing analytics event.
- Bookmark will toggle client-only visual state (`Bookmark` / `Bookmarked`, filled icon, and `aria-pressed`) and send an event matching the resulting state.
- Persisted per-user bookmarks require a server-side progress/bookmark data layer that is not present; this narrow fix will not invent one or place writes in the browser.
- The footer Continue Learning button uses the same component and will gain the same navigation behaviour.
- The fix will be committed as a follow-up on the already-pushed `feat/lesson-page` branch, so the prepared PR contains the related course-to-lesson user journey.

## Files expected to change

- `app/courses/[slug]/course-actions.tsx`
- `app/globals.css` only if a saved-state style is required

## Requirements

1. Clicking Continue Learning navigates to the passed lesson route.
2. Clicking Bookmark immediately changes its visible label and icon state.
3. Both controls retain keyboard access, focus styling, and useful accessible labels.
4. Do not introduce client-side Sanity reads, tokens, or persistence writes.
5. Preserve the existing PostHog events, extending their properties only to reflect the saved/unsaved state where helpful.

## Security considerations

- Navigation must use an internally constructed lesson slug already supplied by the server page.
- No secrets, Sanity tokens, or user data may enter client-side code.
- Do not simulate persistence when there is no server data layer.

## Acceptance criteria

- The hero and footer Continue Learning controls open the first seeded lesson.
- Bookmark visibly toggles and communicates state to assistive technologies.
- Type check, lint, and production build pass.

## Checks to run

1. `npx tsc --noEmit`
2. `npm run lint`
3. `npm run build`

## Manual test steps

1. Open a seeded course page.
2. Click both Continue Learning controls and confirm navigation to the first lesson.
3. Return to the course and toggle Bookmark with mouse and keyboard.
4. Confirm the label, icon, and pressed state update.
