const list = (values) => values.length ? values.map((value) => `- ${value}`).join('\n') : '- None'

export function reportAsMarkdown(report) {
  return `# Vertex video ingestion report

## Summary

- Attempted: ${report.attempted}
- Transformed: ${report.transformed}
- Transcript chunks: ${report.chunks ?? 0}
- Chapter markers: ${report.chapters ?? 0}
- Extraction or parsing failures: ${report.failed.length}

## Missing captions

${list(report.missingCaptions ?? [])}

## Missing chapters

${list(report.missingChapters ?? [])}

## Captions used

${report.captionSources?.length ? report.captionSources.map(({source, language, type}) => `- ${source}: ${language ?? 'unknown language'} (${type})`).join('\n') : '- None'}

## Failures

${report.failed.length ? report.failed.map(({source, error}) => `- ${source}: ${error}`).join('\n') : '- None'}
`
}
