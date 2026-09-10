# Implement Vertex design system

## Goal

Implement the supplied Vertex design-system reference as the foundation of the current Next.js app. The result should be a polished, responsive design-system showcase at the root route, with reusable tokens and UI primitives that can be reused by later course, lesson, catalog, and search work.

## Skills and guidance read

- `AGENTS.md` in the repository root: preserve the Next.js App Router boundaries, follow the image as visual source of truth, keep the implementation small, and run the required checks.
- Next.js 16 documentation under `node_modules/next/dist/docs/`: use the current App Router and server/client conventions.
- The supplied reference image `design/vertext-designsystem.png`: source of truth for the visual language.

## Code inspected

- `package.json`: minimal Next.js 16.3.4 / React 19 / Tailwind CSS 4 starter; no UI or icon dependency is installed.
- `app/page.tsx`: default Create Next App page.
- `app/layout.tsx`: default Geist font setup and metadata.
- `app/globals.css`: default Tailwind import and dark-mode starter variables.
- `next.config.ts` and `tsconfig.json`: default configuration.

## Decisions and assumptions

- The requested scope is the design system itself, not a full learning-platform page or Sanity integration.
- The root route will be a design-system showcase so all reference elements are visible and manually testable.
- Use CSS variables and Tailwind-compatible utility classes for tokens. Do not add a component library or icon package for this foundation.
- Use inline SVG icons in a small reusable icon component so the project remains dependency-light.
- Use local/system font fallbacks instead of relying on a build-time Google Fonts network request; this also fixes the current offline production-build failure. Typography should approximate the reference with a serif display face and Inter-like sans-serif stack.
- The design reference is desktop-first but the showcase must collapse sensibly on narrow screens.

## Requirements

1. Replace the starter page with a Vertex design-system showcase matching the reference:
   - warm off-white canvas and white bordered panels
   - Vertex orange primary palette and neutral palette
   - Playfair-like display typography and Inter-like UI typography
   - type scale, spacing scale, radius and shadow samples
   - outline and filled icon samples
   - primary, secondary, tertiary, and text button states
   - search input and select states
   - badges/tags, status indicators, progress bar
   - course, video lesson, lesson, and resource cards
   - navigation, breadcrumbs, pagination, and principles sections
2. Add reusable local components for repeated patterns such as panel, section label, buttons, badges, cards, status indicators, and icon rendering.
3. Add semantic HTML, keyboard-visible focus states, accessible labels, button types, and sufficient color contrast.
4. Keep the root page as a server component unless interactivity is necessary. Small client components may be used only for controls that require state.
5. Update metadata to Vertex branding.
6. Keep the implementation self-contained in the current `app` workspace. Do not add Sanity, Clerk, PostHog, AI search, or unrelated product features.

## Expected files

- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `app/components/*` for reusable design-system primitives, if useful
- `prompts/implement-design-system.md` (this implementation prompt)

## Security and quality considerations

- No user data, external API calls, secrets, or persistence are involved.
- Avoid unsafe HTML injection and external image dependencies.
- Keep all interactive controls usable without a mouse.
- Preserve the existing TypeScript strictness and Next.js App Router conventions.

## Acceptance criteria

- The root route renders a coherent Vertex design-system showcase, not the starter template.
- The showcase includes the major sections and component states visible in the supplied reference.
- Layout is responsive without horizontal overflow at mobile widths.
- Repeated UI styles are driven by shared tokens/components rather than duplicated ad hoc values.
- The page has Vertex title/description metadata.
- `npm run lint` passes with no new errors.
- `npm run build` passes without requiring network access for fonts.
- `npm run dev` starts successfully and the root route is manually verifiable.

## Checks to run

1. `npm run lint`
2. `npm run build`
3. `npm run dev`

## Manual test steps

1. Open `http://localhost:3000`.
2. Confirm the page shows the Vertex design-system sections and no Create Next App content.
3. Resize to a narrow viewport and confirm panels stack, cards remain readable, and no horizontal scroll appears.
4. Tab through buttons, inputs, select, and links; confirm focus is visible and controls have meaningful accessible names.
5. Confirm the build completes while offline or with network access disabled.
