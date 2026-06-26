import { Logo } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Head, Link } from '@inertiajs/react'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { PublicFooter } from '@/components/PublicFooter'

export default function RefundPolicy() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <Head title='Refund Policy | Morphic CMS' />
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
              Refund <span className='gradient-text-neon'>Policy</span>
            </h1>
            <p className='text-sm text-slate-400'>
              Last Updated: June 26, 2026
            </p>
          </div>

          {/* Legal content */}
          <div className='prose prose-invert max-w-none text-slate-300 space-y-8 text-sm md:text-base leading-relaxed'>
            <p>
              Thank you for selecting Morphic CMS. We strive to provide premium, dependable headless content management services for modern developers.
            </p>
            <p>
              Because our subscription checkout mechanisms are operated by <strong>Polar</strong>, our authorized reseller and global Merchant of Record, all payment mutations, charge resolutions, and refund actions are processed natively via Polar&apos;s administrative networks in alignment with this policy.
            </p>

            <hr className='border-white/5' />

            {/* Section 1 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                1. Cancellation Terms
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  You may cancel your Morphic Pro subscription at any time directly inside your Billing Settings panel or through the Polar Customer Portal (<a href='https://polar.sh' target='_blank' rel='noopener noreferrer' className='text-slate-200 hover:text-primary transition-colors underline'>polar.sh</a>).
                </p>
                <ul className='list-disc pl-5 space-y-2 text-slate-400'>
                  <li>
                    Upon cancellation, your account will remain fully functional at the Pro Tier level until the completion of your current pre-paid billing cycle.
                  </li>
                  <li>
                    No further automated recurring charges will be pulled from your credit card or payment method once the cancellation is finalized.
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 2 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                2. Standard 14-Day Discretionary Refund Window
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  We offer a <strong>14-day money-back guarantee</strong> on initial plan purchases.
                </p>
                <ul className='list-disc pl-5 space-y-2 text-slate-400'>
                  <li>
                    If you are unsatisfied with our platform features or discover that the software limits do not align with your technical stack, you can submit a written refund request within fourteen (14) calendar days of your original transaction date.
                  </li>
                  <li>
                    <strong>Statutory Rights:</strong> This policy aligns with the mandatory 14-day statutory consumer withdrawal rights established within the European Union (EU), United Kingdom (UK), and other international jurisdictions.
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                3. Non-Refundable Exceptions
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  Refund requests will not be authorized if any of the following apply:
                </p>
                <ul className='list-disc pl-5 space-y-2 text-slate-400'>
                  <li>
                    The refund request is submitted after the conclusion of the initial 14-day evaluation window.
                  </li>
                  <li>
                    The request originates from automated script behavior that has explicitly violated our acceptable use clauses (e.g., scraping, systemic API abuse, or deliberate endpoint overloading).
                  </li>
                  <li>
                    The user refuses to cooperate or supply necessary troubleshooting metadata to our support desk regarding a reported technical issue.
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 4 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                4. How to Request a Refund
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  To execute a refund request safely:
                </p>
                <ol className='list-decimal pl-5 space-y-2 text-slate-400'>
                  <li>
                    Click the &quot;View Receipt&quot; or &quot;Manage Subscription&quot; links included inside your official email payment statement sent by Polar.
                  </li>
                  <li>
                    Alternatively, navigate directly to <a href='https://polar.sh' target='_blank' rel='noopener noreferrer' className='text-slate-200 hover:text-primary transition-colors underline'>polar.sh</a> and manage your subscription or request assistance under your specific transaction.
                  </li>
                  <li>
                    For localized technical issues, please loop in our team at{' '}
                    <a href='mailto:support@morphic-cms.com' className='text-slate-200 hover:text-primary transition-colors underline'>
                      support@morphic-cms.com
                    </a>{' '}
                    first so we can help resolve your Hono endpoint errors before cancellation!
                  </li>
                </ol>
                <p className='mt-4'>
                  Approved refund allocations are returned to the original payment instrument within 7 to 14 business days.
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
