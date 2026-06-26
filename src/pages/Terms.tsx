import { Logo } from '@/components/icons'
import { PublicFooter } from '@/components/PublicFooter'
import { Button } from '@/components/ui/button'
import { Head, Link } from '@inertiajs/react'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Terms() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <Head title='Terms of Service | Morphic CMS' />
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
              Terms of <span className='gradient-text-neon'>Service</span>
            </h1>
            <p className='text-sm text-slate-400'>
              Last Updated: June 25, 2026
            </p>
          </div>

          {/* Legal content */}
          <div className='prose prose-invert max-w-none text-slate-300 space-y-8 text-sm md:text-base leading-relaxed'>
            <p>
              Welcome to Morphic CMS (&quot;Company,&quot; &quot;we,&quot;
              &quot;us,&quot; or &quot;our&quot;). These Terms of Service
              (&quot;Terms&quot;) govern your access to and use of the Morphic
              CMS cloud platform, website, dynamic APIs, and associated web
              services (collectively, the &quot;Service&quot;).
            </p>

            <p className='font-medium text-white'>
              By creating an account, connecting a database, or invoking our API
              routes, you explicitly agree to be bound by these Terms. If you do
              not agree, you are prohibited from utilizing the Service.
            </p>

            <hr className='border-white/5' />

            {/* Section 1 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                1. Account Creation and Multi-Tenancy
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  <strong>Eligibility:</strong> You must be at least 13 years
                  old (or the legal age in your country) to create an account.
                </p>
                <p>
                  <strong>Workspace Isolation:</strong> Subscribing to Morphic
                  Cloud grants you access to specific tenant workspaces. You are
                  entirely responsible for all content creation, schema
                  modifications, database configurations, and actions that occur
                  within your managed workspaces.
                </p>
                <p>
                  <strong>Credentials:</strong> You must secure your account
                  credentials and system API tokens. Morphic CMS cannot and will
                  not be liable for any data loss, overwrites, or security
                  breaches resulting from leaked tokens or shared administrative
                  credentials.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                2. Subscription Billing, Upgrades, and Cancellations
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  <strong>The Merchant of Record:</strong> All cloud
                  subscription payment mutations, invoicing collections, and
                  sales tax compliance metrics are managed exclusively through
                  our authorized Merchant of Record,{' '}
                  <strong>Paddle (Paddle.com Market Limited)</strong>.
                </p>
                <p>
                  <strong>Tier Limit Enforcement:</strong>
                </p>
                <ul className='list-disc pl-5 space-y-2 text-slate-400'>
                  <li>
                    <strong className='text-slate-300'>Freemium Tier:</strong>{' '}
                    Limited to 1 User Seat, 1 Tenant Workspace, 5 Schemas
                    (Collections), 500 MB of Media Assets Storage, and a maximum
                    boundary of 20,000 incoming API requests per month.
                  </li>
                  <li>
                    <strong className='text-slate-300'>Pro Tier:</strong>{' '}
                    Governed by the parameters selected during checkout (e.g.,
                    500,000 monthly API requests, 3 User Seats per Workspace, 3
                    Tenant Workspaces, 5 GB Media Assets Storage, Webhooks, Form
                    Builder, and Localization).
                  </li>
                </ul>
                <p>
                  <strong>Overage and Throttling:</strong> If your operational
                  endpoint transaction counts exceed your designated plan
                  limits, Morphic CMS reserves the immediate right to throttle,
                  drop, or return a 429 Too Many Requests payload condition to
                  protect shared multi-tenant database clusters.
                </p>
                <p>
                  <strong>Cancellations:</strong> You can cancel your
                  subscription at any time via your Billing Settings panel. Upon
                  cancellation, your workspace configurations will drop
                  gracefully to the Freemium Tier at the conclusion of your
                  active billing cycle.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                3. Acceptable Use and Content Policies
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  You retain complete ownership of all structured data text
                  rows, schemas, documents, and assets you insert into Morphic
                  CMS (&quot;User Content&quot;). However, you represent and
                  warrant that your content does not violate any local laws.
                </p>
                <p>
                  <strong>Absolute Prohibitions:</strong> You agree not to use
                  the Service to host, manage, or distribute content that
                  involves:
                </p>
                <ul className='list-disc pl-5 space-y-2 text-slate-400'>
                  <li>
                    Illegal activities, illicit drug tracking, or malware
                    distribution frameworks.
                  </li>
                  <li>
                    Phishing operations, financial scams, or unauthorized
                    tracking architectures.
                  </li>
                  <li>
                    Any automated scrapers designed to deliberately disrupt or
                    overload our internal database.
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 4 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                4. Open-Source vs. Cloud Infrastructure
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  Morphic CMS core logic is public and open-source. For the
                  avoidance of doubt:
                </p>
                <ul className='list-disc pl-5 space-y-2 text-slate-400'>
                  <li>
                    <strong className='text-slate-300'>
                      Self-Hosted Instance:
                    </strong>{' '}
                    If you clone, build, and deploy the Morphic code repository
                    on your own localized architecture or physical
                    infrastructure (
                    <code>process.env.IS_SELF_HOSTED === &apos;true&apos;</code>
                    ), your execution is governed entirely by the project’s
                    open-source repository license (e.g., MIT/AGPL) and is not
                    subject to these Cloud limitations or billing models.
                  </li>
                  <li>
                    <strong className='text-slate-300'>Morphic Cloud:</strong>{' '}
                    Using our zero-maintenance hosted cloud infrastructure (
                    <code>*.morphic-cms.com</code>) establishes compliance with
                    these operational rules, data isolation middlewares, and
                    pricing caps.
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 5 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                5. Third-Party Integrations (Cloudinary)
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  Morphic Cloud processes assets and media through secure object
                  stores and cloud image managers.
                </p>
                <p>
                  You acknowledge that public asset links are exposed via
                  third-party Content Delivery Networks (CDNs) like{' '}
                  <code>res.cloudinary.com</code>.
                </p>
                <p>
                  Morphic CMS is not liable for data delivery interruptions,
                  upstream server maintenance downtimes, or content policy
                  violations originating inside these third-party environments.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                6. Disclaimer of Warranties
              </h2>
              <div className='pl-4 border-l-2 border-primary/20'>
                <p className='italic text-slate-350'>
                  THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS
                  AVAILABLE&quot; BASIS. MORPHIC CMS EXPLICITLY DISCLAIMS ALL
                  WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING
                  BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY,
                  FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO
                  NOT GUARANTEE THAT THE SYSTEM APIS WILL BE COMPLETELY
                  ERROR-FREE, PERMANENTLY ONLINE, OR SAFE FROM UNEXPECTED DATA
                  DOWNSTREAM ANOMALIES.
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                7. Limitation of Liability
              </h2>
              <div className='pl-4 border-l-2 border-primary/20'>
                <p className='italic text-slate-350'>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT
                  SHALL MORPHIC CMS, ITS FOUNDERS, OR INFRASTRUCTURE PROVIDERS
                  BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT
                  LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA,
                  OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO THE
                  USE OF, OR INABILITY TO USE, THIS SERVICE. OUR TOTAL LIABILITY
                  FOR ANY CLAIMS UNDER THIS AGREEMENT IS STRICTLY CAPPED AT THE
                  TOTAL AMOUNT PAID BY YOU TO US VIA PADDLE IN THE THREE (3)
                  MONTHS IMMEDIATELY PRECEDING THE CLAIM.
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                8. Governing Law and Disputes
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  These Terms shall be governed, construed, and enforced
                  exclusively in accordance with the laws of Indonesia, without
                  regard to conflict of law rules. Any legal disputes arising
                  out of your relationship with Morphic Cloud will be settled
                  individually via direct mediation or through the competent
                  courts located in Denpasar, Bali, Indonesia.
                </p>
              </div>
            </div>

            {/* Section 9 */}
            <div className='space-y-4'>
              <h2 className='text-xl font-bold text-white tracking-tight'>
                9. Contact
              </h2>
              <div className='space-y-3 pl-4 border-l-2 border-primary/20'>
                <p>
                  For any legal structural layout inquiries, compliance
                  verifications, or workspace data removal requests, please
                  connect with us directly inside our developer community
                  support channels or email us at{' '}
                  <a
                    href='mailto:support@morphic-cms.com'
                    className='text-slate-200 hover:text-primary transition-colors underline'
                  >
                    support@morphic-cms.com
                  </a>
                  .
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
