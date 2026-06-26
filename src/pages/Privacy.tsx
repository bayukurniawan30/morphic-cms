import { Logo } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Head, Link } from '@inertiajs/react'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { PublicFooter } from '@/components/PublicFooter'

export default function Privacy() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <Head title='Privacy Policy | Morphic CMS' />
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
                className='hover:text-white transition-colors'
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
                href='/pricing'
                className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
              >
                Pricing
              </Link>
              <Link
                href='/docs'
                className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
              >
                Docs
              </Link>
              <div className='flex flex-col gap-4 pt-4 border-t border-white/5'>
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
        <main className='relative z-10 max-w-4xl mx-auto px-6 py-16 space-y-12'>
          {/* Header Section */}
          <div className='space-y-4 border-b border-white/5 pb-8'>
            <h1 className='text-4xl md:text-5xl font-black tracking-tight text-white'>
              Privacy <span className='gradient-text-neon'>Policy</span>
            </h1>
            <p className='text-sm text-slate-400'>
              Last Updated: June 26, 2026
            </p>
          </div>

          {/* Legal content */}
          <div className='prose prose-invert max-w-none text-slate-300 space-y-8 text-sm md:text-base leading-relaxed'>
            <p>
              At Morphic CMS (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), accessible via morphic-cms.com, your privacy is a primary priority. This Privacy Policy outlines the types of personal data we collect, how we use and protect it, and your choices regarding your information.
            </p>

            <hr className='border-white/5' />

            {/* Section 1 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                1. Information We Collect
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  We collect information directly from you when you interact with our headless content management services:
                </p>
                <ul className='list-disc pl-5 space-y-2 text-slate-400'>
                  <li>
                    <strong className='text-slate-300'>Account Information:</strong> Name, email address, and authentication credentials when you register a user seat or tenant workspace.
                  </li>
                  <li>
                    <strong className='text-slate-300'>Workspace Data:</strong> Structured text schemas, JSON payloads, and administrative logs you intentionally insert into our platform clusters.
                  </li>
                  <li>
                    <strong className='text-slate-300'>Usage and System Logs:</strong> IP addresses, browser types, session timestamps, and operational API transactions processed via our Hono-powered backend routes.
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 2 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                2. Payment Processing and Third Parties
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  Morphic CMS does not directly process or store your financial instruments or credit card numbers.
                </p>
                <p>
                  All payment operations, subscriptions, and invoicing checkpoints are executed by our merchant partner and authorized reseller, <strong>Polar</strong> (Polar Sh Inc.).
                </p>
                <p>
                  When making a transaction, personal identifiers and billing records are shared securely with Polar under their distinct regulatory protocols. Your transaction history is governed entirely by the{' '}
                  <a href='https://polar.sh/legal/privacy' target='_blank' rel='noopener noreferrer' className='text-slate-200 hover:text-primary transition-colors underline'>
                    Polar Privacy Policy
                  </a>.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                3. How We Use Your Information
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  We utilize the collected information strictly to:
                </p>
                <ul className='list-disc pl-5 space-y-2 text-slate-400'>
                  <li>Provision and isolate multi-tenant CMS workspaces.</li>
                  <li>Deliver real-time API transactions to your front-end consumers.</li>
                  <li>Manage API usage metering limits relative to your plan tiers.</li>
                  <li>Protect our underlying database layers (Neon PostgreSQL and Upstash Redis caches) from malicious scraping or structural injection attacks.</li>
                </ul>
              </div>
            </div>

            {/* Section 4 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                4. GDPR & CCPA Privacy Rights
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  Depending on your regional residence (including the EU, UK, and California), you possess the following explicit data rights:
                </p>
                <ul className='list-disc pl-5 space-y-2 text-slate-400'>
                  <li>
                    <strong className='text-slate-300'>The Right to Access:</strong> You may request copies of your archived personal ledger fields.
                  </li>
                  <li>
                    <strong className='text-slate-300'>The Right to Rectification:</strong> You may correct or adjust any inaccurate configurations or account details.
                  </li>
                  <li>
                    <strong className='text-slate-300'>The Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> You can delete your tenant database profile entirely by executing a workspace wipe from your administrative settings console.
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 5 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                5. Contact Us
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  For any privacy inquiries or to exercise your individual data rights, please contact our data coordinator directly via email at{' '}
                  <a href='mailto:support@morphic-cms.com' className='text-slate-200 hover:text-primary transition-colors underline'>
                    support@morphic-cms.com
                  </a>.
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
