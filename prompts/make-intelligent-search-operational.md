# Make intelligent search operational

## Goal

Make Vertex intelligent search work end to end. A learner who searches for `agent skills` should receive grounded lesson/video results, and the home-page search should take them straight to the best matching lesson video at its returned timestamp when a video moment exists.

## Guidance and code inspected

- Read `AGENTS.md`.
- Read the `create-agent-with-sanity-context`, `dial-your-context`, and `sanity-best-practices` skills, plus the Context Next.js, system-prompt, and Studio-setup references.
- Inspected `.env.example`, `sanity/lib/search.ts`, `app/api/search/route.ts`, `app/components/intelligent-search-form.tsx`, `sanity.config.ts`, and `package.json`.
- Reproduced the failure at `/search?q=agent+skills`: the UI renders `Intelligent search is not configured yet` because `.env.local` lacks `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. It also has no explicit Sanity Context URL, though the application can safely derive one from the project, dataset, and `vertex-search` slug.

## Decisions and assumptions

- Retain the current server-only architecture: browser -> `/api/search` -> Sanity Context MCP + OpenRouter -> grounded Sanity results. Never expose the Sanity token or LLM key in browser code.
- Use the previously supplied OpenRouter credential only in untracked `.env.local`; never add it to source control, prompts, logs, test output, or client-side environment variables.
- Retain `OPENROUTER_MODEL=deepseek/deepseek-v4-flash` unless the provider rejects it.
- Use the existing Sanity Viewer token for Context MCP authentication. If it cannot access the endpoint, create a least-privilege Viewer token, replace only the local environment value, and do not print it.
- Do not add the potentially incompatible `@sanity/context` Studio plugin. Instead, ensure the `sanity.agentContext` document for `vertex-search` exists in the dataset through the existing Sanity content path, with a published-content filter and concise Vertex search instructions.
- Context document scope will include only `course`, `lesson`, `instructor`, `category`, and `video` documents, excluding drafts. Instructions will state the non-obvious course->modules->lesson-reference relationship, require chapter-before-transcript matching, and require tokenized wildcard GROQ matches over `pt::text(notes)` rather than whole-transcript retrieval.
- Keep the existing direct-search behavior: select the first ranked `video` result and navigate to `/lessons/:slug?start=:seconds`; use the full results page only for no video match or a request failure.

## Expected files and external state

- Local-only: `.env.local` (not committed) with server-only OpenRouter and Sanity Context settings.
- Sanity dataset: published `sanity.agentContext` document/configuration for slug `vertex-search`, if it is absent.
- Potentially `sanity/lib/search.ts`, `app/api/search/route.ts`, or tests only if live validation proves a code-level compatibility or robustness gap.
- `prompts/make-intelligent-search-operational.md` is the implementation record.

## Requirements

1. Verify the Sanity Context `/initial-context` endpoint and MCP tools with the server-side Viewer token, without logging secrets.
2. Verify the Context configuration document/filter/instructions and deploy the Studio/schema if Context requires it.
3. Verify an OpenRouter request succeeds using the configured server-only model.
4. Run `agent skills` through the real API, confirm each returned result maps to existing Sanity content, and confirm at least one video result has an existing video chapter or transcript chunk at the returned timestamp.
5. Exercise the home-page form behavior. If the best result is a video moment, verify navigation to the correct lesson URL with `start` equal to the returned seconds and confirm the lesson player consumes that parameter.
6. Preserve the unavailable-search UI for legitimate service failures; do not fabricate results or timestamps.
7. Preserve analytics without storing query text or credentials in analytics properties.

## Security

- All LLM and Sanity calls remain server-side.
- Do not print, commit, expose, or transmit API keys beyond their intended provider requests.
- Sanity token must be Viewer/read-only and must stay server-side.
- Context filter must exclude drafts and unrelated app/progress data.

## Acceptance criteria

- The local app no longer shows the configuration error for `agent skills`.
- `/api/search` returns valid grounded `SearchResponse` JSON.
- The search result count and cards reflect only real Sanity documents.
- A matching video result has a real start time and the home search navigates to the in-site lesson player at that time.
- Typecheck, lint, and production build complete successfully.

## Checks and manual test

1. Validate Context initial context and MCP tool discovery with non-secret diagnostic output.
2. POST `{ "query": "agent skills" }` to `/api/search`; inspect only response fields that are safe to display.
3. Run `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
4. In the browser, enter `agent skills` in the home search field and submit.
5. Confirm either an in-site lesson URL with `?start=<seconds>` is reached or, when no video applies, the results page presents real cards.
