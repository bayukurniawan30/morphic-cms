import { Logo } from '@/components/icons'
import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, ArrowUp, Calendar, Sparkles, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ChangelogItem {
  version: string
  date: string
  content: string
}

export default function Changelog({
  changelogs,
  user,
}: {
  changelogs: ChangelogItem[]
  user?: any
}) {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className='min-h-screen bg-deep-mocha-950 text-slate-100 selection:bg-primary/30 overflow-x-hidden font-sans relative antialiased'>
      <Head title='Changelog - Morphic CMS'>
        <meta
          name='description'
          content='Morphic CMS release notes and changelog history.'
        />
      </Head>

      {/* Decorative background glow */}
      <div className='absolute top-[-10%] left-[5%] w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[150px] pointer-events-none' />
      <div className='absolute bottom-[10%] right-[5%] w-[35rem] h-[35rem] bg-deep-mocha-700/5 rounded-full blur-[150px] pointer-events-none' />

      {/* Navbar */}
      <nav className='max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 relative z-50 backdrop-blur-md bg-deep-mocha-950/45'>
        <Link href='/changelog' className='flex items-center space-x-1 group'>
          <div className='p-2'>
            <Logo className='w-8 h-8 text-primary-foreground stroke-[1.5]' />
          </div>
          <div>
            <span className='font-bold text-lg tracking-tight text-white uppercase'>
              Morphic
            </span>
            <span className='text-[10px] block text-slate-500 font-semibold uppercase tracking-wider'>
              Changelog
            </span>
          </div>
        </Link>

        <div className='flex items-center space-x-4'>
          <Link
            href='/docs'
            className='text-sm text-slate-400 hover:text-slate-200 transition-colors font-semibold'
          >
            Docs
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className='max-w-4xl mx-auto px-6 py-20 relative z-10'>
        {/* Header */}
        <div className='mb-16 space-y-4'>
          <Link
            href='/'
            className='inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors'
          >
            <ArrowLeft className='w-3.5 h-3.5' />
            <span>Back to Home</span>
          </Link>

          <div className='inline-flex items-center space-x-2 px-3 py-1 bg-deep-mocha-900/40 border border-deep-mocha-700/25 rounded-full text-xs font-semibold text-deep-mocha-300 mb-2'>
            <Sparkles className='w-3 h-3 text-deep-mocha-400' />
            <span>Release History</span>
          </div>

          <h1 className='text-4xl md:text-6xl font-extrabold tracking-tight text-white'>
            Morphic CMS Changelog
          </h1>
          <p className='text-slate-400 max-w-xl leading-relaxed'>
            Follow all the latest feature updates, performance improvements, and
            ecosystem announcements for Morphic CMS.
          </p>
        </div>

        {/* Timeline */}
        <div className='relative border-l border-white/5 ml-4 md:ml-32 space-y-16 py-4'>
          {changelogs.map((item) => (
            <div key={item.version} className='relative pl-8 md:pl-12 group'>
              {/* Timeline marker */}
              <div className='absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-deep-mocha-950 bg-primary group-hover:scale-110 transition-transform duration-300 shadow-md shadow-primary/20' />

              {/* Version & Date on Desktop Left Side */}
              <div className='md:absolute md:right-[calc(100%+2rem)] md:top-1.5 md:text-right space-y-1 mb-4 md:mb-0 md:min-w-[200px]'>
                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-bold text-slate-200'>
                  <Tag className='w-3.5 h-3.5 shrink-0 text-primary' />
                  <span>v{item.version}</span>
                </div>
                <div className='text-slate-400 text-xs flex items-center md:justify-end gap-1.5 whitespace-nowrap'>
                  <Calendar className='w-3.5 h-3.5 shrink-0 text-slate-500' />
                  <span>{item.date}</span>
                </div>
              </div>

              {/* Release Notes Container */}
              <div className='bg-[#1b1818]/45 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-xl transition-all duration-300 group-hover:border-white/10 group-hover:bg-[#1b1818]/60'>
                <div
                  dangerouslySetInnerHTML={{ __html: item.content }}
                  className='prose prose-invert prose-sm md:prose-base max-w-none prose-headings:font-bold prose-headings:text-white prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-hr:border-white/5 prose-strong:text-white prose-strong:font-bold'
                />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className='border-t border-white/5 py-12 text-center text-xs text-slate-500 relative z-50 bg-deep-mocha-950'>
        <p>© 2026 Morphic CMS. All rights reserved.</p>
      </footer>
      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-110 hover:bg-primary/95 focus:outline-none z-50 ${
          showScrollTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        title='Scroll to top'
      >
        <ArrowUp className='w-5 h-5' />
      </button>
    </div>
  )
}
