import { Logo } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className='min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden'>
      <Head title='404 - Page Not Found | Morphic CMS' />

      {/* Background Decorative Elements */}
      <div className='absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none'>
        <div className='absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse' />
        <div className='absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700' />
      </div>

      <div className='relative z-10 text-center max-w-2xl w-full'>
        {/* Logo */}
        <div className='flex justify-center mb-12'>
          <Link href='/' className='flex items-center gap-2 group'>
            <Logo className='w-10 h-10 group-hover:rotate-12 transition-transform duration-300' />
            <span className='text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60'>
              MORPHIC
            </span>
          </Link>
        </div>

        {/* 404 Visual */}
        <div className='relative inline-block mb-8'>
          <h1 className='text-[12rem] font-black leading-none tracking-tighter opacity-10 select-none'>
            404
          </h1>
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500'>
              <Search className='w-16 h-16 text-primary animate-bounce' />
            </div>
          </div>
        </div>

        <h2 className='text-4xl font-bold mb-4 tracking-tight'>
          Page not found
        </h2>
        <p className='text-slate-400 mb-12 text-lg max-w-md mx-auto'>
          The page you're looking for doesn't exist or has been moved to another
          workspace.
        </p>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
          <Button
            onClick={() => window.history.back()}
            size='lg'
            className='rounded-full px-8 h-14 text-base font-semibold border border-white/10 bg-white/5 hover:bg-white/20 text-slate-300 hover:text-white transition-all'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Go Back
          </Button>
        </div>

        {/* Footer info */}
        <div className='mt-24 pt-8 border-t border-white/5 flex flex-col items-center gap-4'>
          <p className='text-slate-500 text-xs uppercase tracking-widest font-medium'>
            Morphic CMS &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
