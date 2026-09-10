import 'server-only'

import type {QueryParams} from 'next-sanity'

import {readClient} from './client'

type SanityFetchOptions<QueryString extends string> = {
  query: QueryString
  params?: QueryParams
  tags?: string[]
  revalidate?: number | false
}

export function vertexSanityFetch<const QueryString extends string, Result>({
  query,
  params = {},
  tags = [],
  revalidate = 60,
}: SanityFetchOptions<QueryString>) {
  return readClient.fetch<Result>(query, params, {
    next: {
      revalidate: tags.length ? false : revalidate,
      tags,
    },
  })
}
