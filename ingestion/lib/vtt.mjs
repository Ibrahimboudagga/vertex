const timestampPattern = /^(?:(\d{2,}):)?(\d{2}):(\d{2}(?:\.\d{1,3})?)$/

export function secondsFromTimestamp(value) {
  const match = timestampPattern.exec(value.trim())
  if (!match) throw new Error(`Invalid WebVTT timestamp: ${value}`)
  const [, hours = '0', minutes, seconds] = match
  return Math.floor(Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds))
}

export function cleanCueText(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseVtt(value) {
  const blocks = value.replace(/^\uFEFF/, '').replace(/\r/g, '').split(/\n{2,}/)
  const cues = []

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    const timingIndex = lines.findIndex((line) => line.includes('-->'))
    if (timingIndex === -1) continue

    const [start] = lines[timingIndex].split('-->').map((part) => part.trim().split(/\s+/)[0])
    const text = cleanCueText(lines.slice(timingIndex + 1).join(' '))
    if (!text) continue

    cues.push({startSeconds: secondsFromTimestamp(start), text})
  }

  return cues.filter((cue, index) => index === 0 || cue.text.toLowerCase() !== cues[index - 1].text.toLowerCase())
}

export function chunkCues(cues, {maxCharacters = 360, maxGapSeconds = 8, maxSpanSeconds = 50} = {}) {
  const chunks = []
  let current = null

  for (const cue of cues) {
    if (!current) {
      current = {startSeconds: cue.startSeconds, text: cue.text, lastSeconds: cue.startSeconds}
      continue
    }

    const existingWords = current.text.split(/\s+/)
    const incomingWords = cue.text.split(/\s+/)
    let overlap = Math.min(existingWords.length, incomingWords.length)
    while (overlap > 0 && existingWords.slice(-overlap).join(' ').toLowerCase() !== incomingWords.slice(0, overlap).join(' ').toLowerCase()) {
      overlap -= 1
    }
    const mergedText = [...existingWords, ...incomingWords.slice(overlap)].join(' ')
    const exceedsBoundary = mergedText.length > maxCharacters
      || cue.startSeconds - current.lastSeconds > maxGapSeconds
      || cue.startSeconds - current.startSeconds > maxSpanSeconds

    if (exceedsBoundary) {
      chunks.push({startSeconds: current.startSeconds, text: current.text})
      current = {startSeconds: cue.startSeconds, text: cue.text, lastSeconds: cue.startSeconds}
    } else {
      current.text = mergedText
      current.lastSeconds = cue.startSeconds
    }
  }

  if (current) chunks.push({startSeconds: current.startSeconds, text: current.text})
  return chunks
}
