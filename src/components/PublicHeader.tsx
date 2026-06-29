import { Logo } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Link, usePage } from '@inertiajs/react'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { url } = usePage()

  const isHome = url === '/' || url === ''

  const renderNavLink = (label: string, hashOrPath: string) => {
    const isHash = hashOrPath.startsWith('#')
    const href = isHash ? (isHome ? hashOrPath : `/${hashOrPath}`) : hashOrPath

    if (isHash && isHome) {
      return (
        <a href={href} className='hover:text-white transition-colors'>
          {label}
        </a>
      )
    }

    const isActive =
      hashOrPath === '/blog'
        ? url.startsWith('/blog')
        : hashOrPath === '/pricing'
          ? url.startsWith('/pricing')
          : false

    return (
      <Link
        href={href}
        className={
          isActive
            ? 'text-white font-semibold transition-colors'
            : 'hover:text-white transition-colors'
        }
      >
        {label}
      </Link>
    )
  }

  const renderMobileNavLink = (label: string, hashOrPath: string) => {
    const isHash = hashOrPath.startsWith('#')
    const href = isHash ? (isHome ? hashOrPath : `/${hashOrPath}`) : hashOrPath

    const isActive =
      hashOrPath === '/blog'
        ? url.startsWith('/blog')
        : hashOrPath === '/pricing'
          ? url.startsWith('/pricing')
          : false

    if (isHash && isHome) {
      return (
        <a
          href={href}
          onClick={() => setIsMenuOpen(false)}
          className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
        >
          {label}
        </a>
      )
    }

    return (
      <Link
        href={href}
        onClick={() => setIsMenuOpen(false)}
        className={`block text-lg font-medium transition-colors ${
          isActive
            ? 'text-white font-semibold'
            : 'text-slate-300 hover:text-white'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className='sticky top-0 z-50 border-b border-white/5 bg-deep-mocha-950/60 backdrop-blur-xl'>
      <div className='max-w-7xl mx-auto px-6 h-20 flex items-center justify-between'>
        <Link href='/' className='flex items-center space-x-3 group'>
          <Logo className='scale-150 group-hover:scale-[1.55] transition-transform duration-300' />
          <span className='text-2xl font-black tracking-tighter text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400'>
            MORPHIC
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className='hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400'>
          {renderNavLink('Features', '#features')}
          {renderNavLink('Architecture', '#architecture')}
          {renderNavLink('Compare', '#comparison')}
          {renderNavLink('Pricing', '/pricing')}
          {renderNavLink('Blog', '/blog')}
          {renderNavLink('Docs', '/docs')}
        </div>

        <div className='hidden md:flex items-center space-x-4'>
          <Button
            asChild
            variant='outline'
            className='rounded-full border-white/10 bg-deep-mocha-900/40 text-slate-300 hover:text-white hover:bg-deep-mocha-800'
          >
            <Link href='/login'>Sign in</Link>
          </Button>
          <Button
            asChild
            className='rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/10'
          >
            <Link href='/signup'>Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className='md:hidden flex items-center'>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className='p-2 text-slate-400 hover:text-white transition-colors focus:outline-none'
          >
            {isMenuOpen ? (
              <X className='w-6 h-6' />
            ) : (
              <Menu className='w-6 h-6' />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className='md:hidden absolute top-20 left-0 w-full bg-deep-mocha-950 border-b border-white/5 py-8 px-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 z-50'>
          {renderMobileNavLink('Features', '#features')}
          {renderMobileNavLink('Architecture', '#architecture')}
          {renderMobileNavLink('Compare', '#comparison')}
          {renderMobileNavLink('Pricing', '/pricing')}
          {renderMobileNavLink('Blog', '/blog')}
          {renderMobileNavLink('Documentation', '/docs')}

          <div className='pt-6 space-y-4'>
            <Button
              asChild
              variant='outline'
              className='w-full rounded-full border-white/10 bg-deep-mocha-900/40 text-slate-300 hover:text-white'
            >
              <Link href='/login' onClick={() => setIsMenuOpen(false)}>
                Sign in
              </Link>
            </Button>
            <Button
              asChild
              className='w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
            >
              <Link href='/signup' onClick={() => setIsMenuOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
