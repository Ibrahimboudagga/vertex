import 'server-only'

import {createMCPClient} from '@ai-sdk/mcp'
import {createOpenAI} from '@ai-sdk/openai'
import {generateText, stepCountIs} from 'ai'
import {defineQuery} from 'next-sanity'
import {z} from 'zod'

import {dataset, projectId} from '../env'
import {vertexSanityFetch} from './fetch'
import {urlFor} from './image'
import type {SearchResponse, SearchResult} from './search-types'

const MAX_RESULTS = 150
const CONTEXT_API_VERSION = '2026-03-03'

const searchPlanSchema = z.object({
  results: z.array(z.discriminatedUnion('kind', [
    z.object({kind: z.literal('lesson'), lessonId: z.string().min(1)}),
    z.object({kind: z.literal('video'), lessonId: z.string().min(1), startSeconds: z.number().int().nonnegative(), matchType: z.enum(['chapter', 'transcript'])}),
  ])).max(MAX_RESULTS),
})

const SEARCH_LESSON_CONTEXT_QUERY = defineQuery(`
  *[_type == "lesson" && _id in $lessonIds] {
    _id, title, "slug": slug.current, videoUrl, keyPoints, "notesText": pt::text(notes),
    thumbnail {asset, hotspot, crop, alt},
    "course": *[_type == "course" && references(^._id)][0] {
      _id, title, "slug": slug.current, summary, coverImage {asset, hotspot, crop, alt},
      modules[] {_key, title, summary, "lessonIds": lessons[]._ref}
    }
  }
`)

const VIDEO_MOMENT_QUERY = defineQuery(`
  *[_type == "video" && url == $url][0] {
    "chapter": chapters[startSeconds == $startSeconds][0] {startSeconds, label},
    "chunk": chunks[startSeconds == $startSeconds][0] {startSeconds, text}
  }
`)

type SanityImage = {asset?: {_ref?: string}; hotspot?: unknown; crop?: unknown; alt?: string}
type LessonContext = {
  _id: string
  title: string
  slug?: string
  videoUrl?: string
  keyPoints?: string[]
  notesText?: string
  thumbnail?: SanityImage
  course?: {
    _id: string
    title: string
    slug?: string
    summary?: string
    coverImage?: SanityImage
    modules?: Array<{_key: string; title: string; summary?: string; lessonIds?: string[]}>
  }
}

type VideoMoment = {chapter?: {startSeconds: number; label: string}; chunk?: {startSeconds: number; text: string}}

export class SearchConfigurationError extends Error {}

function requireEnvironment(name: 'SANITY_API_READ_TOKEN' | 'OPENROUTER_API_KEY' | 'OPENROUTER_MODEL') {
  const value = process.env[name]
  if (!value) throw new SearchConfigurationError(`Missing ${name} for intelligent search.`)
  return value
}

function getContextMcpUrl() {
  const configuredUrl = process.env.SANITY_CONTEXT_MCP_URL
  const url = configuredUrl || `https://api.sanity.io/v${CONTEXT_API_VERSION}/context/mcp/${projectId}/${dataset}/${process.env.SANITY_CONTEXT_SLUG || 'vertex-search'}`

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') throw new Error('Context MCP URL must use HTTPS.')
    return parsed.toString().replace(/\/$/, '')
  } catch {
    throw new SearchConfigurationError('SANITY_CONTEXT_MCP_URL is not a valid HTTPS URL.')
  }
}

async function getInitialContext(mcpUrl: string, token: string) {
  const response = await fetch(`${mcpUrl}/initial-context`, {headers: {Authorization: `Bearer ${token}`}, next: {revalidate: 300}})
  if (!response.ok) throw new SearchConfigurationError('Sanity Context initial context is unavailable. Deploy the Studio and verify the Viewer token.')
  return response.text()
}

function parsePlan(text: string) {
  const candidate = text.match(/\{[\s\S]*\}/)?.[0]
  if (!candidate) throw new Error('The search model returned no structured result plan.')
  return searchPlanSchema.parse(JSON.parse(candidate))
}

function textExcerpt(value?: string) {
  const text = value?.replace(/\s+/g, ' ').trim() || 'Open this lesson to explore the topic in context.'
  return text.length > 190 ? `${text.slice(0, 187).trimEnd()}…` : text
}

function imageUrl(image?: SanityImage, width = 160) {
  return image?.asset?._ref ? urlFor(image).width(width).height(width).fit('crop').url() : undefined
}

function timestampLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return minutes ? `${minutes}:${String(remainingSeconds).padStart(2, '0')}` : `0:${String(remainingSeconds).padStart(2, '0')}`
}

function lessonPosition(lesson: LessonContext) {
  const course = lesson.course
  const moduleIndex = course?.modules?.findIndex((module) => module.lessonIds?.includes(lesson._id)) ?? -1
  const courseModule = moduleIndex >= 0 ? course?.modules?.[moduleIndex] : undefined
  const lessonIndex = courseModule?.lessonIds?.indexOf(lesson._id) ?? -1
  return {courseModule, moduleNumber: moduleIndex + 1, lessonNumber: lessonIndex + 1}
}

