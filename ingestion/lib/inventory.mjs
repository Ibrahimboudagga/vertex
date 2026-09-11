import {readFile} from 'node:fs/promises'

const youtubeHost = /(^|\.)((youtube\.com)|(youtu\.be))$/i

export const toDocumentId = (value) => `video.${value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}`

export const providerForUrl = (value) => {
  try {
    const url = new URL(value)
    return youtubeHost.test(url.hostname) ? 'youtube' : null
  } catch {
    return null
  }
}

export const sourceUrlFor = (source) => `https://www.youtube.com/watch?v=${source.id}`

export async function readInventory(path) {
  const parsed = JSON.parse(await readFile(path, 'utf8'))
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error(`Expected an object inventory in ${path}`)
  }

  return Object.entries(parsed).map(([key, value]) => {
    if (!value || typeof value.id !== 'string' || typeof value.title !== 'string') {
      throw new Error(`Invalid inventory entry: ${key}`)
    }

    const source = {
      key,
      id: value.id,
      title: value.title,
      url: sourceUrlFor(value),
      provider: 'youtube',
    }

    return source
  })
}

export function filterInventory(sources, {sourceKey, limit} = {}) {
  const selected = sourceKey ? sources.filter((source) => source.key === sourceKey) : sources
  if (sourceKey && selected.length === 0) throw new Error(`No inventory source matches "${sourceKey}"`)
  return Number.isInteger(limit) && limit >= 0 ? selected.slice(0, limit) : selected
}
