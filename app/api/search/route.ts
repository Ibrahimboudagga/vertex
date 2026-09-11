import {auth} from '@clerk/nextjs/server'
import {z} from 'zod'

import {getSafeSearchQueryProperties} from '../../lib/analytics'
import {captureServerEvent} from '../../lib/posthog-server'
import {runIntelligentSearch, SearchConfigurationError} from '../../../sanity/lib/search'

const requestSchema = z.object({query: z.string().trim().min(2).max(240)})

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const startedAt = performance.now()
  let query = ''
  const {userId} = await auth()

  try {
    const body = requestSchema.parse(await request.json())
    query = body.query
    const result = await runIntelligentSearch(query)
    await captureServerEvent(userId, 'search_execution_completed', {
      ...getSafeSearchQueryProperties(query),
      course_count: result.courseCount,
      elapsed_milliseconds: Math.round(performance.now() - startedAt),
      lesson_result_count: result.results.filter((item) => item.kind === 'lesson').length,
      result_count: result.resultCount,
      video_result_count: result.results.filter((item) => item.kind === 'video').length,
    })
    return Response.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({message: 'Enter a search question between 2 and 240 characters.'}, {status: 400})
    const errorCategory = error instanceof SearchConfigurationError ? 'configuration' : 'internal'
    await captureServerEvent(userId, 'search_execution_failed', {
      ...getSafeSearchQueryProperties(query),
      elapsed_milliseconds: Math.round(performance.now() - startedAt),
      error_category: errorCategory,
    })
    if (error instanceof SearchConfigurationError) return Response.json({message: 'Intelligent search is not configured yet.'}, {status: 503})
    console.error('Vertex search failed', error)
    return Response.json({message: 'Search could not finish. Please try again.'}, {status: 500})
  }
}