async function getLessonContexts(lessonIds: string[]) {
  return vertexSanityFetch<typeof SEARCH_LESSON_CONTEXT_QUERY, LessonContext[]>({query: SEARCH_LESSON_CONTEXT_QUERY, params: {lessonIds}, revalidate: 60})
}

async function getVideoMoment(url: string, startSeconds: number) {
  return vertexSanityFetch<typeof VIDEO_MOMENT_QUERY, VideoMoment | null>({query: VIDEO_MOMENT_QUERY, params: {url, startSeconds}, revalidate: 60})
}

export async function runIntelligentSearch(query: string): Promise<SearchResponse> {
  const sanityToken = requireEnvironment('SANITY_API_READ_TOKEN')
  const openRouterKey = requireEnvironment('OPENROUTER_API_KEY')
  const modelId = requireEnvironment('OPENROUTER_MODEL')
  const mcpUrl = getContextMcpUrl()
  const initialContext = await getInitialContext(mcpUrl, sanityToken)
  const mcpClient = await createMCPClient({
    clientName: 'vertex-search',
    protocolVersionDiscovery: false,
    transport: {type: 'http', url: mcpUrl, headers: {Authorization: `Bearer ${sanityToken}`}},
  })

  try {
    const {initial_context: initialContextTool, ...tools} = await mcpClient.tools()
    void initialContextTool
    const openRouter = createOpenAI({name: 'openrouter', baseURL: 'https://openrouter.ai/api/v1', apiKey: openRouterKey, headers: {'X-OpenRouter-Title': 'Vertex'}})
    const result = await generateText({
      model: openRouter(modelId),
      tools,
      stopWhen: stepCountIs(8),
      timeout: 30_000,
      instructions: `You are Vertex's read-only learning search planner. Use the provided Sanity Context tools to find courses and lessons. Return no prose, only a JSON object matching the requested format. Every ID and timestamp must come from tool output. Search both lesson topics and video moments. Prefer an exact title match over a broad note match; for video moments, query chapter labels before transcript chunks. If nothing matches, return an empty results array. Do not invent courses, lessons, descriptions, or timestamps.\n\nSanity Context initial schema:\n${initialContext}`,
      prompt: `Find every relevant Vertex learning result for: ${JSON.stringify(query)}\n\nAfter using the tools, return exactly this JSON shape:\n{"results":[{"kind":"lesson","lessonId":"sanity-document-id"},{"kind":"video","lessonId":"sanity-document-id","startSeconds":0,"matchType":"chapter"}]}`,
    })
    const plan = parsePlan(result.text)
    const lessonIds = [...new Set(plan.results.map((item) => item.lessonId))]
    const lessonsById = new Map((await getLessonContexts(lessonIds)).map((lesson) => [lesson._id, lesson]))
    const results: SearchResult[] = []
    const seen = new Set<string>()

    for (const item of plan.results) {
      const lesson = lessonsById.get(item.lessonId)
      const course = lesson?.course
      const {courseModule, moduleNumber, lessonNumber} = lesson ? lessonPosition(lesson) : {}
      if (!lesson || !course || !lesson.slug || !course.slug || !courseModule || !moduleNumber || !lessonNumber) continue

      const base = {
        id: `${item.kind}:${lesson._id}:${item.kind === 'video' ? item.startSeconds : ''}`,
        course: {id: course._id, title: course.title, slug: course.slug, coverImageUrl: imageUrl(course.coverImage)},
        moduleTitle: courseModule.title,
        moduleNumber,
        lessonNumber,
        lessonTitle: lesson.title,
        lessonSlug: lesson.slug,
        thumbnailUrl: imageUrl(lesson.thumbnail),
        relevance: MAX_RESULTS - results.length,
      }

      if (item.kind === 'lesson') {
        if (!seen.has(base.id)) {
          seen.add(base.id)
          results.push({...base, kind: 'lesson', description: textExcerpt(lesson.notesText || courseModule.summary || course.summary), keyPoints: lesson.keyPoints?.slice(0, 3) ?? []})
        }
        continue
      }

      if (!lesson.videoUrl) continue
      const moment = await getVideoMoment(lesson.videoUrl, item.startSeconds)
      const matched = item.matchType === 'chapter' ? moment?.chapter : moment?.chunk
      if (!matched || seen.has(base.id)) continue

      seen.add(base.id)
      results.push({...base, kind: 'video', description: textExcerpt(item.matchType === 'chapter' ? moment?.chapter?.label : moment?.chunk?.text), startSeconds: item.startSeconds, timestampLabel: timestampLabel(item.startSeconds), matchLabel: item.matchType === 'chapter' ? 'Chapter match' : 'Transcript match'})
    }

    return {query, resultCount: results.length, courseCount: new Set(results.map((item) => item.course.id)).size, results}
  } finally {
    await mcpClient.close()
  }
}
