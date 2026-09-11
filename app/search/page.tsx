import {SignInButton, SignUpButton, Show, UserButton} from '@clerk/nextjs'
import Link from 'next/link'

import {Icon} from '../components/design-system'
import {SearchExperience} from './search-results'

type SearchPageProps = {searchParams: Promise<{q?: string | string[]}>}

export default async function SearchPage({searchParams}: SearchPageProps) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q.trim() : ''

  return <main className="search-page"><div className="site-shell search-shell">
    <header className="site-header">
      <Link className="home-brand" href="/" aria-label="Vertex home"><span className="brand-mark"><Icon name="vertex" /></span><span>Vertex</span></Link>
      <nav className="main-nav" aria-label="Main navigation"><Link className="nav-active" href="/courses">Courses</Link><a href="#learning">My Learning</a></nav>
      <div className="header-actions"><button className="icon-button" type="button" aria-label="Notifications"><Icon name="bell" /></button><Show when="signed-out"><SignInButton mode="modal"><button className="auth-link" type="button">Sign in</button></SignInButton><SignUpButton mode="modal"><button className="auth-button" type="button">Sign up</button></SignUpButton></Show><Show when="signed-in"><div className="user-button-wrap"><UserButton /></div></Show></div>
    </header>
    <section className="search-results-content" aria-labelledby="search-title">
      <SearchExperience key={query} query={query} />
    </section>
  </div></main>
}
