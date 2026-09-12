# Refresh the Vertex project README

## Goal

Replace the brief README with an attractive, practical project guide that explains Vertex to a new developer, contributor, or reviewer. It must accurately describe the implemented product, its technologies, architecture, visual direction, local setup, content workflow, intelligent search, analytics, and operational commands without exposing credentials.

## Guidance and code inspected

- Read `AGENTS.md` and the Next.js App Router overview in `node_modules/next/dist/docs/01-app/index.md`.
- Inspected `README.md`, `package.json`, `.env.example`, `app/layout.tsx`, `proxy.ts`, `instrumentation-client.ts`, `app/api/search/route.ts`, `sanity/lib/search.ts`, `app/components/intelligent-search-form.tsx`, `app/lib/analytics.ts`, `app/lib/posthog-client.ts`, `app/lib/posthog-server.ts`, `sanity.config.ts`, `scripts/generate-search-documents.mjs`, and `sanity/seed/README.md`.
- Reviewed the repository structure and the supplied UI reference images in `design/`.

## Decisions and assumptions

- Document only functionality and workflows verified in the repository; do not claim unavailable features such as production deployment automation, tests that do not exist, or a public API.
- Present the existing `/studio` route as the current authoring surface, while keeping its code and content responsibilities separate from learner-facing pages.
- Use diagrams made from Mermaid and Markdown tables so GitHub renders them natively, with a concise fallback explanation around them.
- Keep the document useful for both product readers and implementers: lead with the product story and experience, then provide architecture and setup details.
- Do not include actual API keys, tokens, user data, private endpoints, or the values from `.env.local`. Refer only to `.env.example` variable names and their intent.

## Expected file

- `README.md` only.

## Requirements

1. Add a strong title, succinct product pitch, and an at-a-glance feature section.
2. Add a visual product overview describing the course catalog, course curriculum, in-site lesson player, timestamp-aware search, authentication, progress, and analytics.
3. Add a technology table with the actual framework, language, styling, CMS/content tools, LLM/MCP integration, auth, analytics, validation, video approach, and development tooling from `package.json` and the code.
4. Include a clear architecture diagram showing browser/client UI, Next.js server routes and server-only services, Sanity, Sanity Context MCP, OpenRouter, Clerk, PostHog, and the offline video-index generator. State which boundaries keep secrets off the client.
5. Explain the Sanity model: course, embedded module, lesson, instructor, category, video, and `sanity.agentContext`, including their relationships and the purpose of timestamped chapters/chunks.
6. Explain intelligent search accurately: the home form can go directly to the best matching video moment; the results page can show lessons and video moments; the server grounds responses in Sanity documents; chapters are preferred over transcript chunks; keyword fallback is used alongside MCP/LLM planning.
7. Document main application routes and what each does, including sign-in/sign-up and Studio.
8. Add local installation, environment setup, development, lint, build, start, and search-seed commands. Include instructions for generating and importing the derived search documents, clearly stating that the supplied seeds are not modified.
9. Add a concise environment-variable reference based exactly on `.env.example`, grouped into Clerk, PostHog, Sanity, and intelligent-search settings, with no values.
10. Add a design section that calls out the provided desktop design references and the responsive implementation approach, without claiming pixel-perfect parity beyond the implementation intent.
11. Add a privacy/security section covering server-only tokens, Clerk keys, PostHog key handling, search-query analytics protection, and the read-only nature of public content pages.
12. Add an honest verification section listing the expected checks and a manual intelligent-search check using `agent skills`.
13. Keep the Markdown clean, scannable, concise enough to maintain, and compatible with GitHub rendering. Do not add badges that require unverified external configuration.

## Acceptance criteria

- A new reader can understand what Vertex does in under a minute.
- A developer can set up the app and discover every required configuration variable without seeing a secret.
- The architecture and search descriptions match the current code paths and do not overstate the implementation.
- All core technologies and the Sanity content model are represented.
- Internal links, commands, Mermaid syntax, and code fences render correctly on GitHub.

## Checks and manual review

1. Review the full rendered Markdown locally/GitHub-style for heading hierarchy, fenced commands, tables, and Mermaid syntax.
2. Verify every listed script against `package.json`.
3. Verify every variable against `.env.example` and ensure no value from `.env.local` appears.
4. Verify route and architecture claims against the inspected code.
5. Run `npm run lint` because the repository's standard verification should remain green, even though this documentation-only change does not affect compilation.
