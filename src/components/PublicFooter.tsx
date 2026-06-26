import { Logo } from '@/components/icons'
import { Link } from '@inertiajs/react'

export function PublicFooter() {
  return (
    <footer className='py-16 border-t border-white/5 text-slate-500 text-xs mt-12 bg-deep-mocha-900/20 relative z-10 w-full'>
      <div className='max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6'>
        <div className='flex items-center space-x-2.5'>
          <Logo stroke='#ffffff' />
          <span className='font-black text-white tracking-tighter uppercase'>
            MORPHIC
          </span>
        </div>
        <div className='flex flex-wrap items-center justify-center gap-x-8 gap-y-4'>
          <Link href='/docs' className='hover:text-slate-300 transition-colors'>
            Docs
          </Link>
          <Link
            href='/changelog'
            className='hover:text-slate-300 transition-colors'
          >
            Changelog
          </Link>
          <Link
            href='/terms'
            className='hover:text-slate-300 transition-colors'
          >
            Terms
          </Link>
          <Link
            href='/privacy'
            className='hover:text-slate-300 transition-colors'
          >
            Privacy
          </Link>
          <Link
            href='/refund-policy'
            className='hover:text-slate-300 transition-colors'
          >
            Refund Policy
          </Link>
        </div>
        <div className='opacity-50 text-center md:text-right italic'>
          &copy; {new Date().getFullYear()} Morphic CMS. Released under the MIT
          License.
        </div>
      </div>
    </footer>
  )
}
