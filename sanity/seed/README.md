# Vertex search documents

The supplied `app/studio/[[...tool]]/seed/seed.ndjson` and `videos.json` files are inputs only and are never modified.

Generate the additional internal video index and `sanity.agentContext` document:

```powershell
npm run generate:search-seed > sanity/seed/vertex-search.ndjson
```

After deploying the schema and Studio application, import only that generated file into the configured Sanity dataset:

```powershell
npx sanity dataset import sanity/seed/vertex-search.ndjson production --replace
```

The generated import has 121 documents: 120 video records and the `vertex-search` Context configuration. Re-run the generator before each import so it stays derived from the supplied video metadata.
