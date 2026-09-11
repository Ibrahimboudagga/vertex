'use client'

import posthog from 'posthog-js'

import type {AnalyticsEventName, AnalyticsProperties} from './analytics'

const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
)

export function captureEvent(event: AnalyticsEventName, properties?: AnalyticsProperties) {
  if (isConfigured) posthog.capture(event, properties)
}

export function identifyUser(distinctId: string) {
  if (isConfigured) posthog.identify(distinctId)
}

export function resetUser() {
  if (isConfigured) posthog.reset()
}
