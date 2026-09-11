# Vertex offline video ingestion

This CLI builds internal Sanity `video` documents from the supplied YouTube inventory. It runs outside Next.js and never downloads video media. Raw provider metadata/captions and generated NDJSON are kept under `ingestion/.cache/`, which is ignored by Git.

## Prerequisites

- Node.js 20+
- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) installed on `PATH`, or set `YT_DLP_BIN` to its executable path.
- For importing only: a server-only `SANITY_API_WRITE_TOKEN` with content write access.

## Commands

```powershell
# Confirms the supplied inventory without creating files or contacting a provider.
npm run ingest:videos -- inventory

# Fetch one video first. This writes only ignored local raw files and a local report.
npm run ingest:videos -- extract --source nextjs-app-router-in-depth-file-system-routing

# Build Sanity documents and a report from locally fetched files.
npm run ingest:videos -- transform --source nextjs-app-router-in-depth-file-system-routing

# Check all locally available extractions without writing generated output.
npm run ingest:videos -- validate
```

The extraction command uses `yt-dlp --skip-download --write-info-json --write-subs --write-auto-subs` with an English caption preference. It reads chapters only from `info.json.chapters`; no chapter or transcript text is generated when source data is missing.

After reviewing `ingestion/.cache/output/transform-report.json`, `transform-report.md`, and `video-documents.ndjson`, import explicitly:

```powershell
$env:SANITY_API_WRITE_TOKEN = 'your-server-only-write-token'
npm run ingest:videos -- import
```

`import` is the only command that can write to Sanity. It requires the write token and replaces only documents present in the generated NDJSON. The source seed files remain inputs and are never modified.
