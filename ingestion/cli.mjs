#!/usr/bin/env node
import {spawn} from 'node:child_process'
import {mkdir} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {extractYoutube, assertYtDlp} from './lib/extract-youtube.mjs'
import {readExtractedSource, writeText} from './lib/files.mjs'
import {filterInventory, readInventory} from './lib/inventory.mjs'
import {reportAsMarkdown} from './lib/report.mjs'
import {createVideoDocument, validateVideoDocument} from './lib/transform.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaults = {
  inventory: path.join(root, 'app/studio/[[...tool]]/seed/videos.json'),
  rawDirectory: path.join(root, 'ingestion/.cache/raw'),
  outputDirectory: path.join(root, 'ingestion/.cache/output'),
  binary: process.env.YT_DLP_BIN || 'yt-dlp',
}

const parsed = process.argv.slice(2).reduce((options, argument, index, values) => {
  if (!argument.startsWith('--')) return options
  const [name, inlineValue] = argument.slice(2).split('=', 2)
  const value = inlineValue ?? (!values[index + 1]?.startsWith('--') ? values[index + 1] : true)
  options[name] = value
  return options
}, {})

const command = parsed.command ?? process.argv[2] ?? 'help'
const numberOption = parsed.limit === undefined ? undefined : Number(parsed.limit)
if (numberOption !== undefined && (!Number.isInteger(numberOption) || numberOption < 0)) throw new Error('--limit must be a non-negative integer')

const sources = filterInventory(await readInventory(parsed.inventory ?? defaults.inventory), {
  sourceKey: parsed.source,
  limit: numberOption,
})
const rawDirectory = path.resolve(parsed['raw-dir'] ?? defaults.rawDirectory)
const outputDirectory = path.resolve(parsed['out-dir'] ?? defaults.outputDirectory)

const printJson = (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
const transformSources = async () => {
  const report = {attempted: sources.length, transformed: 0, failed: [], missingCaptions: [], missingChapters: [], captionSources: [], documents: []}

  for (const source of sources) {
    try {
      const extracted = await readExtractedSource(rawDirectory, source.key)
      if (extracted.error) {
        report.failed.push({source: source.key, error: extracted.error})
        continue
      }
      const document = createVideoDocument(source, extracted)
      const errors = validateVideoDocument(document)
      if (errors.length) {
        report.failed.push({source: source.key, error: errors.join('; ')})
        continue
      }
      if (!extracted.vtt) report.missingCaptions.push(source.key)
      else report.captionSources.push({source: source.key, language: extracted.captionLanguage ?? null, type: extracted.captionSource ?? 'unknown'})
      if (document.chapters.length === 0) report.missingChapters.push(source.key)
      report.documents.push(document)
      report.transformed += 1
    } catch (error) {
      report.failed.push({source: source.key, error: error.message})
    }
  }

  return report
}

if (command === 'help' || command === '--help') {
  process.stdout.write(`Vertex offline video ingestion\n\nCommands:\n  inventory                    Validate and count the supplied inventory\n  extract [--source key]       Fetch metadata and English captions with yt-dlp\n  transform [--source key]     Build Sanity NDJSON from raw extraction files\n  validate [--source key]      Validate transformed data without writing files\n  import [--source key]        Import the generated NDJSON (requires SANITY_API_WRITE_TOKEN)\n\nOptions: --source <inventory-key> --limit <number> --raw-dir <path> --out-dir <path>\n`)
} else if (command === 'inventory') {
  printJson({sources: sources.length, providers: [...new Set(sources.map((source) => source.provider))]})
} else if (command === 'extract') {
  await assertYtDlp(parsed['yt-dlp'] ?? defaults.binary)
  const report = {attempted: sources.length, extracted: 0, failed: []}
  for (const source of sources) {
    try {
      await extractYoutube(source, {rawDirectory, binary: parsed['yt-dlp'] ?? defaults.binary})
      report.extracted += 1
    } catch (error) {
      report.failed.push({source: source.key, error: error.message})
    }
  }
  await writeText(path.join(outputDirectory, 'extract-report.json'), JSON.stringify(report, null, 2))
  printJson(report)
} else if (command === 'transform' || command === 'validate' || command === 'import') {
  const report = await transformSources()
  const documents = report.documents
  delete report.documents
  report.chunks = documents.reduce((total, document) => total + document.chunks.length, 0)
  report.chapters = documents.reduce((total, document) => total + document.chapters.length, 0)

  if (command === 'transform' || command === 'import') {
    await mkdir(outputDirectory, {recursive: true})
    await writeText(path.join(outputDirectory, 'video-documents.ndjson'), documents.map((document) => JSON.stringify(document)).join('\n'))
    await writeText(path.join(outputDirectory, 'transform-report.json'), JSON.stringify(report, null, 2))
    await writeText(path.join(outputDirectory, 'transform-report.md'), reportAsMarkdown(report))
  }

  if (command === 'import') {
    if (!process.env.SANITY_API_WRITE_TOKEN) throw new Error('SANITY_API_WRITE_TOKEN is required for import')
    if (documents.length === 0) throw new Error('No validated video documents are available to import')
    const ndjson = path.join(outputDirectory, 'video-documents.ndjson')
    await new Promise((resolve, reject) => {
      const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'
      const child = spawn(npx, ['sanity', 'dataset', 'import', ndjson, 'production', '--replace'], {
        stdio: 'inherit',
        env: {...process.env, SANITY_AUTH_TOKEN: process.env.SANITY_API_WRITE_TOKEN},
      })
      child.on('error', reject)
      child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Sanity import exited with ${code}`)))
    })
  }
  printJson(report)
} else {
  throw new Error(`Unknown ingestion command: ${command}`)
}
