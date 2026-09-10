'use client'

import posthog from 'posthog-js'

const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST,
)

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (isConfigured) posthog.capture(event, properties)
}

export function identifyUser(distinctId: string, properties?: Record<string, unknown>) {
  if (isConfigured) posthog.identify(distinctId, properties)
}

export function resetUser() {
  if (isConfigured) posthog.reset()
}
