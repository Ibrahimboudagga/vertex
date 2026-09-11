'use client'

import Image from 'next/image'
import Link from 'next/link'
import {useEffect, useMemo, useRef, useState} from 'react'

import {Icon} from '../components/design-system'
import type {SearchResponse, SearchResult} from '../../sanity/lib/search-types'

type SearchState = {status: 'idle' | 'loading' | 'ready' | 'error'; data?: SearchResponse; message?: string}

export function SearchExperience({query}: {query: string}) {
  const [state, setState] = useState<SearchState>(query ? {status: 'loading'} : {status: 'idle'})
  const [sort, setSort] = useState<'relevance' | 'title'>('relevance')
  const inputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const results = useMemo(() => {
    const items = [...(state.data?.results ?? [])]
    return sort === 'title' ? items.sort((a, b) => a.lessonTitle.localeCompare(b.lessonTitle)) : items.sort((a, b) => b.relevance - a.relevance)
  }, [sort, state.data?.results])
  const response = state.status === 'ready' ? state.data : undefined
  const hasResults = Boolean(response && results.length > 0)

  return <>
    <div className="search-results-hero">
      <span className="search-results-label">Search results</span>
      <h1 id="search-title">{query ? <>Results for <em>“{query}”</em></> : 'Search your learning'}</h1>
      {response && results.length > 0 && <p className="search-results-summary">Found {response.resultCount} {response.resultCount === 1 ? 'result' : 'results'} across {response.courseCount} {response.courseCount === 1 ? 'course' : 'courses'}</p>}
      <form className="search-results-form" action="/search">
        <Icon name="search" /><input ref={inputRef} defaultValue={query} name="q" aria-label="Search your learning" placeholder="Ask anything about your learning..." />
        <kbd aria-hidden="true">⌘ K</kbd>
      </form>
    </div>

    {!query || state.status === 'idle' ? <SearchEmpty /> : null}
    {state.status === 'loading' ? <SearchLoading /> : null}
    {state.status === 'error' ? <SearchError message={state.message} /> : null}
    {state.status === 'ready' && !hasResults ? <SearchEmpty query={query} /> : null}
    {response && results.length > 0 ? <section className="search-result-section" aria-live="polite">
      <div className="search-result-toolbar">
        <h2>{response.resultCount} {response.resultCount === 1 ? 'result' : 'results'}</h2>
        <label className="search-result-sort"><span className="sr-only">Sort results</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Sort results">
            <option value="relevance">Most relevant</option>
            <option value="title">Lesson title</option>
          </select>
        </label>
      </div>
      <div className="search-result-list">{results.map((result) => result.kind === 'video' ? <VideoResultCard key={result.id} result={result} /> : <LessonResultCard key={result.id} result={result} />)}</div>
    </section> : null}
  </>
}

function SearchEmpty({query}: {query?: string}) {
  return <section className="search-empty-callout"><span className="search-empty-icon"><Icon name="search" /></span><div><h2>{query ? 'Can’t find what you’re looking for?' : 'What would you like to learn?'}</h2><p>{query ? 'Try different keywords or browse our full course catalog.' : 'Search every Vertex course in plain English.'}</p></div><Link href="/courses">Browse all courses <Icon name="chevron" /></Link></section>
}

function SearchLoading() {
  return <section className="search-loading" aria-live="polite"><span className="search-spinner" aria-hidden="true" /><p>Searching courses, lessons, and video moments.</p></section>
}

function SearchError({message}: {message?: string}) {
  return <section className="search-empty-callout search-error" role="alert"><span className="search-empty-icon"><Icon name="search" /></span><div><h2>Search is unavailable</h2><p>{message}</p></div><Link href="/courses">Browse all courses <Icon name="chevron" /></Link></section>
}

function CourseLockup({result}: {result: SearchResult}) {
  return <p className="search-course-lockup"><span>{result.course.coverImageUrl ? <Image src={result.course.coverImageUrl} alt="" width={24} height={24} /> : result.course.title.charAt(0)}</span>{result.course.title}</p>
}

function ResultMeta({result}: {result: SearchResult}) {
  return <p className="search-result-meta"><span><Icon name="file" />Lesson {result.moduleNumber}.{result.lessonNumber}</span><i>•</i><span><Icon name="file" />{result.moduleTitle}</span></p>
}

function VideoArt({result}: {result: Extract<SearchResult, {kind: 'video'}>}) {
  return <div className="search-video-art">{result.thumbnailUrl ? <Image src={result.thumbnailUrl} alt="" fill sizes="(max-width: 680px) 100vw, 276px" /> : <span className="search-video-fallback">{result.course.title.charAt(0)}</span>}<span className="search-video-play"><Icon name="play" /></span><time>{result.timestampLabel}</time></div>
}

function LessonArt({result}: {result: Extract<SearchResult, {kind: 'lesson'}>}) {
  const points = result.keyPoints.length ? result.keyPoints : [result.description]
  return <div className="search-lesson-art"><Icon name="file" /><ul>{points.slice(0, 3).map((point) => <li key={point}>{point}</li>)}</ul><span>✓</span></div>
}

function VideoResultCard({result}: {result: Extract<SearchResult, {kind: 'video'}>}) {
  return <article className="search-result-card search-video-card"><VideoArt result={result} /><div className="search-result-copy"><CourseLockup result={result} /><h2>{result.lessonTitle}</h2><p>{result.description}</p><ResultMeta result={result} /></div><div className="search-result-action"><span className="search-result-kind">Video</span><Link href={`/lessons/${result.lessonSlug}?start=${result.startSeconds}`}><Icon name="play" />Watch from {result.timestampLabel}<Icon name="chevron" /></Link></div></article>
}

function LessonResultCard({result}: {result: Extract<SearchResult, {kind: 'lesson'}>}) {
  return <article className="search-result-card search-lesson-card"><LessonArt result={result} /><div className="search-result-copy"><CourseLockup result={result} /><h2>{result.lessonTitle}</h2><p>{result.description}</p><ResultMeta result={result} /></div><div className="search-result-action"><span className="search-result-kind search-result-kind-lesson">Lesson</span><Link href={`/lessons/${result.lessonSlug}`}>View lesson <Icon name="external" /><Icon name="chevron" /></Link></div></article>
}
