import { Logo } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Head, Link } from '@inertiajs/react'
import { Check, Flame, HelpCircle, Menu, X } from 'lucide-react'
import { useState } from 'react'

interface PricingPublicProps {
  lemonSqueezyProUrl: string
}

export default function PricingPublic({
  lemonSqueezyProUrl,
}: PricingPublicProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleUpgrade = () => {
    // Guest users must sign up first
    window.location.href = '/signup?redirect=pricing'
  }

  return (
    <>
      <Head title='Pricing & Plans | Morphic CMS' />
      <style>{`
        .gradient-text-neon {
          background: linear-gradient(135deg, #fff 30%, #cfc9ca 70%, #87787a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
      <div className='min-h-screen bg-deep-mocha-950 text-slate-100 font-sans selection:bg-primary/30 selection:text-white overflow-hidden relative pb-20'>
        {/* Background Grid Pattern */}
        <div className='absolute inset-0 bg-[linear-gradient(to_right,#0f0c0b_1px,transparent_1px),linear-gradient(to_bottom,#0f0c0b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none' />

        {/* Glowing Blobs */}
        <div className='absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none' />
        <div className='absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none' />

        {/* Navigation */}
        <nav className='sticky top-0 z-50 border-b border-white/5 bg-deep-mocha-950/60 backdrop-blur-xl'>
          <div className='max-w-7xl mx-auto px-6 h-20 flex items-center justify-between'>
            <Link href='/' className='flex items-center space-x-3 group'>
              <Logo className='scale-150 group-hover:scale-[1.55] transition-transform duration-300' />
              <span className='text-2xl font-black tracking-tighter text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400'>
                MORPHIC
              </span>
            </Link>

            <div className='hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400'>
              <Link
                href='/#features'
                className='hover:text-white transition-colors'
              >
                Features
              </Link>
              <Link
                href='/#architecture'
                className='hover:text-white transition-colors'
              >
                Architecture
              </Link>
              <Link
                href='/#comparison'
                className='hover:text-white transition-colors'
              >
                Compare
              </Link>
              <Link
                href='/#deployment'
                className='hover:text-white transition-colors'
              >
                Deployment
              </Link>
              <Link
                href='/pricing'
                className='text-white font-semibold hover:text-white transition-colors'
              >
                Pricing
              </Link>
              <Link href='/docs' className='hover:text-white transition-colors'>
                Docs
              </Link>
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
              <Link
                href='/#features'
                onClick={() => setIsMenuOpen(false)}
                className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
              >
                Features
              </Link>
              <Link
                href='/#architecture'
                onClick={() => setIsMenuOpen(false)}
                className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
              >
                Architecture
              </Link>
              <Link
                href='/#comparison'
                onClick={() => setIsMenuOpen(false)}
                className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
              >
                Compare
              </Link>
              <Link
                href='/#deployment'
                onClick={() => setIsMenuOpen(false)}
                className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
              >
                Deploy
              </Link>
              <Link
                href='/docs'
                className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
              >
                Documentation
              </Link>
              <Link
                href='/pricing'
                onClick={() => setIsMenuOpen(false)}
                className='block text-lg font-medium text-white transition-colors'
              >
                Pricing
              </Link>
              <Link
                href='/changelog'
                onClick={() => setIsMenuOpen(false)}
                className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
              >
                Changelog
              </Link>
              <div className='pt-6 space-y-4'>
                <Button
                  asChild
                  variant='outline'
                  className='w-full rounded-full border-white/10 bg-deep-mocha-900/40 text-slate-300 hover:text-white'
                >
                  <Link href='/login'>Sign in</Link>
                </Button>
                <Button
                  asChild
                  className='w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
                >
                  <Link href='/signup'>Get Started</Link>
                </Button>
              </div>
            </div>
          )}
        </nav>

        {/* Main Content Container */}
        <main className='relative z-10 max-w-5xl mx-auto px-6 py-16 space-y-16'>
          {/* Header Section */}
          <div className='text-center space-y-4 max-w-2xl mx-auto'>
            <div className='inline-flex items-center gap-2 px-3 py-1 bg-deep-mocha-900/40 border border-deep-mocha-700/25 rounded-full text-xs font-semibold text-deep-mocha-300 mb-2'>
              <Flame className='w-3.5 h-3.5 text-primary' />
              <span>Morphic Cloud</span>
            </div>
            <h1 className='text-4xl md:text-5xl font-black tracking-tight text-white'>
              Find the perfect plan for your{' '}
              <span className='gradient-text-neon'>Content</span>
            </h1>
            <p className='text-slate-400 text-base leading-relaxed'>
              Scale from single developers to team-oriented production projects
              with data isolation, native performance, and zero complex
              infrastructure maintenance.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className='grid md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-6'>
            {/* Free Tier Card */}
            <div className='group relative flex flex-col justify-between p-8 rounded-2xl bg-[#1b1818]/50 border border-white/5 shadow-xl hover:border-white/10 transition-all duration-300 overflow-hidden backdrop-blur-xl min-h-[580px]'>
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-xl font-bold text-white'>
                    Freemium Tier
                  </h3>
                </div>
                <p className='text-slate-400 text-sm mb-6'>
                  For hobby projects, personal portfolios, and evaluating cloud
                  capability.
                </p>
                <div className='flex items-baseline gap-1 mb-8'>
                  <span className='text-4xl font-extrabold tracking-tight text-white'>
                    $0
                  </span>
                  <span className='text-slate-400 text-sm'>/ month</span>
                </div>

                <div className='h-px w-full bg-white/5 mb-8' />

                <ul className='space-y-4 text-sm text-slate-300'>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>20,000</strong> Monthly API Requests
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>500 MB</strong> Storage Limit
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>5</strong> Collections (Schemas)
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>1</strong> Workspace (Tenant)
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>1</strong> User Seat (Admin)
                    </span>
                  </li>
                  <li className='flex items-start gap-3 text-slate-500'>
                    <X className='w-5 h-5 text-red-500/40 shrink-0 mt-0.5' />
                    <span className='line-through decoration-white/10'>
                      Localization Systems
                    </span>
                  </li>
                  <li className='flex items-start gap-3 text-slate-500'>
                    <X className='w-5 h-5 text-red-500/40 shrink-0 mt-0.5' />
                    <span className='line-through decoration-white/10'>
                      Webhooks Integration
                    </span>
                  </li>
                  <li className='flex items-start gap-3 text-slate-500'>
                    <X className='w-5 h-5 text-red-500/40 shrink-0 mt-0.5' />
                    <span className='line-through decoration-white/10'>
                      Form Builder Tool
                    </span>
                  </li>
                </ul>
              </div>

              <div className='pt-8'>
                <Button
                  asChild
                  variant='outline'
                  className='w-full h-12 rounded-xl text-sm font-semibold border-white/10 bg-deep-mocha-900/40 text-slate-300 hover:text-white hover:bg-deep-mocha-800'
                >
                  <Link href='/signup'>Get Started</Link>
                </Button>
              </div>
            </div>

            {/* Pro Tier Card */}
            <div className='group relative flex flex-col justify-between p-8 rounded-2xl bg-[#1b1818]/70 border-2 border-deep-mocha-800/40 shadow-2xl hover:border-deep-mocha-700/80 transition-all duration-300 overflow-hidden backdrop-blur-xl min-h-[580px]'>
              {/* Premium Glow effect */}
              <div className='absolute top-0 right-0 w-[50%] h-[50%] bg-deep-mocha-800/10 rounded-full blur-[60px] pointer-events-none' />

              <div>
                <div className='flex items-center justify-between mb-4 relative z-10'>
                  <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                    <span>Pro Plan</span>
                    <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm shadow-orange-500/20'>
                      <Flame className='w-3 h-3 text-white animate-pulse' />
                      <span>Popular</span>
                    </span>
                  </h3>
                </div>
                <p className='text-slate-400 text-sm mb-6 relative z-10'>
                  For growing businesses, professional developers, and team
                  collaboration.
                </p>
                <div className='flex items-baseline gap-1 mb-8 relative z-10'>
                  <span className='text-4xl font-extrabold tracking-tight text-white'>
                    $19
                  </span>
                  <span className='text-slate-400 text-sm'>/ month</span>
                </div>

                <div className='h-px w-full bg-white/5 mb-8 relative z-10' />

                <ul className='space-y-4 text-sm text-slate-200 relative z-10'>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>500,000</strong> Monthly API Requests
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>5 GB</strong> Storage Limit
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>Unlimited</strong> Collections (Schemas)
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>3</strong> Managed Workspaces
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>Up to 3</strong> Users per Workspace
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>Localization</strong> Systems included
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>Webhooks</strong> Integration included
                    </span>
                  </li>
                  <li className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-emerald-500 shrink-0 mt-0.5' />
                    <span>
                      <strong>Form Builder</strong> Tool included
                    </span>
                  </li>
                </ul>
              </div>

              <div className='pt-8 relative z-10'>
                <Button
                  onClick={handleUpgrade}
                  className='w-full h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground'
                >
                  Get Started with Pro
                </Button>
              </div>
            </div>
          </div>

          {/* FAQ Quick Section */}
          <div className='max-w-3xl mx-auto pt-12 space-y-6'>
            <h3 className='text-2xl font-bold tracking-tight text-center text-white flex items-center justify-center gap-2'>
              <HelpCircle className='w-6 h-6 text-slate-400' />
              <span>Frequently Asked Questions</span>
            </h3>
            <div className='grid sm:grid-cols-2 gap-6 pt-4'>
              <div className='space-y-3 bg-[#131111]/25 border border-white/5 rounded-2xl p-5 backdrop-blur-sm'>
                <h4 className='font-bold text-white text-sm'>
                  What happens if I reach the monthly traffic cap?
                </h4>
                <p className='text-xs text-slate-400 leading-relaxed'>
                  If you exceed your monthly limit, your API queries will
                  temporarily return a 'Too Many Requests' error. You can
                  upgrade to a higher tier at any time to instantly resume
                  operations and expand your allowances.
                </p>
              </div>
              <div className='space-y-3 bg-[#131111]/25 border border-white/5 rounded-2xl p-5 backdrop-blur-sm'>
                <h4 className='font-bold text-white text-sm'>
                  How is workspace ownership computed?
                </h4>
                <p className='text-xs text-slate-400 leading-relaxed'>
                  Workspaces inherit features from their creator (owner). If you
                  own a workspace and upgrade your account to PRO, that
                  workspace instantly gets PRO boundaries.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className='py-16 border-t border-white/5 text-slate-500 text-xs mt-12 bg-deep-mocha-900/20 relative z-10'>
          <div className='max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6'>
            <div className='flex items-center space-x-2.5'>
              <Logo stroke='#ffffff' />
              <span className='font-black text-white tracking-tighter uppercase'>
                MORPHIC
              </span>
            </div>
            <div className='flex flex-wrap items-center justify-center gap-x-8 gap-y-4'>
              <Link
                href='/#features'
                className='hover:text-slate-300 transition-colors'
              >
                Features
              </Link>
              <Link
                href='/#architecture'
                className='hover:text-slate-300 transition-colors'
              >
                Architecture
              </Link>
              <Link
                href='/#comparison'
                className='hover:text-slate-300 transition-colors'
              >
                Comparison
              </Link>
              <Link
                href='/docs'
                className='hover:text-slate-300 transition-colors'
              >
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
            </div>
            <div className='opacity-50 text-center md:text-right italic'>
              &copy; {new Date().getFullYear()} Morphic CMS. Released under the
              MIT License.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
