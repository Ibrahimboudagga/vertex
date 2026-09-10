# Implement Vertex home page

## Goal

Replace the current design-system showcase route with the Vertex learner home page shown in design/vertex-home.png, preserving the existing Vertex tokens and reusable primitives where they fit.

## Skills and guidance read

- AGENTS.md: reproduce the supplied image as the visual source of truth, keep the scope small, preserve App Router boundaries, and verify the result.
- Next.js 16 documentation under node_modules/next/dist/docs/: use the current App Router conventions.
- design/vertext-designsystem.png: existing Vertex tokens and component language.
- design/vertex-home.png: source of truth for this page's layout, copy, spacing, typography, colors, and responsive adaptation.

## Code inspected

- app/page.tsx: current design-system showcase with inline sample data.
- app/components/design-system.tsx: reusable Vertex panel, button, badge, icon, status, and card primitives.
- app/globals.css: current design-system CSS tokens and responsive styles.
- app/layout.tsx: Vertex metadata and local/system font setup.

## Decisions and assumptions

- The requested scope is a static visual home page; Sanity, Clerk, search, progress, analytics, and backend behavior remain out of scope.
- Keep the page data local and representative of the reference: three course cards for Next.js, Docker, and TypeScript.
- The search field and navigation controls are presentational controls for now. They should be keyboard accessible but do not need backend behavior.
- Use CSS shapes/gradients for the bottom orange bar illustration and inline SVG for icons; do not add image dependencies.
- Keep the current local/system font strategy so builds do not require Google Fonts network access.
- The desktop composition is the source of truth; on mobile, stack navigation and cards, reduce hero type, and preserve the visual hierarchy without horizontal overflow.

## Requirements

1. Implement the home page with:
   - a centered, bordered content shell over the subtly striped page background
   - top navigation with Vertex mark, Courses, My Learning, notification bell, and profile avatar treatment
   - hero badge, large serif headline, supporting copy, Explore Courses CTA, and prominent learning search field with shortcut hint
   - All Courses section with heading, View all courses link, and three course cards
   - course cards with logo treatments, title, description, metadata icons, and matching content from the reference
   - weekly-content callout with star icon, divider lines, and soft orange bar-chart illustration
2. Reuse the existing Icon, Button, and Panel primitives when appropriate; add small home-specific components only where it keeps the page readable.
3. Maintain semantic landmarks, accessible labels, visible focus styles, and real buttons/links/inputs.
4. Keep the page within the existing app workspace and do not introduce product integrations.
5. Preserve Vertex design tokens and the successful offline font/build approach.

## Expected files

- app/page.tsx
- app/globals.css
- app/components/design-system.tsx only if a reusable primitive needs a small extension
- prompts/implement-home-page.md

## Acceptance criteria

- / renders the Vertex home page rather than the design-system showcase.
- Desktop layout matches the supplied reference in structure, tone, spacing, typography, colors, and visible content.
- Responsive layout remains readable at mobile widths without horizontal overflow.
- Search field, CTA, nav links, and course links have accessible names and visible keyboard focus.
- npm run lint passes with no new errors.
- npm run build passes without network access.
- The running development server displays the completed home page at http://localhost:3000.

## Checks to run

1. npm run lint
2. npm run build
3. npm run dev or verify the existing dev server

## Manual test steps

1. Open http://localhost:3000.
2. Confirm the header, hero, search field, course cards, and weekly-content illustration match the reference.
3. Resize below the mobile breakpoint and confirm the header, hero, cards, and callout stack cleanly.
4. Tab through navigation, CTA, search field, and course links; confirm visible focus and meaningful labels.
