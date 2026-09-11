import assert from 'node:assert/strict'
import {execFile} from 'node:child_process'
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {promisify} from 'node:util'
import test from 'node:test'
import {fileURLToPath} from 'node:url'

import {toDocumentId} from '../lib/inventory.mjs'
import {readExtractedSource} from '../lib/files.mjs'
import {chaptersFromInfo, chunksFromVtt, createVideoDocument, validateVideoDocument} from '../lib/transform.mjs'
import {parseVtt, secondsFromTimestamp} from '../lib/vtt.mjs'

const fixture = (name) => readFile(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8')
const run = promisify(execFile)

test('parses WebVTT timestamps and removes repeated automatic-caption cues', async () => {
  const cues = parseVtt(await fixture('sample.en.vtt'))
  assert.equal(secondsFromTimestamp('01:02:03.500'), 3723)
  assert.deepEqual(cues, [
    {startSeconds: 0, text: 'Hello & welcome.'},
    {startSeconds: 5, text: 'Today we will build a route handler.'},
    {startSeconds: 9, text: 'handler. Next we validate the request.'},
    {startSeconds: 55, text: 'Now we validate the request on the server.'},
  ])
})

test('creates stable, source-derived chapters and short chunks', async () => {
  const info = JSON.parse(await fixture('sample.info.json'))
  const vtt = await fixture('sample.en.vtt')
  const chapters = chaptersFromInfo(info)
  const chunks = chunksFromVtt(vtt)
  assert.deepEqual(chapters.map(({startSeconds, label}) => ({startSeconds, label})), [
    {startSeconds: 0, label: 'Introduction'},
    {startSeconds: 42, label: 'Route handlers'},
  ])
  assert.equal(chunks.length, 2)
  assert.equal(chunks[0].startSeconds, 0)
  assert.equal(chunks[1].startSeconds, 55)
  assert.equal(chunks[0].text, 'Hello & welcome. Today we will build a route handler. Next we validate the request.')
  assert.match(chunks[0]._key, /^chunk-/)
})

test('builds a valid deterministic Sanity document without fabricated metadata', async () => {
  const source = {key: 'example-route-handlers', id: 'abc123', title: 'Fallback title', url: 'https://www.youtube.com/watch?v=abc123', provider: 'youtube'}
  const info = JSON.parse(await fixture('sample.info.json'))
  const vtt = await fixture('sample.en.vtt')
  const first = createVideoDocument(source, {info, vtt, captionLanguage: 'en'})
  const second = createVideoDocument(source, {info, vtt, captionLanguage: 'en'})
  assert.equal(first._id, toDocumentId(source.key))
  assert.equal(first.captionLanguage, 'en')
  assert.deepEqual(first, second)
  assert.deepEqual(validateVideoDocument(first), [])
  const withoutSourceData = createVideoDocument(source, {})
  assert.deepEqual(withoutSourceData.chapters, [])
  assert.deepEqual(withoutSourceData.chunks, [])
})

test('identifies the selected local caption file and its source metadata', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'vertex-ingestion-'))
  const sourceDirectory = path.join(directory, 'example')
  await mkdir(sourceDirectory)
  await writeFile(path.join(sourceDirectory, 'abc123.info.json'), await fixture('sample.info.json'))
  await writeFile(path.join(sourceDirectory, 'abc123.en.vtt'), await fixture('sample.en.vtt'))

  try {
    const extracted = await readExtractedSource(directory, 'example')
    assert.equal(extracted.captionLanguage, 'en')
    assert.equal(extracted.captionSource, 'manual')
    assert.equal(extracted.error, null)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})

test('the CLI writes validated NDJSON from local extraction artifacts', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'vertex-ingestion-cli-'))
  const rawDirectory = path.join(directory, 'raw')
  const outputDirectory = path.join(directory, 'output')
  const sourceKey = 'nextjs-app-router-in-depth-file-system-routing'
  const sourceDirectory = path.join(rawDirectory, sourceKey)
  const cli = fileURLToPath(new URL('../cli.mjs', import.meta.url))
  await mkdir(sourceDirectory, {recursive: true})
  await writeFile(path.join(sourceDirectory, '9602Yzvd7ik.info.json'), await fixture('sample.info.json'))
  await writeFile(path.join(sourceDirectory, '9602Yzvd7ik.en.vtt'), await fixture('sample.en.vtt'))

  try {
    await run(process.execPath, [cli, 'transform', '--source', sourceKey, '--raw-dir', rawDirectory, '--out-dir', outputDirectory])
    const documents = (await readFile(path.join(outputDirectory, 'video-documents.ndjson'), 'utf8')).trim().split('\n').map(JSON.parse)
    assert.equal(documents.length, 1)
    assert.equal(documents[0].sourceId, '9602Yzvd7ik')
    assert.equal(documents[0].chapters.length, 2)
    assert.equal(documents[0].chunks.length, 2)
  } finally {
    await rm(directory, {recursive: true, force: true})
  }
})
