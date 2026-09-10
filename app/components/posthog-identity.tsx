'use client'

import {useUser} from '@clerk/nextjs'
import {useEffect, useRef} from 'react'

import {identifyUser, resetUser} from '../lib/posthog-client'

export function PostHogIdentity() {
  const {isLoaded, user} = useUser()
  const previousUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (!isLoaded) return

    const currentUserId = user?.id ?? null
    if (previousUserId.current && previousUserId.current !== currentUserId) resetUser()

    if (user) {
      identifyUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        role: typeof user.publicMetadata.role === 'string' ? user.publicMetadata.role : undefined,
      })
    }

    previousUserId.current = currentUserId
  }, [isLoaded, user])

  return null
}
