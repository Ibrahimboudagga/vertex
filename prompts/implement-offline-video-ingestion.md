# Implement offline video ingestion

## Goal

Replace Vertex's placeholder video-index generation with a repeatable, offline YouTube ingestion pipeline. It must collect public captions and chapter metadata, transform them into timestamped transcript chunks and chapter markers, emit importable Sanity `video` documents, and produce a validation report without executing in the web request path.

## Guidance read

- `AGENTS.md` — offline-only pipeline, dedicated video documents, timestamp constraints, and the requirement that providers need both ingestion and playback before support.
- `sanity-best-practices` and its schema reference — typed document schema, validation, Studio structure, and streaming-provider URLs rather than video files in Sanity.
- `sanity-migration` and its general playbook — deterministic, repeatable extraction/transform/report stages, generated artifacts outside application data, and human approval before any bulk Sanity write.
- Official `yt-dlp` documentation — metadata extraction with `--write-info-json` and manual/automatic subtitle retrieval with `--write-subs` / `--write-auto-subs`.

## Existing code and data inspected

- The project is currently on `main`; the only untracked files are the user-owned `design/vertex-lesson.png` and `posthog-self-driving-report.md`.
- `app/studio/[[...tool]]/seed/videos.json` contains 120 YouTube IDs, titles, durations, and search phrases. The corresponding 120 lesson documents use `https://www.youtube.com/watch?v=<id>` URLs.
- `sanity/schemaTypes/video.ts` already has `sourceId`, `url`, `sourceTitle`, `chapters`, and `chunks`.
- `scripts/generate-search-documents.mjs` currently creates a placeholder chapter at second 0 and an empty chunk array. It does not ingest captions or real chapters.
- The search route checks only the matching chapter/chunk item and can already use actual timestamps once the video documents are imported.
- The lesson player supports YouTube embeds; Vimeo and Bunny do not currently have matching playback support, so this ingestion release must support YouTube only.

## Decisions and assumptions

- Create a dedicated `feat/video-ingestion` branch from the current `main` after approval.
- Use a Node.js offline CLI that invokes a locally installed `yt-dlp` binary. This avoids adding a video downloader to the runtime application and allows the CLI to retrieve YouTube's info JSON, captions, and automatic captions without downloading video files.
- `yt-dlp` is an external prerequisite, configurable with `YT_DLP_BIN` and checked before work begins. The pipeline will never run from a page, route handler, server action, build, or client bundle.
- Use the existing `videos.json` as the authoritative inventory and keep both supplied seed files byte-for-byte unchanged.
- Use `yt-dlp --skip-download --write-info-json --write-subs --write-auto-subs` with English language preference. Store raw metadata and VTT files under a gitignored ingestion workspace so reruns can transform without re-fetching.
- Extract actual chapter entries only from the source's `info.json.chapters`. If a source has no chapter markers, emit an empty `chapters` array and record it in the report; do not manufacture chapters from titles or model output.
- Parse WebVTT locally, strip cue markup, remove repeated automatic-caption cues, and group adjacent text into short chunks by time and length. Each chunk keeps the first cue's integer start second; no full transcript is stored in a single field.
- Generate stable video document IDs from the existing source key/URL as already required by Vertex. Keep `sourceId` and `url` for traceability and use stable `_key` values for chapter/chunk arrays so reruns are deterministic.
- Output NDJSON plus a JSON/Markdown report. The report will include attempted/succeeded/failed extraction counts, caption source, chapter count, chunk count, missing-captions videos, missing-chapters videos, and parsing errors.
- Do not mutate Sanity automatically. The CLI will have an explicit `--import` mode that requires `SANITY_API_WRITE_TOKEN`, or the user can run the documented Sanity CLI import after reviewing the generated NDJSON.
- Do not use an LLM to transcribe or invent chapter boundaries. If captions are unavailable, the report identifies the video for editorial captions or a future approved transcription provider.

## Content inventory and mapping

| Source | Count | Target | Mapping |
| --- | ---: | --- | --- |
| `videos.json` | 120 | `video` documents | `id` → `sourceId`, YouTube URL → `url`, title → `sourceTitle` |
| yt-dlp info JSON | per successful video | `video.chapters` | source `chapters[].start_time/title` → `{_key,startSeconds,label}` |
| English VTT captions | per available video | `video.chunks` | cleaned, grouped timestamped cues → `{_key,startSeconds,text}` |

