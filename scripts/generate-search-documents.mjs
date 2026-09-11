process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') process.exit(0)
  throw error
})

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

process.stdout.write(JSON.stringify(contextDocument))
