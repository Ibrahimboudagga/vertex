import {readFile} from 'node:fs/promises'

process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') process.exit(0)
  throw error
})

const sourceUrl = new URL('../app/studio/[[...tool]]/seed/videos.json', import.meta.url)
const records = JSON.parse(await readFile(sourceUrl, 'utf8'))

const contextDocument = {
  _id: 'sanity.agentContext.vertex-search',
  _type: 'sanity.agentContext',
  title: 'Vertex intelligent search',
  slug: {_type: 'slug', current: 'vertex-search'},
  groqFilter: '!(_id in path("drafts.**")) && _type in ["course", "lesson", "instructor", "category", "video"]',
  instructions: `- Courses contain ordered module objects and modules contain ordered lesson references. To find a lesson's course, use a reverse reference from course to lesson; derive module and lesson numbers from array order.
- Lesson notes are Portable Text. Use pt::text(notes) for keyword matching; do not match the Portable Text array directly.
- A video document is an internal lookup linked to a lesson by video.url == lesson.videoUrl. Never show a video document as a standalone result.
- For a video moment, match video.chapters[].label first. Query video.chunks[].text only if no suitable chapter matches. Never return an entire chunks or chapters array; project just the matching item.
- Search words individually with wildcarded patterns and OR conditions. Prefer exact title matches over broad note matches.`,
}

const toDocumentId = (value) => `video.${value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-')}`
const videoDocuments = Object.entries(records).map(([key, video]) => ({
  _id: toDocumentId(key),
  _type: 'video',
  sourceId: video.id,
  url: `https://www.youtube.com/watch?v=${video.id}`,
  sourceTitle: video.title,
  chapters: [{_key: 'source-title', startSeconds: 0, label: video.title}],
  chunks: [],
}))

process.stdout.write([...videoDocuments, contextDocument].map((document) => JSON.stringify(document)).join('\n'))
