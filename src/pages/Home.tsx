import { Logo } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Head, Link } from '@inertiajs/react'
import {
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Cloud,
  Database,
  FileCode,
  Globe,
  History,
  Languages,
  Layers,
  Menu,
  Monitor,
  Rocket,
  Server,
  Shield,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { APP_VERSION } from '@/lib/version'
import { useState } from 'react'

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  return (
    <div className='min-h-screen bg-slate-950 text-white selection:bg-primary/30'>
      <Head title='Morphic CMS - Modern Headless CMS' />

      {/* Background Glow */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]' />
        <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]' />
      </div>

      {/* Navigation */}
      <nav className='relative z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0'>
        <div className='max-w-7xl mx-auto px-6 h-20 flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Logo className='scale-150' />
            <span className='text-2xl font-black ml-2 tracking-tighter'>
              MORPHIC
            </span>
          </div>
          <div className='hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400'>
            <a href='#features' className='hover:text-white transition-colors'>
              Features
            </a>
            <a href='#use-cases' className='hover:text-white transition-colors'>
              Use Case
            </a>
            <Link href='/docs' className='hover:text-white transition-colors'>
              Documentation
            </Link>
            <Button
              asChild
              className='rounded-full px-6 shadow-xl shadow-primary/20'
            >
              <a
                href='https://github.com/bayukurniawan30/morphic-cms'
                target='_blank'
                rel='noopener noreferrer'
              >
                Star on GitHub
              </a>
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
          <div className='md:hidden absolute top-20 left-0 w-full bg-slate-950/95 backdrop-blur-xl border-b border-white/5 py-8 px-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 z-50'>
            <a
              href='#features'
              onClick={() => setIsMenuOpen(false)}
              className='block text-lg font-medium text-slate-400 hover:text-white transition-colors'
            >
              Features
            </a>
            <a
              href='#use-cases'
              onClick={() => setIsMenuOpen(false)}
              className='block text-lg font-medium text-slate-400 hover:text-white transition-colors'
            >
              Use Case
            </a>
            <Link
              href='/docs'
              className='block text-lg font-medium text-slate-400 hover:text-white transition-colors'
            >
              Documentation
            </Link>
            <div className='pt-4'>
              <Button
                asChild
                className='w-full rounded-full py-6 text-lg shadow-xl shadow-primary/20'
              >
                <a
                  href='https://github.com/bayukurniawan30/morphic-cms'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Star on GitHub
                </a>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className='relative z-10'>
        <section className='pt-24 pb-20 px-6 max-w-7xl mx-auto text-center'>
          <div className='inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-slate-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000'>
            <Sparkles className='w-3 h-3 text-primary' />
            <span>Introducing Morphic CMS v{APP_VERSION}</span>
          </div>

          <h1 className='text-4xl md:text-8xl font-black tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500 animate-in fade-in slide-in-from-bottom-6 duration-1000'>
            Content Management <br className='hidden md:block' />
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary to-deep-mocha-300'>
              Without the Friction.
            </span>
          </h1>

          <p className='text-xl text-slate-400 max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000'>
            A developer-first headless CMS built for modern teams. Dynamic
            schemas, real-time API generation, and total control over your
            digital assets.
          </p>

          <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
            <div className='relative p-[1.5px] inline-flex items-center justify-center overflow-hidden rounded-full animate-in fade-in slide-in-from-bottom-10 duration-1000'>
              <div className='absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#514849_0%,#cfc9ca_50%,#514849_100%)]' />
              <Button
                asChild
                size='lg'
                className='relative inline-flex h-14 items-center justify-center rounded-full bg-primary px-8 text-lg font-bold text-primary-foreground hover:bg-primary/90 transition-all duration-300 border-none shadow-2xl shadow-primary/20'
              >
                <Link href='/docs'>
                  Get Started
                  <ArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform' />
                </Link>
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className='mt-24 relative p-2 bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden group animate-in zoom-in-95 duration-1000'>
            <img
              src='/dashboard.png'
              alt='Morphic CMS Dashboard'
              className='w-full h-auto rounded-xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none' />
          </div>
        </section>

        {/* Features Section */}
        <section id='features' className='py-24 px-6 border-t border-white/5'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-3xl md:text-5xl font-bold mb-4'>
                Everything you need, nothing you don't.
              </h2>
              <p className='text-slate-400'>
                Lightweight yet powerful. Built for performance and developer
                experience.
              </p>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-8'>
              <div className='p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:translate-y-[-4px] group text-left'>
                <div className='w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform'>
                  <Layers className='w-6 h-6' />
                </div>
                <h3 className='text-xl font-bold mb-4'>Dynamic Schemas</h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Create and modify collections on the fly. No migrations, no
                  headaches. Just define your fields and start editing.
                </p>
              </div>

              <div className='p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:translate-y-[-4px] group text-left'>
                <div className='w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform'>
                  <Zap className='w-6 h-6' />
                </div>
                <h3 className='text-xl font-bold mb-4'>Instant APIs</h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Secure, high-performance REST APIs are generated automatically
                  for every collection. Consumable from any frontend.
                </p>
              </div>

              <div className='p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:translate-y-[-4px] group text-left'>
                <div className='w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform'>
                  <Sparkles className='w-6 h-6' />
                </div>
                <h3 className='text-xl font-bold mb-4'>Flexible Field Types</h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  From simple text to complex rich-text and media, we have all
                  the field types that can support your content needs.
                </p>
              </div>

              <div className='p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:translate-y-[-4px] group text-left'>
                <div className='w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mb-6 group-hover:scale-110 transition-transform'>
                  <Shield className='w-6 h-6' />
                </div>
                <h3 className='text-xl font-bold mb-4'>Total Security</h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Granular permission management for both users and API keys.
                  You decide who can see and modify what.
                </p>
              </div>

              <div className='p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:translate-y-[-4px] group text-left'>
                <div className='w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 transition-transform'>
                  <Languages className='w-6 h-6' />
                </div>
                <h3 className='text-xl font-bold mb-4'>Localization</h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Built-in multi-language support. Manage translations for every
                  entry and deliver localized content to your global audience.
                </p>
              </div>

              <div className='p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:translate-y-[-4px] group text-left'>
                <div className='w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform'>
                  <History className='w-6 h-6' />
                </div>
                <h3 className='text-xl font-bold mb-4'>Content Versioning</h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Automatic history tracking. View past versions, compare
                  changes, and revert to any previous state with a single click.
                </p>
              </div>

              <div className='p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:translate-y-[-4px] group text-left'>
                <div className='w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform'>
                  <CheckSquare className='w-6 h-6' />
                </div>
                <h3 className='text-xl font-bold mb-4'>Form Builder</h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Create custom forms, capture submissions internally or via
                  webhooks, and manage your leads directly within the CMS.
                </p>
              </div>

              <div className='p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all hover:translate-y-[-4px] group text-left'>
                <div className='w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform'>
                  <Users className='w-6 h-6' />
                </div>
                <h3 className='text-xl font-bold mb-4'>Multi-tenant Support</h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Scale your platform with ease. Manage multiple organizations,
                  workspaces, and isolated data environments from a single
                  instance.
                </p>
              </div>
            </div>

            {/* Field Types Showcase */}
            <div className='mt-32 flex flex-col lg:flex-row items-center gap-16'>
              <div className='lg:w-1/2 relative p-2 bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden group animate-in fade-in slide-in-from-left-8 duration-1000'>
                <img
                  src='/field-types.png'
                  alt='Morphic CMS Field Types'
                  className='w-full h-auto rounded-2xl shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none' />
              </div>

              <div className='lg:w-1/2 text-left animate-in fade-in slide-in-from-right-8 duration-1000'>
                <div className='inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-medium text-deep-mocha-50 mb-6'>
                  <span>Content Freedom</span>
                </div>
                <h3 className='text-3xl md:text-5xl font-bold mb-8 tracking-tight'>
                  Built-in Field Types <br />
                  for Every Use Case
                </h3>

                <div className='space-y-10'>
                  <div>
                    <h4 className='text-lg font-bold mb-4 flex items-center gap-2 text-white'>
                      <div className='w-1.5 h-1.5 rounded-full bg-blue-500' />
                      Basic Fields
                    </h4>
                    <div className='grid grid-cols-2 gap-y-3 gap-x-8 text-slate-400 text-sm'>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Text & Textarea
                      </div>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Rich Text Editor
                      </div>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Number & Boolean
                      </div>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Date & Time
                      </div>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Email & URL
                      </div>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Dynamic Slugs
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className='text-lg font-bold mb-4 flex items-center gap-2 text-white'>
                      <div className='w-1.5 h-1.5 rounded-full bg-purple-500' />
                      Selection & Advanced
                    </h4>
                    <div className='grid grid-cols-2 gap-y-3 gap-x-8 text-slate-400 text-sm'>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Dropdown Select
                      </div>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Radio Buttons
                      </div>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Multiselect Checkbox
                      </div>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Media & Assets
                      </div>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Collection Relations
                      </div>
                      <div className='flex items-center gap-2 hover:text-white transition-colors cursor-default'>
                        <div className='w-1 h-1 rounded-full bg-slate-700' />{' '}
                        Nested Arrays
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section
          id='use-cases'
          className='py-32 px-6 border-t border-white/5 bg-slate-900/20'
        >
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-20'>
              <h2 className='text-3xl md:text-5xl font-bold mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000'>
                One CMS,{' '}
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary to-deep-mocha-300'>
                  Limitless Possibilities.
                </span>
              </h2>
              <p className='text-slate-400 max-w-2xl mx-auto text-lg animate-in fade-in slide-in-from-bottom-6 duration-1000'>
                Morphic CMS fits perfectly into any tech stack, delivering
                structured content wherever your users are.
              </p>
            </div>

            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
              <div className='group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-primary/50 transition-all duration-300'>
                <div className='w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:bg-blue-500/30 transition-all'>
                  <Monitor className='w-7 h-7' />
                </div>
                <h3 className='text-xl font-bold mb-4 text-white'>
                  Modern Websites
                </h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Power corporate sites, landing pages, and documentation
                  portals with structured data and lightning-fast delivery.
                </p>
              </div>

              <div className='group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-primary/50 transition-all duration-300'>
                <div className='w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary/30 transition-all'>
                  <Smartphone className='w-7 h-7' />
                </div>
                <h3 className='text-xl font-bold mb-4 text-white'>
                  Mobile Applications
                </h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Deliver native content to iOS and Android apps through a
                  robust, authenticated JSON API that's always in sync.
                </p>
              </div>

              <div className='group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-primary/50 transition-all duration-300'>
                <div className='w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mb-6 group-hover:scale-110 group-hover:bg-green-500/30 transition-all'>
                  <ShoppingBag className='w-7 h-7' />
                </div>
                <h3 className='text-xl font-bold mb-4 text-white'>
                  E-commerce
                </h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Manage product catalogs, banners, and reviews in one central
                  hub and spread them across web and mobile storefronts.
                </p>
              </div>

              <div className='group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-primary/50 transition-all duration-300'>
                <div className='w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 group-hover:bg-purple-500/30 transition-all'>
                  <Globe className='w-7 h-7' />
                </div>
                <h3 className='text-xl font-bold mb-4 text-white'>
                  Multilingual Portals
                </h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Effortlessly manage content in multiple languages and regions
                  without duplicating your infrastructure.
                </p>
              </div>

              <div className='group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-primary/50 transition-all duration-300'>
                <div className='w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-400 mb-6 group-hover:scale-110 group-hover:bg-yellow-500/30 transition-all'>
                  <FileCode className='w-7 h-7' />
                </div>
                <h3 className='text-xl font-bold mb-4 text-white'>
                  Internal Tools
                </h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  Build custom dashboards and back-office tools powered by
                  Morphic's flexible schema and instant API generation.
                </p>
              </div>

              <div className='group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-primary/50 transition-all duration-300'>
                <div className='w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400 mb-6 group-hover:scale-110 group-hover:bg-red-500/30 transition-all'>
                  <Server className='w-7 h-7' />
                </div>
                <h3 className='text-xl font-bold mb-4 text-white'>
                  Headless Backend
                </h3>
                <p className='text-slate-400 text-sm leading-relaxed'>
                  The perfect companion for microservices. Store and retrieve
                  meta-data, config, and content for distributed systems.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Deployment Section */}
        <section
          id='deployment'
          className='py-32 px-6 border-t border-white/5 relative overflow-hidden bg-slate-950'
        >
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none' />

          <div className='max-w-7xl mx-auto relative z-10'>
            <div className='text-center mb-20'>
              <div className='inline-flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-medium text-green-400 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000'>
                <Rocket className='w-4 h-4' />
                <span>Zero Cost Setup</span>
              </div>
              <h2 className='text-3xl md:text-5xl font-bold mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000'>
                Production Ready,{' '}
                <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary to-deep-mocha-300'>
                  Completely Free.
                </span>
              </h2>
              <p className='text-slate-400 max-w-2xl mx-auto text-lg animate-in fade-in slide-in-from-bottom-8 duration-1000'>
                Morphic CMS is designed to run perfectly on modern free-tier
                infrastructures. You can host your entire CMS backend, database,
                and media storage without spending a dime.
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-8'>
              {/* Vercel */}
              <div className='group p-8 rounded-3xl bg-slate-900 border border-white/10 hover:border-white/30 transition-all duration-300 relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[50px] group-hover:bg-white/10 transition-colors' />
                <div className='w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform'>
                  <svg
                    className='w-7 h-7'
                    viewBox='0 0 76 65'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M37.5274 0L75.0548 65H0L37.5274 0Z'
                      fill='currentColor'
                    />
                  </svg>
                </div>
                <h3 className='text-2xl font-bold mb-2 text-white'>Vercel</h3>
                <div className='text-sm text-primary mb-4 font-medium hover:text-primary/80 transition-colors'>
                  Hosting & Compute
                </div>
                <p className='text-slate-400 text-sm leading-relaxed mb-6 group-hover:text-slate-300 transition-colors'>
                  Deploy Morphic instantly to Vercel. Leverage their generous
                  free tier for lightning-fast Edge & Serverless functions
                  globally.
                </p>
                <ul className='space-y-3'>
                  <li className='flex items-center text-sm text-slate-300 group-hover:text-white transition-colors'>
                    <CheckCircle2 className='w-4 h-4 text-green-500 mr-3' />{' '}
                    Global Edge CDN
                  </li>
                  <li className='flex items-center text-sm text-slate-300 group-hover:text-white transition-colors'>
                    <CheckCircle2 className='w-4 h-4 text-green-500 mr-3' />{' '}
                    Serverless API Functions
                  </li>
                  <li className='flex items-center text-sm text-slate-300 group-hover:text-white transition-colors'>
                    <CheckCircle2 className='w-4 h-4 text-green-500 mr-3' />{' '}
                    Automatic SSL & CI/CD
                  </li>
                </ul>
              </div>

              {/* Neon DB */}
              <div className='group p-8 rounded-3xl bg-slate-900 border border-white/10 hover:border-green-500/50 transition-all duration-300 relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[50px] group-hover:bg-green-500/20 transition-colors' />
                <div className='w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mb-6 group-hover:scale-110 transition-transform'>
                  <Database className='w-7 h-7' />
                </div>
                <h3 className='text-2xl font-bold mb-2 text-white'>
                  Neon PostgreSQL
                </h3>
                <div className='text-sm text-green-400 mb-4 font-medium hover:text-green-300 transition-colors'>
                  Database Storage
                </div>
                <p className='text-slate-400 text-sm leading-relaxed mb-6 group-hover:text-slate-300 transition-colors'>
                  Power your content with modern, serverless PostgreSQL. Enjoy a
                  robust free tier with auto-scaling and branching.
                </p>
                <ul className='space-y-3'>
                  <li className='flex items-center text-sm text-slate-300 group-hover:text-white transition-colors'>
                    <CheckCircle2 className='w-4 h-4 text-green-500 mr-3' />{' '}
                    Serverless Architecture
                  </li>
                  <li className='flex items-center text-sm text-slate-300 group-hover:text-white transition-colors'>
                    <CheckCircle2 className='w-4 h-4 text-green-500 mr-3' />{' '}
                    Database Branching
                  </li>
                  <li className='flex items-center text-sm text-slate-300 group-hover:text-white transition-colors'>
                    <CheckCircle2 className='w-4 h-4 text-green-500 mr-3' />{' '}
                    Generous Compute & Storage
                  </li>
                </ul>
              </div>

              {/* Cloudinary */}
              <div className='group p-8 rounded-3xl bg-slate-900 border border-white/10 hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden'>
                <div className='absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] group-hover:bg-blue-500/20 transition-colors' />
                <div className='w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform'>
                  <Cloud className='w-7 h-7' />
                </div>
                <h3 className='text-2xl font-bold mb-2 text-white'>
                  Cloudinary
                </h3>
                <div className='text-sm text-blue-400 mb-4 font-medium hover:text-blue-300 transition-colors'>
                  Asset & Media CDN
                </div>
                <p className='text-slate-400 text-sm leading-relaxed mb-6 group-hover:text-slate-300 transition-colors'>
                  Store and serve your images and media automatically optimized
                  and transformed using their robust free plan.
                </p>
                <ul className='space-y-3'>
                  <li className='flex items-center text-sm text-slate-300 group-hover:text-white transition-colors'>
                    <CheckCircle2 className='w-4 h-4 text-green-500 mr-3' />{' '}
                    Auto Format & Optimization
                  </li>
                  <li className='flex items-center text-sm text-slate-300 group-hover:text-white transition-colors'>
                    <CheckCircle2 className='w-4 h-4 text-green-500 mr-3' />{' '}
                    Powerful Transformation API
                  </li>
                  <li className='flex items-center text-sm text-slate-300 group-hover:text-white transition-colors'>
                    <CheckCircle2 className='w-4 h-4 text-green-500 mr-3' />{' '}
                    Global Media Delivery
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='py-24 px-6 relative overflow-hidden'>
          <div className='absolute inset-0 bg-primary/5 rounded-[4rem] mx-6 lg:mx-12' />
          <div className='max-w-4xl mx-auto text-center relative z-10'>
            <h2 className='text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight'>
              Ready to Build Your <br />
              Next{' '}
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary to-deep-mocha-300'>
                Big Idea?
              </span>
            </h2>
            <p className='text-xl text-slate-400 mb-12 max-w-2xl mx-auto'>
              Join modern teams building high-performance digital experiences
              with Morphic CMS. Fast, flexible, and developer-first.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
              <Button
                asChild
                size='default'
                className='rounded-full px-8 h-12 text-lg font-bold shadow-2xl shadow-primary/30 group'
              >
                <Link href='/docs'>
                  Get Started for Free
                  <ArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform' />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className='py-12 px-6 border-t border-white/5 bg-slate-950'>
          <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm'>
            <div className='flex items-center space-x-2 mb-4 md:mb-0'>
              <Logo stroke='#ffffff' />
              <span className='font-bold text-white tracking-tighter'>
                MORPHIC
              </span>
            </div>
            <div className='mt-4 md:mt-0 italic opacity-50'>
              &copy; 2026 Morphic CMS. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
