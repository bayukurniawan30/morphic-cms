import { PublicFooter } from '@/components/PublicFooter'
import { PublicHeader } from '@/components/PublicHeader'
import { Button } from '@/components/ui/button'
import { Head, Link } from '@inertiajs/react'
import { Check, Flame, HelpCircle } from 'lucide-react'

export default function PricingPublic() {

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
        <PublicHeader />

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
                <div className='flex flex-col gap-2 mb-8 relative z-10'>
                  <div className='flex items-baseline gap-2'>
                    <span className='text-4xl font-extrabold tracking-tight text-white'>
                      $9
                    </span>
                    <span className='text-lg text-slate-500 line-through'>$19</span>
                    <span className='text-slate-400 text-sm'>/ month</span>
                  </div>
                  <div className='text-xs text-emerald-400 font-medium bg-emerald-950/30 border border-emerald-900/50 px-2 py-1 rounded-md inline-block w-fit'>
                    Code: <strong className='text-emerald-300 font-bold'>EARLY50</strong> (First 50 users, recurring)
                  </div>
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

        <PublicFooter />
      </div>
    </>
  )
}
