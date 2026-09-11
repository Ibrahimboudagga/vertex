# Vertex search documents

The supplied `app/studio/[[...tool]]/seed/seed.ndjson` and `videos.json` files are inputs only and are never modified.

Generate the `sanity.agentContext` document:

```powershell
npm run generate:search-seed > sanity/seed/vertex-search.ndjson
```

After deploying the schema and Studio application, import only that generated file into the configured Sanity dataset:

```powershell
npx sanity dataset import sanity/seed/vertex-search.ndjson production --replace
```

The generated file contains one Context configuration document. Video documents must be created from actual captions and source chapter metadata through the offline pipeline described in [`ingestion/README.md`](../../ingestion/README.md); it deliberately does not create placeholder chapters or empty transcript data.