## Implementation plan

1. Add a focused offline `ingestion/` workspace: source inventory reader, YouTube extractor wrapper, WebVTT parser/chunker, transformer, NDJSON writer, report writer, and CLI entry point. Keep raw/source and transformed output directories gitignored.
2. Replace the placeholder `generate-search-documents` behavior so it does not create fake chapter markers. Preserve the context-document generator separately or make it consume only verified transformed video documents.
3. Add a `video` schema migration compatible with real ingestion metadata: retain the required chapter/chunk fields, add optional provider/language/ingested timestamp/source metadata only where it improves operational traceability, and validate non-negative integers plus non-empty text/labels.
4. Add package scripts for inventory/dry run, extraction, transformation, validation, and optional import. Require an explicit provider selector and reject non-YouTube URLs with a clear unsupported-provider report.
5. Add parser/transform unit tests using committed synthetic VTT and info-JSON fixtures. Cover cue time parsing, cue de-duplication, chunk boundaries, chapter conversion, stable IDs/keys, videos without captions/chapters, and invalid inputs.
6. Update `.env.example` and the ingestion README with non-secret variable names, installation prerequisites, commands, generated output locations, report interpretation, and the manual Sanity import command.
7. Update the search context instructions only if the final schema changes make it necessary; keep it concise and avoid exposing full chunks to the agent.

## Expected files

- `ingestion/` scripts, fixtures, test files, README, and gitignore rules
- `scripts/generate-search-documents.mjs` and `package.json`
- `sanity/schemaTypes/video.ts`, schema registry/structure, and only required search-context files
- `.env.example`, `sanity/seed/README.md`, and a new ingestion report/import guide
- `package-lock.json` only if a small offline parsing dependency is justified; prefer built-in Node APIs where practical

## Security and operational requirements

- Caption/metadata fetching is CLI-only. No transcript, extractor credential, write token, or raw info JSON enters the browser or runtime server bundle.
- The pipeline does not download video media, send content to a model, or scrape beyond the supplied YouTube inventory.
- `SANITY_API_WRITE_TOKEN` is only read by the explicit import command and never appears in generated artifacts, reports, logs, or client code.
- Generated raw caption/metadata files and transformed NDJSON are ignored by Git; scripts and synthetic fixtures are committed.
- Failures are isolated per video and reported so a missing/blocked caption never discards successful records.

## Acceptance criteria

- A single documented CLI command reads the 120 supplied video records and builds actual `video` NDJSON documents offline.
- Each successful document has the correct YouTube URL/source ID, source-derived chapter markers when available, and short timestamped transcript chunks when captions are available.
- Records with absent captions or chapters are reported accurately without fabricated content.
- Rerunning the same snapshot produces stable document IDs and array keys.
- The existing two supplied seed files remain unchanged.
- Only YouTube is supported and unsupported providers are reported clearly.
- The result can be imported into Sanity only by an explicit user action after reviewing the report.

## Checks to run

1. Run parser/transform tests and the TypeScript/lint checks affected by schema changes.
2. Run an inventory/dry-run against all 120 records; confirm 120 planned inputs and no mutations to supplied files.
3. Run a fixture transformation and validate its NDJSON schema: no negative timestamps, no empty chunk text, stable IDs/keys, and source-mapped chapters.
4. If `yt-dlp` is installed, run the extractor on one explicitly selected source video only, inspect its report, and do not import it automatically.
5. Run a production build if schema or search modules change.
6. After the user chooses to import, compare Sanity `video` document counts and spot-check a video-moment search result links to the same on-site lesson timestamp.

## Manual test steps

1. Install `yt-dlp` and ensure `yt-dlp --version` works, or set `YT_DLP_BIN` to its absolute path.
2. Run the documented dry run, then extract one selected YouTube video and inspect its raw VTT/info JSON plus report.
3. Run the full extraction/transform after reviewing costs, access limits, and failures.
4. Review the generated report and NDJSON before importing.
5. Set `SANITY_API_WRITE_TOKEN` only if using the explicit import mode, then import/deploy schema through the documented command.
6. Search a known caption phrase and confirm the resulting video card opens the lesson at its stored start second.
