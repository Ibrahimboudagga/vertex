'use client'

import {PortableText, type PortableTextComponents} from 'next-sanity'
import {useState} from 'react'
import type {PortableTextBlock} from 'sanity'

type LessonContentTabsProps = {
  keyPoints: string[]
  notes?: PortableTextBlock[]
  overview?: string
  proTip?: string
}

const portableTextComponents: PortableTextComponents = {
  block: {
    h2: ({children}) => <h3>{children}</h3>,
    normal: ({children}) => <p>{children}</p>,
  },
  list: {
    bullet: ({children}) => <ul>{children}</ul>,
    number: ({children}) => <ol>{children}</ol>,
  },
}

export function LessonContentTabs({keyPoints, notes, overview, proTip}: LessonContentTabsProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'notes'>('content')

  return <section className="lesson-content-tabs" aria-label="Lesson information">
    <div className="lesson-tab-list" role="tablist" aria-label="Lesson views">
      <button aria-controls="lesson-content-panel" aria-selected={activeTab === 'content'} id="lesson-content-tab" onClick={() => setActiveTab('content')} role="tab" type="button">Lesson Content</button>
      <button aria-controls="lesson-notes-panel" aria-selected={activeTab === 'notes'} id="lesson-notes-tab" onClick={() => setActiveTab('notes')} role="tab" type="button">Notes</button>
    </div>

    {activeTab === 'content' ? <div aria-labelledby="lesson-content-tab" id="lesson-content-panel" role="tabpanel">
      {overview ? <section className="lesson-overview"><h2>Overview</h2><p>{overview}</p></section> : null}
      {keyPoints.length ? <section className="lesson-key-points"><h2>In this lesson you will:</h2><ul>{keyPoints.map((point) => <li key={point}>{point}</li>)}</ul></section> : null}
      {proTip ? <aside className="lesson-pro-tip"><strong>Pro Tip</strong><p>{proTip}</p></aside> : null}
    </div> : <div aria-labelledby="lesson-notes-tab" className="lesson-notes" id="lesson-notes-panel" role="tabpanel">
      {notes?.length ? <PortableText components={portableTextComponents} value={notes} /> : <p>Notes are not available for this lesson.</p>}
    </div>}
  </section>
}
