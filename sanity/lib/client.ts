import 'server-only'

import {createClient} from 'next-sanity'

import {apiVersion, dataset, projectId} from '../env'

export const readClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: true,
  perspective: 'published',
})
