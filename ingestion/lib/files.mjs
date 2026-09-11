import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises'
import path from 'node:path'

const infoSuffix = '.info.json'

export async function readExtractedSource(rawDirectory, sourceKey) {
  const directory = path.join(rawDirectory, sourceKey)
  let names
  try {
    names = await readdir(directory)
  } catch (error) {
    if (error.code === 'ENOENT') return {info: null, vtt: null, captionLanguage: null, error: 'No extracted files'}
    throw error
  }

  const infoName = names.find((name) => name.endsWith(infoSuffix))
  const captionNames = names.filter((name) => name.endsWith('.vtt'))
  const selectedCaption = captionNames.find((name) => /\.en\.vtt$/i.test(name))
    ?? captionNames.find((name) => /\.en[-_]/i.test(name))
    ?? captionNames[0]

  const info = infoName ? JSON.parse(await readFile(path.join(directory, infoName), 'utf8')) : null
  const vtt = selectedCaption ? await readFile(path.join(directory, selectedCaption), 'utf8') : null
  const languageMatch = selectedCaption?.match(/\.([a-z]{2}(?:[-_][a-z]{2,})?)\.vtt$/i)
  const captionLanguage = languageMatch?.[1]?.replace('_', '-')
  const includesLanguage = (captions) => Object.keys(captions ?? {}).some((language) => language.toLowerCase() === captionLanguage?.toLowerCase())
  const captionSource = !vtt ? null : includesLanguage(info?.subtitles)
    ? 'manual'
    : includesLanguage(info?.automatic_captions)
      ? 'automatic'
      : 'unknown'

  return {info, vtt, captionLanguage, captionSource, error: info ? null : 'Missing info JSON'}
}

export async function writeText(pathname, contents) {
  await mkdir(path.dirname(pathname), {recursive: true})
  await writeFile(pathname, contents, 'utf8')
}
