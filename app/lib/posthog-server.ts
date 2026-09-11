import 'server-only'

import {PostHog} from 'posthog-node'

import type {AnalyticsEventName, AnalyticsProperties} from './analytics'

const projectToken = process.env.POSTHOG_SERVER_API_KEY
const apiHost = process.env.POSTHOG_HOST

export async function captureServerEvent(distinctId: string | null, event: AnalyticsEventName, properties: AnalyticsProperties) {
  if (!distinctId || !projectToken) return

  const client = new PostHog(projectToken, {
    flushAt: 1,
    flushInterval: 0,
    host: apiHost,
  })

  try {
    client.capture({distinctId, event, properties})
    await client.shutdown()
  } catch {
    // Analytics is intentionally best-effort and must not affect product requests.
  }
}
