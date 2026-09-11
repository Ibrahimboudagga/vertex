'use client'

import Image from 'next/image'
import Link from 'next/link'
import {useEffect, useMemo, useState} from 'react'

import {Icon} from '../components/design-system'
import type {SearchResponse, SearchResult} from '../../sanity/lib/search-types'

type SearchState = {status: 'idle' | 'loading' | 'ready' | 'error'; data?: SearchResponse; message?: string}

export function SearchResults({query}: {query: string}) {
  const [state, setState] = useState<SearchState>(query ? {status: 'loading'} : {status: 'idle'})
  const [sort, setSort] = useState<'relevance' | 'title'>('relevance')

  useEffect(() => {
    if (!query) return

    const controller = new AbortController()
    fetch('/api/search', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({query}), signal: controller.signal})
      .then(async (response) => {
        const payload = await response.json()
        if (!response.ok) throw new Error(payload.message || 'Search could not finish.')
        return payload as SearchResponse
      })
      .then((data) => setState({status: 'ready', data}))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({status: 'error', message: error instanceof Error ? error.message : 'Search could not finish.'})
      })

    return () => controller.abort()
  }, [query])

  const results = useMemo(() => {
    const items = [...(state.data?.results ?? [])]
    return sort === 'title' ? items.sort((a, b) => a.lessonTitle.localeCompare(b.lessonTitle)) : items.sort((a, b) => b.relevance - a.relevance)
  }, [sort, state.data?.results])

  if (!query || state.status === 'idle') return <SearchEmpty />
  if (state.status === 'loading') return <section className="search-feedback" aria-live="polite"><span className="search-spinner" aria-hidden="true" /><h2>Searching your learning</h2><p>Looking through courses, lessons, and video moments.</p></section>
  if (state.status === 'error') return <section className="search-feedback search-error" role="alert"><h2>Search is unavailable</h2><p>{state.message}</p><Link href="/courses">Browse all courses <Icon name="chevron" /></Link></section>
  if (!state.data || results.length === 0) return <SearchEmpty query={query} />

  return <section className="search-results" aria-live="polite">
    <div className="search-results-top">
      <p>Found <strong>{state.data.resultCount}</strong> {state.data.resultCount === 1 ? 'result' : 'results'} across <strong>{state.data.courseCount}</strong> {state.data.courseCount === 1 ? 'course' : 'courses'}.</p>
      <label className="search-sort">Sort by
        <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
          <option value="relevance">Most relevant</option>
          <option value="title">Lesson title</option>
        </select>
      </label>
    </div>
    <div className="search-result-list">{results.map((result) => result.kind === 'video' ? <VideoResultCard key={result.id} result={result} /> : <LessonResultCard key={result.id} result={result} />)}</div>
  </section>
}

function SearchEmpty({query}: {query?: string}) {
  return <section className="search-feedback search-empty"><Icon name="search" /><h2>{query ? 'No matching lessons yet' : 'What would you like to learn?'}</h2><p>{query ? `Vertex could not find a grounded result for “${query}”. Try a topic, technology, or concept.` : 'Search every Vertex course in plain English.'}</p><Link href="/courses">Browse all courses <Icon name="chevron" /></Link></section>
}

function CardArt({result}: {result: SearchResult}) {
  const image = result.kind === 'video' ? result.thumbnailUrl : result.course.coverImageUrl
  return <div className="search-result-art">{image ? <Image src={image} alt="" fill sizes="112px" /> : <span aria-hidden="true">{result.course.title.charAt(0)}</span>}</div>
}

function ResultMeta({result}: {result: SearchResult}) {
  return <p className="search-result-meta"><span>{result.course.title}</span><i>•</i><span>Lesson {result.moduleNumber}.{result.lessonNumber} in {result.moduleTitle}</span></p>
}

function VideoResultCard({result}: {result: Extract<SearchResult, {kind: 'video'}>}) {
  return <article className="search-result-card search-video-card"><CardArt result={result} /><div className="search-result-copy"><span className="search-result-kind">Video moment <em>{result.matchLabel}</em></span><h2>{result.lessonTitle}</h2><ResultMeta result={result} /><p>{result.description}</p><Link href={`/lessons/${result.lessonSlug}?start=${result.startSeconds}`}>Watch from {result.timestampLabel} <Icon name="chevron" /></Link></div></article>
}

function LessonResultCard({result}: {result: Extract<SearchResult, {kind: 'lesson'}>}) {
  return <article className="search-result-card"><CardArt result={result} /><div className="search-result-copy"><span className="search-result-kind">Lesson</span><h2>{result.lessonTitle}</h2><ResultMeta result={result} /><p>{result.description}</p>{result.keyPoints.length > 0 && <ul>{result.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul>}<Link href={`/lessons/${result.lessonSlug}`}>Open lesson <Icon name="chevron" /></Link></div></article>
}
