import {z} from 'zod'

import {runIntelligentSearch, SearchConfigurationError} from '../../../sanity/lib/search'

const requestSchema = z.object({query: z.string().trim().min(2).max(240)})

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json())
    return Response.json(await runIntelligentSearch(body.query))
  } catch (error) {
    if (error instanceof z.ZodError) return Response.json({message: 'Enter a search question between 2 and 240 characters.'}, {status: 400})
    if (error instanceof SearchConfigurationError) return Response.json({message: 'Intelligent search is not configured yet.'}, {status: 503})
    console.error('Vertex search failed', error)
    return Response.json({message: 'Search could not finish. Please try again.'}, {status: 500})
  }
}
