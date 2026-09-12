'use client'

import {useRouter} from 'next/navigation'
import {type FormEvent, type RefObject, useState} from 'react'

import {Icon} from './design-system'
import {getSafeSearchQueryProperties} from '../lib/analytics'
import {captureEvent} from '../lib/posthog-client'
import type {SearchResponse} from '../../sanity/lib/search-types'

type IntelligentSearchFormProps = {
  className: string
  defaultValue?: string
  inputRef?: RefObject<HTMLInputElement | null>
  label: string
  placeholder: string
  searchSurface: 'home' | 'search_results'
}

export function IntelligentSearchForm({className, defaultValue, inputRef, label, placeholder, searchSurface}: IntelligentSearchFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const formData = new FormData(event.currentTarget)
    const query = String(formData.get('q') ?? '').trim()
    const fallbackUrl = `/search?${new URLSearchParams({q: query, tracked: '1'})}`

    if (query.length < 2 || query.length > 240) {
      router.push(fallbackUrl)
      return
    }

    setIsSubmitting(true)
    captureEvent('search_performed', {...getSafeSearchQueryProperties(query), search_surface: searchSurface})

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({query}),
      })
      const payload = await response.json() as SearchResponse
      const bestVideoResult = response.ok ? payload.results.find((result) => result.kind === 'video') : undefined

      if (bestVideoResult) {
        router.push(`/lessons/${bestVideoResult.lessonSlug}?start=${bestVideoResult.startSeconds}`)
        return
      }
    } catch {
      // The full results page provides the established error state for unavailable search.
    }

    router.push(fallbackUrl)
  }

  return <form action="/search" aria-busy={isSubmitting} className={className} onSubmit={submitSearch}>
    <Icon name="search" />
    <input defaultValue={defaultValue} name="q" aria-label={label} placeholder={placeholder} ref={inputRef} />
    <kbd aria-hidden="true">⌘ K</kbd>
    <button className="sr-only" disabled={isSubmitting} type="submit">Search</button>
  </form>
}
