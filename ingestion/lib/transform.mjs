import {createHash} from 'node:crypto'

import {toDocumentId} from './inventory.mjs'
import {chunkCues, parseVtt} from './vtt.mjs'

const stableKey = (prefix, value) => `${prefix}-${createHash('sha256').update(value).digest('hex').slice(0, 12)}`

const cleanLabel = (value) => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''

export function chaptersFromInfo(info) {
  if (!Array.isArray(info?.chapters)) return []

  return info.chapters
    .map((chapter) => {
      const startSeconds = Math.floor(Number(chapter?.start_time))
      const label = cleanLabel(chapter?.title)
      if (!Number.isInteger(startSeconds) || startSeconds < 0 || !label) return null
      return {_key: stableKey('chapter', `${startSeconds}:${label}`), startSeconds, label}
    })
    .filter(Boolean)
    .sort((first, second) => first.startSeconds - second.startSeconds)
}

export function chunksFromVtt(vtt) {
  return chunkCues(parseVtt(vtt)).map((chunk) => ({
    _key: stableKey('chunk', `${chunk.startSeconds}:${chunk.text}`),
    ...chunk,
  }))
}

export function createVideoDocument(source, {info, vtt, captionLanguage} = {}) {
  const chapters = chaptersFromInfo(info)
  const chunks = vtt ? chunksFromVtt(vtt) : []

  return {
    _id: toDocumentId(source.key),
    _type: 'video',
    sourceId: source.id,
    url: source.url,
    sourceTitle: cleanLabel(info?.title) || source.title,
    provider: source.provider,
    ...(captionLanguage ? {captionLanguage} : {}),
    chapters,
    chunks,
  }
}

export function validateVideoDocument(document) {
  const errors = []
  if (!document._id?.startsWith('video.')) errors.push('Document id must start with video.')
  if (!document.sourceId) errors.push('sourceId is required')
  if (!document.url) errors.push('url is required')

  for (const [field, itemField] of [['chapters', 'label'], ['chunks', 'text']]) {
    if (!Array.isArray(document[field])) {
      errors.push(`${field} must be an array`)
      continue
    }
    for (const item of document[field]) {
      if (!Number.isInteger(item.startSeconds) || item.startSeconds < 0) errors.push(`${field} has an invalid timestamp`)
      if (!item[itemField]?.trim()) errors.push(`${field} has empty ${itemField}`)
      if (!item._key) errors.push(`${field} has no stable key`)
    }
  }

  return errors
}
