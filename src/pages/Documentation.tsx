import Layout from '@/components/Layout'
import { Logo } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Head, Link } from '@inertiajs/react'
import {
  Book,
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  Copy,
  Database,
  FileCheck,
  Key,
  Layers,
  Mail,
  Server,
  Shield,
  Terminal,
  Users,
  Webhook,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import React from 'react'

const CodeBlock = ({
  code,
  language = 'bash',
}: {
  code: string
  language?: string
}) => {
  const [copied, setCopied] = React.useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='relative group my-4'>
      <div className='absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity'>
        <Button
          size='icon'
          variant='secondary'
          className='h-8 w-8'
          onClick={copy}
        >
          {copied ? (
            <Check className='h-4 w-4' />
          ) : (
            <Copy className='h-4 w-4' />
          )}
        </Button>
      </div>
      <pre
        className='bg-slate-950 text-slate-300 p-6 rounded-xl overflow-x-auto text-sm border border-slate-800 shadow-xl'
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Fira Code", "Courier New", monospace',
        }}
      >
        <code
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Fira Code", "Courier New", monospace',
          }}
        >
          {code}
        </code>
      </pre>
    </div>
  )
}

const Section = ({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string
  title: string
  icon: any
  children: React.ReactNode
}) => (
  <section
    id={id}
    className='scroll-mt-24 space-y-6 py-8 border-b border-border/50 last:border-0'
  >
    <div className='flex items-center space-x-3'>
      <div className='p-2 rounded-lg bg-primary/10 text-primary'>
        <Icon className='w-6 h-6' />
      </div>
      <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
    </div>
    <div className='text-muted-foreground leading-relaxed'>{children}</div>
  </section>
)

export default function Documentation({ user }: { user: any }) {
  const [activeHash, setActiveHash] = React.useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0,
    }

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveHash(`#${entry.target.id}`)
        }
      })
    }

    const observer = new IntersectionObserver(
      handleIntersection,
      observerOptions
    )

    // Observer sections
    const sections = document.querySelectorAll('section[id]')
    sections.forEach((section) => observer.observe(section))

    return () => {
      sections.forEach((section) => observer.unobserve(section))
    }
  }, [])

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  const menuItems = [
    { id: 'intro', label: 'Introduction', icon: Book },
    { id: 'multi-tenancy', label: 'Multi-tenancy', icon: Users },
    { id: 'getting-started', label: 'Quick Start', icon: Zap },
    { id: 'field-types', label: 'Field Types', icon: Layers },
    { id: 'form-builder', label: 'Form Builder', icon: FileCheck },
    { id: 'api-reference', label: 'API Reference', icon: Terminal },
    { id: 'auth', label: 'Authentication', icon: Shield },
    { id: 'storage', label: 'Storage', icon: Cloud },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'hosting', label: 'Deployment', icon: Server },
  ]

  const fieldTypes = [
    {
      type: 'text',
      description: 'Standard single-line text input.',
      example: '"title": "Hello World"',
    },
    {
      type: 'textarea',
      description: 'Multi-line text area for longer content.',
      example: '"bio": "Software Engineer..." ',
    },
    {
      type: 'rich-text',
      description: 'WYSIWYG editor for formatted HTML.',
      example: '"content": "<h1>Title</h1><p>Body...</p>"',
    },
    {
      type: 'slug',
      description:
        'URL-friendly identifier, usually auto-generated from another field.',
      example: '"slug": "my-first-post"',
    },
    {
      type: 'number',
      description: 'Numeric input with min/max validation.',
      example: '"price": 99.99',
    },
    {
      type: 'boolean',
      description: 'Toggle switch for true/false values.',
      example: '"is_active": true',
    },
    {
      type: 'date',
      description: 'Date picker (YYYY-MM-DD).',
      example: '"published_at": "2024-03-09"',
    },
    {
      type: 'select',
      description: 'Dropdown selection from predefined options.',
      example: '"category": "technology"',
    },
    {
      type: 'relation',
      description: 'Link to an entry in another collection.',
      example: '"author_id": 123',
    },
    {
      type: 'media',
      description: 'File uploader for images and videos.',
      example: '"hero_image": "https://..."',
    },
    {
      type: 'array',
      description: 'Repeater field for lists of nested objects.',
      example: '"tags": [{"name": "React"}, {"name": "Node"}]',
    },
    {
      type: 'group',
      description: 'A set of nested fields grouped inside an object.',
      example: '"hero": {"title": "Welcome", "subtitle": "Hello World"}',
    },
  ]

  const MainContent = (
    <div className='max-w-4xl mx-auto py-12 px-6 lg:px-12'>
      <div className='space-y-4 mb-16'>
        <h1 className='text-4xl lg:text-6xl font-black tracking-tighter'>
          Documentation
        </h1>
        <p className='text-xl text-muted-foreground'>
          Everything you need to build and scale with Morphic CMS.
        </p>
      </div>

      <Section id='intro' title='Introduction' icon={Book}>
        <p className='mb-6'>
          Morphic CMS is a developer-first headless content management system.
          It provides a flexible way to model your data, a beautiful UI for
          content editors, and instant REST APIs for your frontend.
        </p>

        <div className='space-y-6 my-8 p-6 rounded-2xl border bg-muted/30 backdrop-blur-sm'>
          <h3 className='text-lg font-bold tracking-tight text-foreground'>
            What is a Headless CMS?
          </h3>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            A <strong>Headless CMS</strong> is a back-end-only content
            management system built from the ground up as a content repository.
            Unlike a traditional CMS (like WordPress) which tightly couples the
            content database to a specific front-end presentation template, a
            headless CMS remains entirely decoupled.
          </p>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            In a headless architecture, the "head" (the presentation layer,
            e.g., a React website, iOS app, or smartwatch interface) is
            separated from the "body" (the database and content management
            backend). Content is created and managed once in the CMS, and then
            delivered seamlessly via a high-performance{' '}
            <strong>REST API</strong> to any device or platform.
          </p>
        </div>

        <div className='my-8 space-y-4'>
          <h3 className='text-lg font-bold tracking-tight text-foreground'>
            Headless CMS vs Traditional CMS
          </h3>
          <div className='overflow-x-auto rounded-xl border border-border bg-card shadow-sm'>
            <table className='w-full text-left border-collapse text-sm'>
              <thead>
                <tr className='border-b border-border bg-muted/40 font-semibold text-foreground'>
                  <th className='p-4 font-bold'>Feature</th>
                  <th className='p-4 font-bold text-primary'>
                    Headless CMS (e.g., Morphic)
                  </th>
                  <th className='p-4 font-bold text-muted-foreground'>
                    Traditional CMS (e.g., WordPress)
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60 text-muted-foreground'>
                <tr className='hover:bg-muted/20 transition-colors'>
                  <td className='p-4 font-semibold text-foreground'>
                    Architecture
                  </td>
                  <td className='p-4 text-foreground/90'>
                    Decoupled API-first (frontend is independent)
                  </td>
                  <td className='p-4'>
                    Monolithic & coupled (frontend & database tied together)
                  </td>
                </tr>
                <tr className='hover:bg-muted/20 transition-colors bg-muted/20'>
                  <td className='p-4 font-semibold text-foreground'>
                    Frontend Flexibility
                  </td>
                  <td className='p-4 text-foreground/90'>
                    100% freedom (React, Next.js, Vue, mobile apps, IoT)
                  </td>
                  <td className='p-4'>
                    Restricted to CMS templates, themes, and PHP
                  </td>
                </tr>
                <tr className='hover:bg-muted/20 transition-colors'>
                  <td className='p-4 font-semibold text-foreground'>
                    Performance
                  </td>
                  <td className='p-4 text-foreground/90'>
                    Ultra-fast (static generation, edge caching, light payloads)
                  </td>
                  <td className='p-4'>
                    Slower (server-side database queries on every load)
                  </td>
                </tr>
                <tr className='hover:bg-muted/20 transition-colors bg-muted/20'>
                  <td className='p-4 font-semibold text-foreground'>
                    Security
                  </td>
                  <td className='p-4 text-foreground/90'>
                    High (no direct DB access, static host, immune to SQL
                    injections)
                  </td>
                  <td className='p-4'>
                    Lower (large attack surface via database, plugins, and PHP
                    vulnerabilities)
                  </td>
                </tr>
                <tr className='hover:bg-muted/20 transition-colors'>
                  <td className='p-4 font-semibold text-foreground'>
                    Omnichannel Delivery
                  </td>
                  <td className='p-4 text-foreground/90'>
                    Yes (publish once, distribute to web, apps, voice, and
                    print)
                  </td>
                  <td className='p-4'>
                    No (primarily built and optimized only for websites)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className='my-8 space-y-4'>
          <h3 className='text-lg font-bold tracking-tight text-foreground'>
            Morphic CMS vs Other Headless CMSs
          </h3>
          <p>
            See how Morphic CMS measures up against other leading enterprise
            Headless CMS platforms in the industry:
          </p>
          <div className='overflow-x-auto rounded-xl border border-border bg-card shadow-sm'>
            <table className='w-full text-left border-collapse text-xs md:text-sm'>
              <thead>
                <tr className='border-b border-border bg-muted/40 font-semibold text-foreground'>
                  <th className='p-4 font-bold'>Feature</th>
                  <th className='p-4 font-bold text-primary bg-primary/5'>
                    Morphic CMS
                  </th>
                  <th className='p-4 font-bold text-muted-foreground'>
                    Strapi
                  </th>
                  <th className='p-4 font-bold text-muted-foreground'>
                    Contentful
                  </th>
                  <th className='p-4 font-bold text-muted-foreground'>
                    Sanity
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border/60 text-muted-foreground'>
                <tr className='hover:bg-muted/20 transition-colors'>
                  <td className='p-4 font-semibold text-foreground'>
                    Pricing & License
                  </td>
                  <td className='p-4 text-foreground/90 font-medium bg-primary/5'>
                    Free Self-Host or Cloud (Free / Pro)
                  </td>
                  <td className='p-4'>Open-Source (Enterprise limits/paid)</td>
                  <td className='p-4'>
                    Closed-Source (SaaS pricing, scales high)
                  </td>
                  <td className='p-4'>
                    Proprietary Studio (SaaS limits & pay-per-use)
                  </td>
                </tr>
                <tr className='hover:bg-muted/20 transition-colors bg-muted/20'>
                  <td className='p-4 font-semibold text-foreground'>
                    Database Model
                  </td>
                  <td className='p-4 text-foreground/90 font-medium bg-primary/5'>
                    Database-First (Drizzle & native Postgres)
                  </td>
                  <td className='p-4'>Abstract ORM (Multiple DB support)</td>
                  <td className='p-4'>
                    Proprietary internal DB (No direct access)
                  </td>
                  <td className='p-4'>Document Store (GROQ / JSON-based)</td>
                </tr>
                <tr className='hover:bg-muted/20 transition-colors'>
                  <td className='p-4 font-semibold text-foreground'>
                    Native Multi-Tenancy
                  </td>
                  <td className='p-4 text-foreground/90 font-medium bg-primary/5'>
                    Built-in (Isolated organizations native)
                  </td>
                  <td className='p-4'>Enterprise Tier only (Paid)</td>
                  <td className='p-4'>Enterprise Tier only (Paid)</td>
                  <td className='p-4'>Enterprise Tier only (Paid)</td>
                </tr>
                <tr className='hover:bg-muted/20 transition-colors bg-muted/20'>
                  <td className='p-4 font-semibold text-foreground'>
                    Hosting Flexibility
                  </td>
                  <td className='p-4 text-foreground/90 font-medium bg-primary/5'>
                    Self-Host anywhere (Vercel, VPS, AWS)
                  </td>
                  <td className='p-4'>
                    Self-Host or Cloud (Heavy Node.js server)
                  </td>
                  <td className='p-4'>SaaS Hosting only</td>
                  <td className='p-4'>
                    SaaS Hosting (Studio can be self-hosted)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className='mt-12 space-y-4'>
          <h3 className='text-lg font-bold tracking-tight text-foreground'>
            Core Architecture Pillars
          </h3>
          <p>
            Morphic CMS couples modern software patterns with high-performance
            data architecture. The core capabilities of the system are built
            upon two foundational concepts:
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
          <div className='p-4 rounded-xl border bg-muted/30'>
            <h4 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400 flex items-center mb-2'>
              <Database className='w-4 h-4 mr-2 text-slate-400' /> Database
              First
            </h4>
            <p className='text-sm'>
              Built on top of Drizzle ORM and Postgres. We recommend using{' '}
              <a
                href='https://neon.tech'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary underline hover:text-primary/80'
              >
                Neon.tech
              </a>{' '}
              for a free, high-performance serverless Postgres database.
            </p>
          </div>
          <div className='p-4 rounded-xl border bg-muted/30'>
            <h4 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400 flex items-center mb-2'>
              <Zap className='w-4 h-4 mr-2 text-slate-400' /> Instant APIs
            </h4>
            <p className='text-sm'>
              Define a collection and get a production-ready REST API
              immediately.
            </p>
          </div>
        </div>

        <div className='my-8 space-y-6'>
          <h3 className='text-lg font-bold tracking-tight text-foreground'>
            System Architecture Flow
          </h3>
          <p>
            Understand the complete lifecycle of how requests route through
            Morphic CMS to fetch and store tenant content:
          </p>

          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6 relative items-stretch mt-6'>
            {/* Step 1 */}
            <div className='flex flex-col items-center p-5 rounded-2xl border bg-card/60 shadow-sm relative group hover:border-primary/40 transition-all'>
              <div className='p-3 rounded-xl bg-primary/10 text-primary mb-3'>
                <Terminal className='w-6 h-6' />
              </div>
              <h4 className='font-bold text-sm text-foreground mb-1 text-center'>
                Request Origin
              </h4>
              <p className='text-xs text-muted-foreground text-center leading-relaxed'>
                Admin Dashboard (Inertia) or external REST clients passing API
                Keys + <code>X-Tenant-ID</code>.
              </p>
              {/* Desktop connector arrow */}
              <div className='hidden lg:block absolute left-full top-1/2 -translate-y-1/2 w-6 h-0.5 bg-border group-hover:bg-primary/30 transition-colors z-10'>
                <div className='absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-border group-hover:border-primary/40 rotate-45 transform' />
              </div>
            </div>

            {/* Step 2 */}
            <div className='flex flex-col items-center p-5 rounded-2xl border bg-card/60 shadow-sm relative group hover:border-primary/40 transition-all'>
              <div className='p-3 rounded-xl bg-primary/10 text-primary mb-3'>
                <Server className='w-6 h-6' />
              </div>
              <h4 className='font-bold text-sm text-foreground mb-1 text-center'>
                Hono Engine
              </h4>
              <p className='text-xs text-muted-foreground text-center leading-relaxed'>
                Hono routes the request, runs validation middlewares, and
                verifies tenant access rights.
              </p>
              {/* Desktop connector arrow */}
              <div className='hidden lg:block absolute left-full top-1/2 -translate-y-1/2 w-6 h-0.5 bg-border group-hover:bg-primary/30 transition-colors z-10'>
                <div className='absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-border group-hover:border-primary/40 rotate-45 transform' />
              </div>
            </div>

            {/* Step 3 */}
            <div className='flex flex-col items-center p-5 rounded-2xl border bg-card/60 shadow-sm relative group hover:border-primary/40 transition-all'>
              <div className='p-3 rounded-xl bg-primary/10 text-primary mb-3'>
                <Layers className='w-6 h-6' />
              </div>
              <h4 className='font-bold text-sm text-foreground mb-1 text-center'>
                Drizzle ORM
              </h4>
              <p className='text-xs text-muted-foreground text-center leading-relaxed'>
                Drizzle generates high-efficiency PostgreSQL queries matching
                the dynamic collections structure.
              </p>
              {/* Desktop connector arrow */}
              <div className='hidden lg:block absolute left-full top-1/2 -translate-y-1/2 w-6 h-0.5 bg-border group-hover:bg-primary/30 transition-colors z-10'>
                <div className='absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t-2 border-r-2 border-border group-hover:border-primary/40 rotate-45 transform' />
              </div>
            </div>

            {/* Step 4 */}
            <div className='flex flex-col items-center p-5 rounded-2xl border bg-card/60 shadow-sm relative group hover:border-primary/40 transition-all'>
              <div className='p-3 rounded-xl bg-primary/10 text-primary mb-3'>
                <Database className='w-4 h-4' />
              </div>
              <h4 className='font-bold text-sm text-foreground mb-1 text-center'>
                Neon Postgres
              </h4>
              <p className='text-xs text-muted-foreground text-center leading-relaxed'>
                Serverless server clusters process secure scoped actions,
                isolating organizational schema sets.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section id='multi-tenancy' title='Multi-tenancy' icon={Users}>
        <p>
          Morphic CMS is built from the ground up to support multiple isolated
          organizations (Tenants) within a single instance. This is ideal for
          agencies managing multiple clients or companies with separate business
          units.
        </p>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
          <div className='p-4 rounded-xl border bg-muted/30'>
            <h4 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400 flex items-center mb-2'>
              <Shield className='w-4 h-4 mr-2 text-slate-400' /> Complete
              Isolation
            </h4>
            <p className='text-sm'>
              Every collection, entry, and media asset is scoped to a specific
              Tenant ID. Users from one tenant cannot see or access data from
              another, ensuring strict privacy and security.
            </p>
          </div>
          <div className='p-4 rounded-xl border bg-muted/30'>
            <h4 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400 flex items-center mb-2'>
              <Layers className='w-4 h-4 mr-2 text-slate-400' /> Shared
              Architecture
            </h4>
            <p className='text-sm'>
              While data is isolated, the underlying infrastructure is shared. A
              single deployment can serve hundreds of workspaces, making
              maintenance and updates significantly easier.
            </p>
          </div>
        </div>
        <div className='mt-8 space-y-4'>
          <h4 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400'>
            Super Admin Roles
          </h4>
          <p>
            Super Admins have platform-wide access and can switch between any
            workspace using the <strong>Tenant Switcher</strong> in the sidebar.
            They also have access to the <strong>System Global</strong> view to
            see platform-wide activity.
          </p>

          <h4 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400 pt-4'>
            Subdomain Routing & Custom Domains
          </h4>
          <p>
            Morphic CMS dynamically maps subdomains to specific tenants. For
            example, if you have a tenant with slug <code>xxx</code>, you can
            access its dashboard directly via <code>xxx.yourdomain.com</code>.
          </p>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            To enable this, configure the <code>APP_DOMAIN</code> environment
            variable in your server settings (e.g.,{' '}
            <code>APP_DOMAIN=yourdomain.com</code>) and add a wildcard domain
            record (<code>*.yourdomain.com</code>) pointing to your deployment.
            If <code>APP_DOMAIN</code> is not configured, it defaults to{' '}
            <code>morphic-cms.com</code>.
          </p>
          <p className='text-xs text-muted-foreground italic leading-relaxed'>
            Note: Subdomain redirects are automatically bypassed during local
            development on <code>localhost</code> to avoid cookie domain
            restrictions in modern browsers.
          </p>

          <h4 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400 pt-4'>
            SaaS vs Self-Hosted Mode
          </h4>
          <p>
            Morphic CMS can operate as a multi-tenant Cloud SaaS or as a
            standalone Self-Hosted instance. This behavior is controlled by the{' '}
            <code>IS_SELF_HOSTED</code> environment variable:
          </p>
          <ul className='list-disc pl-5 space-y-2 text-sm text-muted-foreground leading-relaxed'>
            <li>
              <strong>
                <code>true</code> (Default)
              </strong>
              : Standalone self-hosted mode. Disables all tier-based limits
              (unlimited workspaces, user seats, collections, webhooks, and
              localizations).
            </li>
            <li>
              <strong>
                <code>false</code>
              </strong>
              : Cloud SaaS mode. Enforces workspace limits, storage ceilings,
              user seats, and localized collections restrictions based on the
              owner's billing tier (FREE vs PRO).
            </li>
          </ul>
        </div>
      </Section>

      <Section id='getting-started' title='Quick Start' icon={Zap}>
        <p>Get up and running locally in less than 2 minutes.</p>
        <div className='space-y-4 pt-4'>
          <div className='flex items-center space-x-2 text-sm'>
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
              1
            </span>
            <span className='font-bold'>Clone and Install</span>
          </div>
          <CodeBlock
            code={`git clone https://github.com/bayukurniawan30/morphic-cms\npnpm install`}
          />

          <div className='flex items-center space-x-2 text-sm pt-4'>
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
              2
            </span>
            <span className='font-bold'>Setup Environment</span>
          </div>
          <p className='mb-4'>
            Rename <code>.env.example</code> to <code>.env</code>, configure
            your <code>DATABASE_URL</code>, and optionally set{' '}
            <code>APP_DOMAIN</code> to configure multi-tenant subdomain routing.
          </p>
          <div className='bg-primary/5 border border-primary/20 p-4 lg:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 mt-4'>
            <div className='text-sm space-y-2 w-full flex-1'>
              <p className='font-bold'>Recommended: Neon Database</p>
              <p className='text-muted-foreground'>
                You can use{' '}
                <a
                  href='https://neon.tech'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline'
                >
                  Neon.tech
                </a>{' '}
                for a free Postgres database. Copy your connection string and
                paste it into <code>DATABASE_URL</code>:
              </p>
              <CodeBlock
                code={`DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"`}
              />
            </div>
          </div>

          <div className='flex items-center space-x-2 text-sm pt-4'>
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
              3
            </span>
            <span className='font-bold'>Push Schema & Seed</span>
          </div>
          <CodeBlock code={`pnpm db:push\npnpm db:seed`} />

          <div className='flex items-center space-x-2 text-sm pt-4'>
            <span className='flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground'>
              4
            </span>
            <span className='font-bold'>Run & Login</span>
          </div>
          <p className='mb-4'>
            Launch the development server and access the admin panel:
          </p>
          <CodeBlock code={`pnpm dev`} />
          <p className='mb-4'>
            Open your browser and navigate to <code>/login</code> to start
            managing your content.
          </p>
        </div>
      </Section>

      <Section id='field-types' title='Field Types' icon={Layers}>
        <p className='mb-8'>
          Morphic supports a wide range of field types to handle any content
          requirement.
        </p>
        <div className='grid gap-4'>
          {fieldTypes.map((f) => (
            <div
              key={f.type}
              className='group p-6 rounded-2xl border bg-primary/5 hover:border-primary/50 transition-all'
            >
              <div className='flex items-center justify-between mb-2'>
                <code className='text-primary font-bold text-sm bg-primary/5 px-2 py-1 rounded'>
                  type: '{f.type}'
                </code>
              </div>
              <p className='text-sm font-medium mb-4'>{f.description}</p>
              <div
                className='bg-primary/5 border border-primary/20 p-4 rounded-lg text-xs text-primary font-semibold'
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Fira Code", "Courier New", monospace',
                }}
              >
                {f.example}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id='form-builder' title='Form Builder' icon={FileCheck}>
        <p>
          Create custom forms without writing any backend code. Morphic handles
          validation, email notifications, and secure submissions for you.
        </p>
        <div className='space-y-8 mt-8'>
          <div className='space-y-4'>
            <h4 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400'>
              Public Forms & Customization
            </h4>
            <p className='mb-4'>
              Forms created with <strong>Internal Storage</strong> can be
              accessed directly by users via a public web page:{' '}
              <code>{`/public-form/:tenant-slug/:form-slug`}</code>. Morphic
              provides rich, custom-branding features:
            </p>
            <ul className='list-disc pl-5 space-y-2 text-sm text-muted-foreground'>
              <li>
                <strong>Theme Colors</strong>: Select from 8 curated HSL color
                themes (slate, emerald, blue, indigo, violet, rose, orange,
                yellow).
              </li>
              <li>
                <strong>Custom Header Image</strong>: Upload or choose a header
                image via the integrated Media Picker.
              </li>
              <li>
                <strong>Custom Branding Text</strong>: Define personalized
                header and footer text for your form.
              </li>
              <li>
                <strong>Active/Inactive Toggle</strong>: Close the form to
                submissions at any time using the <em>Status</em> switch. When
                closed, visitors see a premium restricted screen, and API
                submissions are blocked.
              </li>
            </ul>
          </div>

          <div className='space-y-4'>
            <h4 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400'>
              Bot Protection & Rate Limiting
            </h4>
            <p className='mb-2'>
              To prevent bot spam, public forms come integrated with:
            </p>
            <ul className='list-disc pl-5 space-y-2 text-sm text-muted-foreground mb-4'>
              <li>
                <strong>Cloudflare Turnstile</strong>: Automatically checks
                Turnstile verification tokens before accepting submissions
                (bypassed on local hostnames for development). Configure keys
                using:
                <code className='block bg-muted/40 p-2 rounded mt-1 font-mono text-xs'>
                  CLOUDFLARE_TURNSTILE_SITE_KEY=...
                  <br />
                  CLOUDFLARE_TURNSTILE_SECRET_KEY=...
                </code>
              </li>
              <li>
                <strong>IP-based Rate Limiting</strong>: Restricts individual IP
                addresses to a maximum of 5 submissions every 15 minutes per
                form.
              </li>
            </ul>
          </div>

          <div className='space-y-4'>
            <h4 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400'>
              Handling Submissions
            </h4>
            <p className='mb-4'>
              Submit form data from your frontend using a simple POST request:
            </p>
            <CodeBlock
              code={`POST /api/forms/:slug/submissions\nContent-Type: application/json\n\n{\n  "name": "John Doe",\n  "email": "john@example.com",\n  "message": "Hello!"\n}`}
            />
          </div>
          <div className='bg-primary/5 border border-primary/20 p-8 rounded-2xl overflow-hidden'>
            <h4 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400 mb-4 flex items-center'>
              <div className='w-2 h-2 rounded-full bg-slate-400 mr-2' />
              Frontend Example (Fetch)
            </h4>
            <CodeBlock
              language='javascript'
              code={`const handleSubmit = async (data) => {
  const response = await fetch('/api/forms/contact-us/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (response.ok) {
    alert('Thank you for your submission!');
  }
};`}
            />
          </div>
        </div>
      </Section>

      <Section id='api-reference' title='API Reference' icon={Terminal}>
        <p>Morphic generates predictable, resource-oriented REST APIs.</p>
        <div className='bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start space-x-3 my-6'>
          <Shield className='w-5 h-5 text-red-500 mt-0.5 shrink-0' />
          <p className='text-sm text-red-800 dark:text-red-400'>
            <strong>Mandatory Header:</strong> For all external REST API
            requests, the <code>X-Tenant-ID</code> header <strong>must</strong>{' '}
            be included. Requests without a valid tenant header will be rejected
            with a <code>403 Forbidden</code> status to ensure complete data
            isolation.
          </p>
        </div>
        <div className='space-y-8 mt-8'>
          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
              <span className='w-1.5 h-1.5 rounded-full bg-green-500 mr-2' />
              Get Collections
            </h4>
            <CodeBlock code={`GET /api/collections`} />
            <p className='mb-2'>
              Retrieve a list of all your defined collections.
            </p>
            <p className='text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-4'>
              Typical Response Payload
            </p>
            <CodeBlock
              language='json'
              code={`{
  "collections": [
    {
      "id": 12,
      "tenantId": 1,
      "name": "Posts",
      "slug": "posts",
      "type": "collection",
      "enableTrash": false,
      "localized": false,
      "fields": [
        {
          "id": "2ap5xm1yi",
          "name": "title",
          "type": "text",
          "label": "Title",
          "required": true,
          "validation": {
            "minLength": 10
          }
        },
        {
          "id": "pylhgnhbx",
          "name": "slug",
          "type": "slug",
          "label": "Slug",
          "required": true,
          "slugSourceField": "title"
        },
        {
          "id": "7zps91cur",
          "name": "category",
          "type": "relation",
          "label": "Category",
          "required": true,
          "relationLabelField": "name",
          "relationCollectionId": 11
        },
        {
          "id": "e2r72fo4k",
          "name": "content",
          "type": "rich-text",
          "label": "Content",
          "required": true
        }
      ],
      "createdById": 1,
      "updatedById": 1,
      "createdAt": "2026-04-23T13:33:37.110Z",
      "updatedAt": "2026-04-23T13:39:24.074Z",
      "createdBy": {
        "id": 1,
        "name": "Bayu Kurniawan"
      }
    },
    {
      "id": 11,
      "tenantId": 1,
      "name": "Category",
      "slug": "category",
      "type": "collection",
      "enableTrash": false,
      "localized": false,
      "fields": [
        {
          "id": "ngj1y2of2",
          "name": "name",
          "type": "text",
          "label": "Name",
          "required": true
        },
        {
          "id": "q1agi6b1e",
          "name": "slug",
          "type": "slug",
          "label": "Slug",
          "required": true,
          "slugSourceField": "name"
        },
        {
          "id": "gevvqojfh",
          "name": "category_status",
          "type": "select",
          "label": "Category Status",
          "options": [
            {
              "label": "Publish",
              "value": "publish"
            },
            {
              "label": "Draft",
              "value": "draft"
            }
          ],
          "required": false
        }
      ],
      "createdById": 1,
      "updatedById": 1,
      "createdAt": "2026-04-23T01:48:29.832Z",
      "updatedAt": "2026-04-23T02:54:38.114Z",
      "createdBy": {
        "id": 1,
        "name": "Bayu Kurniawan"
      }
    }
  ]
}`}
            />
          </div>

          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
              <span className='w-1.5 h-1.5 rounded-full bg-green-500 mr-2' />
              Get Entries
            </h4>
            <CodeBlock
              code={`GET /api/collections/:slug/entries?page=1&limit=10`}
            />
            <p className='mb-4'>
              Returns a paginated list of entries for the given collection slug.
            </p>

            <div className='bg-muted/30 p-4 rounded-xl border border-border/50 space-y-3'>
              <h5 className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                Query Parameters
              </h5>
              <ul className='space-y-2 text-sm'>
                <li className='flex items-start'>
                  <code className='bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-2 text-primary shrink-0'>
                    page
                  </code>
                  <span className='text-slate-600 dark:text-slate-400'>
                    The page number to retrieve. Default is <code>1</code>.
                  </span>
                </li>
                <li className='flex items-start'>
                  <code className='bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-2 text-primary shrink-0'>
                    limit
                  </code>
                  <span className='text-slate-600 dark:text-slate-400'>
                    Number of items per page. Default is <code>10</code>.
                  </span>
                </li>
                <li className='flex items-start'>
                  <code className='bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-2 text-primary shrink-0'>
                    locale
                  </code>
                  <span className='text-slate-600 dark:text-slate-400'>
                    Filter by language code (e.g. <code>en</code>,{' '}
                    <code>id</code>
                    ). Set to <code>_all</code> to retrieve all localized
                    versions.
                  </span>
                </li>
                <li className='flex items-start'>
                  <code className='bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded mr-2 text-primary shrink-0'>
                    trash
                  </code>
                  <span className='text-slate-600 dark:text-slate-400'>
                    Set to <code>true</code> to retrieve deleted items (only if
                    trash is enabled for the collection).
                  </span>
                </li>
              </ul>
            </div>

            <p className='text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-4'>
              Typical Response Payload
            </p>
            <CodeBlock
              language='json'
              code={`{
  "type": "collection",
  "entries": [
    {
      "id": 35,
      "tenantId": 1,
      "collectionId": 12,
      "content": {
        "slug": "gitops-vs-clickops-why-your-infrastructure-deserves-a-repository",
        "title": "GitOps vs. ClickOps: Why Your Infrastructure Deserves a Repository",
        "content": "<p>...</p>",
        "category": {
          "id": 33,
          "name": "Dev Ops",
          "slug": "dev-ops",
          "category_status": "publish"
        }
      },
      "updatedById": 1,
      "status": "published",
      "locale": "en",
      "translationGroupId": "a6e2e240-0535-4b5b-adf2-8d95574b5c4e",
      "createdAt": "2026-04-23T13:47:54.491Z",
      "updatedAt": "2026-04-23T13:47:54.491Z",
      "deletedAt": null,
      "updatedBy": {
        "id": 1,
        "name": "Bayu Kurniawan"
      }
    },
    {
      "id": 34,
      "tenantId": 1,
      "collectionId": 12,
      "content": {
        "slug": "the-rise-of-edge-native-architecture-why-the-cloud-is-moving-closer-to-the-user",
        "title": "The Rise of Edge-Native Architecture: Why the Cloud is Moving Closer to the User",
        "content": "<p>...</p>",
        "category": {
          "id": 32,
          "name": "Tech News",
          "slug": "tech-news",
          "category_status": "publish"
        }
      },
      "updatedById": 1,
      "status": "published",
      "locale": "en",
      "translationGroupId": "3d7258f9-1147-4ddc-b212-6eb30d5110fe",
      "createdAt": "2026-04-23T13:40:27.417Z",
      "updatedAt": "2026-04-23T13:40:27.417Z",
      "deletedAt": null,
      "updatedBy": {
        "id": 1,
        "name": "Bayu Kurniawan"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalCount": 2,
    "limit": 10
  }
}`}
            />
          </div>

          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
              <span className='w-1.5 h-1.5 rounded-full bg-green-500 mr-2' />
              Get Single Entry
            </h4>
            <CodeBlock code={`GET /api/entries/:id`} />
            <p className='mb-2'>Fetch a specific entry by its ID.</p>
            <p className='text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-4'>
              Typical Response Payload
            </p>
            <CodeBlock
              language='json'
              code={`{
  "id": 35,
  "tenantId": 1,
  "collectionId": 12,
  "content": {
    "slug": "gitops-vs-clickops-why-your-infrastructure-deserves-a-repository",
    "title": "GitOps vs. ClickOps: Why Your Infrastructure Deserves a Repository",
    "content": "<p>In the fast-paced world of modern deployment, the era of <strong>\\"ClickOps\\"</strong>—manually configuring servers and databases via a GUI—is rapidly coming to an end. As systems grow in complexity, the risk of \\"configuration drift\\" increases, leading to environments that are impossible to replicate and difficult to debug. Enter GitOps: an operational framework that takes the best practices of software development and applies them to infrastructure.</p><p>By treating your infrastructure as code (IaC) and using a Git repository as the single source of truth, teams can automate their entire delivery pipeline. When a change is pushed to the repository, automated tools detect the difference between the desired state and the actual state, reconciling them instantly. This doesn't just improve security and auditability; it empowers developers to deploy with confidence, knowing that every change is documented, peer-reviewed, and easily reversible. In 2026, if your infrastructure isn't in a repo, it isn't truly production-ready.</p>",
    "category": {
      "id": 33,
      "name": "Dev Ops",
      "slug": "dev-ops",
      "category_status": "publish"
    }
  },
  "updatedById": 1,
  "status": "published",
  "locale": "en",
  "translationGroupId": "a6e2e240-0535-4b5b-adf2-8d95574b5c4e",
  "createdAt": "2026-04-23T13:47:54.491Z",
  "updatedAt": "2026-04-23T13:47:54.491Z",
  "deletedAt": null,
  "updatedBy": {
    "id": 1,
    "name": "Bayu Kurniawan"
  }
}`}
            />
          </div>

          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
              <span className='w-1.5 h-1.5 rounded-full bg-blue-500 mr-2' />
              Create Entry
            </h4>
            <CodeBlock
              code={`POST /api/collections/:idOrSlug/entries\nContent-Type: application/json\n\n{\n  "title": "New Entry",\n  "content": "..."\n}`}
            />
            <p className='mb-4'>
              Requires an API key with <code>create</code> permissions.
            </p>
          </div>
          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
              <span className='w-1.5 h-1.5 rounded-full bg-amber-500 mr-2' />
              Update Entry
            </h4>
            <CodeBlock
              code={`PUT /api/entries/:id\nContent-Type: application/json\n\n{\n  "title": "Updated Title"\n}`}
            />
            <p className='mb-4'>
              Update an existing entry by its ID. Requires an API key with{' '}
              <code>update</code> permissions.
            </p>
          </div>
          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
              <span className='w-1.5 h-1.5 rounded-full bg-red-500 mr-2' />
              Delete Entry
            </h4>
            <CodeBlock code={`DELETE /api/entries/:id`} />
            <p className='mb-4'>
              Permanently delete an entry. Requires an API key with{' '}
              <code>delete</code> permissions.
            </p>
          </div>

          <div className='space-y-4 border-t border-border/30 pt-6 mt-6'>
            <h3 className='text-lg font-bold text-foreground mb-4'>
              Media API
            </h3>

            <div className='space-y-4'>
              <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
                <span className='w-1.5 h-1.5 rounded-full bg-blue-500 mr-2' />
                Upload Media
              </h4>
              <CodeBlock
                code={`POST /api/media/upload\nContent-Type: multipart/form-data\n\nfile: <binary_file>\nfolderId: 123 (optional)`}
              />
              <p className='mb-4'>
                Upload an image or video file. Returns the media file object
                with URLs and metadata. Requires an API key with a{' '}
                <code>super_admin</code> or tenant owner role.
              </p>
            </div>

            <div className='space-y-4'>
              <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
                <span className='w-1.5 h-1.5 rounded-full bg-green-500 mr-2' />
                Get Media Assets
              </h4>
              <CodeBlock code={`GET /api/media?folderId=123`} />
              <p className='mb-4'>
                Retrieve list of folders and media files for a tenant. Pass{' '}
                <code>folderId=null</code> or omit it to fetch the root folder.
              </p>
            </div>

            <div className='space-y-4'>
              <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
                <span className='w-1.5 h-1.5 rounded-full bg-blue-500 mr-2' />
                Create Media Folder
              </h4>
              <CodeBlock
                code={`POST /api/media/folders\nContent-Type: application/json\n\n{\n  "name": "New Folder",\n  "parentId": 123 (optional)\n}`}
              />
              <p className='mb-4'>
                Create a new media folder. Requires an API key with a{' '}
                <code>super_admin</code> or tenant owner role.
              </p>
            </div>

            <div className='space-y-4'>
              <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
                <span className='w-1.5 h-1.5 rounded-full bg-red-500 mr-2' />
                Delete Media Folder
              </h4>
              <CodeBlock code={`DELETE /api/media/folders/:id`} />
              <p className='mb-4'>
                Permanently delete a folder. The folder must be empty to be
                deleted; if it contains files or subfolders, the API will return
                a <code>400 Bad Request</code> with the error message{' '}
                <code>"Cannot delete folder because it is not empty"</code>.
                Requires an API key with a <code>super_admin</code> or tenant
                owner role.
              </p>
            </div>
          </div>

          <div className='space-y-4 border-t border-border/30 pt-6 mt-6'>
            <h3 className='text-lg font-bold text-foreground mb-4'>
              Documents API
            </h3>

            <div className='space-y-4'>
              <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
                <span className='w-1.5 h-1.5 rounded-full bg-blue-500 mr-2' />
                Upload Document
              </h4>
              <CodeBlock
                code={`POST /api/documents/upload\nContent-Type: multipart/form-data\n\nfile: <binary_file>`}
              />
              <p className='mb-4'>
                Upload a document file (PDF, Word, Excel, PPT, TXT). Returns the
                document details. Requires an API key with a super_admin or
                tenant owner role.
              </p>
            </div>

            <div className='space-y-4'>
              <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
                <span className='w-1.5 h-1.5 rounded-full bg-green-500 mr-2' />
                Get Documents
              </h4>
              <CodeBlock
                code={`GET /api/documents?page=1&limit=10&search=report`}
              />
              <p className='mb-4'>
                Fetch a paginated list of uploaded documents, with optional
                search and sorting capabilities.
              </p>
            </div>

            <div className='space-y-4'>
              <h4 className='font-bold flex items-center text-sm uppercase tracking-widest text-black dark:text-slate-400'>
                <span className='w-1.5 h-1.5 rounded-full bg-red-500 mr-2' />
                Delete Document
              </h4>
              <CodeBlock code={`DELETE /api/documents/:id`} />
              <p className='mb-4'>
                Permanently delete a document by its ID. It deletes the record
                from the database and removes the underlying file from cloud
                storage. Requires an API key with a <code>super_admin</code> or
                tenant owner role.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section id='auth' title='Authentication' icon={Shield}>
        <p>
          Authenticate your requests using Bearer tokens in the Authorization
          header.
        </p>
        <CodeBlock
          code={`curl -H "Authorization: Bearer YOUR_API_KEY" \\ \n     https://morphic-cms.vercel.app/api/collections`}
        />
        <div className='bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start space-x-3 mt-6'>
          <Key className='w-5 h-5 text-amber-500 mt-0.5' />
          <p className='text-sm text-amber-800 dark:text-amber-400'>
            <strong>Security Tip:</strong> Never expose your API keys on the
            client-side. Use environment variables in your backend or edge
            functions.
          </p>
        </div>
      </Section>

      <Section id='storage' title='Storage' icon={Cloud}>
        <p>
          Morphic CMS supports multiple storage providers for your media files
          and documents. By default, it uses <strong>Cloudinary</strong> for
          optimized media delivery, but it can be configured to use{' '}
          <strong>Amazon S3</strong> for a 100% AWS-native stack.
        </p>
        <div className='bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start space-x-3 mt-6'>
          <Layers className='w-5 h-5 text-blue-500 mt-0.5' />
          <div className='text-sm space-y-2'>
            <p className='font-bold text-blue-800 dark:text-blue-400'>
              Storage Service Configuration
            </p>
            <ul className='list-disc list-inside text-blue-700/80 dark:text-blue-500/80 space-y-1 mt-2'>
              <li>
                <code>STORAGE_SERVICE</code>: Set to <code>CLOUDINARY</code>{' '}
                (default) or <code>S3</code>.
              </li>
              <li>
                <strong>Cloudinary</strong> (if used): Provide{' '}
                <code>CLOUDINARY_API_KEY</code>,{' '}
                <code>CLOUDINARY_API_SECRET</code>,{' '}
                <code>CLOUDINARY_CLOUD_NAME</code>, and{' '}
                <code>CLOUDINARY_UPLOAD_PRESET</code>.
              </li>
              <li>
                <strong>Amazon S3</strong> (if used): Provide{' '}
                <code>AWS_S3_BUCKET</code>, <code>AWS_REGION</code>,{' '}
                <code>AWS_ACCESS_KEY_ID</code>, and{' '}
                <code>AWS_SECRET_ACCESS_KEY</code>.
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <Section id='email' title='Email' icon={Mail}>
        <p>
          Morphic CMS supports multiple email providers for transactional
          emails. By default, it uses the{' '}
          <a
            href='https://resend.com/'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary underline hover:text-primary/80'
          >
            <strong>Resend</strong>
          </a>{' '}
          REST API, but it can be configured to use <strong>Amazon SES</strong>{' '}
          for a 100% AWS-native stack.
        </p>
        <div className='bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start space-x-3 mt-6'>
          <Mail className='w-5 h-5 text-primary mt-0.5' />
          <div className='text-sm space-y-2'>
            <p className='font-bold text-primary'>
              Email Service Configuration
            </p>
            <ul className='list-disc list-inside text-muted-foreground'>
              <li>
                <code>EMAIL_SERVICE</code>: Set to <code>RESEND</code> (default)
                or <code>SES</code>.
              </li>
              <li>
                <code>RESEND_API_KEY</code>: Required if using Resend.
              </li>
              <li>
                <code>AWS_REGION</code>, <code>AWS_ACCESS_KEY_ID</code>,{' '}
                <code>AWS_SECRET_ACCESS_KEY</code>: Required if using Amazon
                SES.
              </li>
              <li>
                <code>EMAIL_FROM</code>: The sender address (e.g.,{' '}
                <code>"Morphic CMS &lt;onboarding@resend.dev&gt;"</code>).
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <Section id='webhooks' title='Webhooks' icon={Webhook}>
        <p>
          Webhooks allow you to build automated workflows by notifying external
          services when events happen in Morphic CMS. You can configure multiple
          webhooks to listen for specific events.
        </p>

        <div className='space-y-8 mt-8'>
          <div>
            <h3 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400 mb-3'>
              Available Events
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='p-4 bg-primary/5 rounded-xl border'>
                <p className='font-mono text-sm font-bold text-primary mb-1'>
                  entry.*
                </p>
                <p className='text-xs text-muted-foreground'>
                  Triggered when an entry is created, updated, published, or
                  deleted (including trash).
                </p>
              </div>
              <div className='p-4 bg-primary/5 rounded-xl border'>
                <p className='font-mono text-sm font-bold text-primary mb-1'>
                  media.*
                </p>
                <p className='text-xs text-muted-foreground'>
                  Triggered when a file is uploaded or deleted from the media
                  library.
                </p>
              </div>
              <div className='p-4 bg-primary/5 rounded-xl border'>
                <p className='font-mono text-sm font-bold text-primary mb-1'>
                  form.submitted
                </p>
                <p className='text-xs text-muted-foreground'>
                  Triggered when a new submission is received from a frontend
                  form.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className='font-bold text-sm uppercase tracking-widest text-black dark:text-slate-400 mb-3'>
              Security & Verification
            </h3>
            <p className='mb-4'>
              If you provide a <strong>Secret Key</strong> for a webhook,
              Morphic CMS will sign each request using HMAC SHA256. You should
              verify this signature on your server to ensure the request is
              authentic.
            </p>
            <div className='bg-muted/40 border border-border rounded-xl p-4 space-y-3 shadow-sm'>
              <div className='flex items-center space-x-2'>
                <Key className='w-4 h-4 text-primary' />
                <span className='font-mono text-xs font-bold uppercase tracking-wider text-foreground'>
                  Signature Header
                </span>
              </div>
              <code
                className='block bg-slate-950 text-slate-200 border border-slate-800/80 p-3 rounded-lg text-xs font-semibold'
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Fira Code", "Courier New", monospace',
                }}
              >
                X-Morphic-Signature: [sha256-hmac-signature]
              </code>
            </div>
            <div className='mt-4'>
              <p className='text-sm mb-2'>Node.js Verification Example:</p>
              <CodeBlock
                language='javascript'
                code={`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return signature === digest;
}`}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section id='hosting' title='Deployment' icon={Server}>
        <p className='mb-8'>
          Morphic is optimized for edge hosting like Vercel but is built to be
          extremely portable, supporting containerized setups via Docker and
          native serverless configurations on AWS.
        </p>

        <div className='space-y-8'>
          {/* Vercel */}
          <div className='p-6 rounded-2xl border bg-card/60 space-y-4 shadow-sm hover:border-primary/40 transition-all group'>
            <h3 className='text-lg font-bold flex items-center text-foreground'>
              <span className='w-2 h-2 rounded-full bg-green-500 mr-2' />
              Vercel Deployment (Recommended / Edge-First)
            </h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              Automated git-integrated edge deployment. Optimized for maximum
              performance and zero server management overhead.
            </p>
            <div className='space-y-3 pl-4 border-l-2 border-primary/20 text-sm'>
              <p>
                1. Push your repository code to GitHub, GitLab, or Bitbucket.
              </p>
              <p>
                2. Create a new project on Vercel and connect your repository.
              </p>
              <p>3. Configure environment variables in Vercel settings:</p>
              <div
                className='bg-muted/40 p-4 rounded-xl font-mono text-xs text-muted-foreground border border-border/40 mt-2 leading-relaxed'
                style={{
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              >
                DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN_DAYS, STORAGE_SERVICE,
                CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
                CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, EMAIL_SERVICE,
                RESEND_API_KEY, EMAIL_FROM, SIMPLE_HOMEPAGE, APP_DOMAIN,
                IS_SELF_HOSTED
              </div>
            </div>
          </div>

          {/* Docker */}
          <div className='p-6 rounded-2xl border bg-card/60 space-y-4 shadow-sm hover:border-primary/40 transition-all group'>
            <h3 className='text-lg font-bold flex items-center text-foreground'>
              <span className='w-2 h-2 rounded-full bg-blue-500 mr-2' />
              Docker Deployment (VPS Setup)
            </h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              Deploy easily to any virtual private server (DigitalOcean,
              Hetzner, AWS EC2, Linode) using the pre-configured{' '}
              <code>Dockerfile</code> and <code>docker-compose.yml</code>.
            </p>
            <div className='space-y-4 pl-4 border-l-2 border-blue-500/20 text-sm'>
              <div>
                <p className='font-bold mb-2 text-foreground'>
                  1. Clone on your host server:
                </p>
                <CodeBlock
                  code={`git clone https://github.com/bayukurniawan30/morphic-cms.git\ncd morphic-cms`}
                />
              </div>
              <div>
                <p className='font-bold mb-2 text-foreground'>
                  2. Configure Environment:
                </p>
                <p className='text-muted-foreground mb-2 leading-relaxed text-xs'>
                  Open <code>docker-compose.yml</code> and declare your
                  environment values under the <code>environment</code> property
                  of the service.
                </p>
              </div>
              <div>
                <p className='font-bold mb-2 text-foreground'>
                  3. Build and launch:
                </p>
                <CodeBlock code={`docker compose up -d`} />
              </div>
              <div>
                <p className='font-bold mb-2 text-foreground'>
                  4. Initialize Database Schema & Seed Admin:
                </p>
                <CodeBlock
                  code={`docker compose exec morphic pnpm run db:push\ndocker compose exec morphic pnpm run db:seed`}
                />
              </div>
              <p className='text-xs text-muted-foreground mt-2 leading-relaxed'>
                Your CMS will be live on <code>http://your-server-ip:3000</code>
                . We recommend setting up an Nginx reverse proxy with Let's
                Encrypt SSL.
              </p>
            </div>
          </div>

          {/* AWS Serverless */}
          <div className='p-6 rounded-2xl border bg-card/60 space-y-4 shadow-sm hover:border-primary/40 transition-all group'>
            <h3 className='text-lg font-bold flex items-center text-foreground'>
              <span className='w-2 h-2 rounded-full bg-amber-500 mr-2' />
              AWS Deployment (Serverless / Native AWS Stack)
            </h3>
            <p className='text-sm text-muted-foreground leading-relaxed'>
              Build a 100% serverless, infinitely scalable platform utilizing
              AWS Lambda, Aurora Serverless Postgres, and Amazon S3.
            </p>
            <div className='space-y-4 pl-4 border-l-2 border-amber-500/20 text-sm'>
              <div className='space-y-1'>
                <p className='font-bold text-foreground'>
                  1. Database (Amazon Aurora PostgreSQL):
                </p>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  Provision an <strong>Amazon Aurora Serverless v2</strong>{' '}
                  database. Assign its connection URI parameter to{' '}
                  <code>DATABASE_URL</code>.
                </p>
              </div>
              <div className='space-y-2'>
                <p className='font-bold text-foreground'>
                  2. API (AWS Lambda with Hono):
                </p>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  Morphic includes native Hono integration which supports AWS
                  Lambda out-of-the-box. Wrap the main app file using the{' '}
                  <code>hono/aws-lambda</code> adapter and package via CDK, SAM,
                  or Serverless Framework.
                </p>
                <CodeBlock code={`pnpm add hono/aws-lambda`} />
              </div>
              <div className='space-y-2'>
                <p className='font-bold text-foreground'>
                  3. Frontend Assets (S3 + CloudFront):
                </p>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  Run <code>pnpm run build</code> and upload the generated{' '}
                  <code>./dist</code> static build objects into an Amazon S3
                  bucket. Configure an Amazon CloudFront distribution routing
                  static content requests to the bucket, and dynamic{' '}
                  <code>/api/*</code> operations back to the API Gateway/Lambda
                  trigger URL.
                </p>
              </div>
              <div className='space-y-1'>
                <p className='font-bold text-foreground'>
                  4. Serverless Storage & Email Gateways:
                </p>
                <p className='text-muted-foreground text-xs leading-relaxed'>
                  Configure <code>STORAGE_SERVICE=S3</code> and{' '}
                  <code>EMAIL_SERVICE=SES</code> using AWS Credentials (
                  <code>AWS_REGION</code>, <code>AWS_ACCESS_KEY_ID</code>,{' '}
                  <code>AWS_SECRET_ACCESS_KEY</code>) to create a fully native,
                  robust AWS-native ecosystem.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )

  return (
    <>
      <Head title='Documentation | Morphic CMS'>
        <link rel='icon' type='image/png' href='/favicon.png' />
      </Head>

      {user ? (
        <Layout user={user} title='Documentation'>
          <div className='flex flex-col lg:flex-row min-h-screen'>
            {/* Desktop Navigation Sidebar */}
            <aside className='hidden lg:block w-72 border-r p-8 sticky top-0 h-screen overflow-y-auto'>
              <div className='flex items-center space-x-2 mb-10'>
                <Book className='w-5 h-5 text-primary' />
                <span className='font-bold tracking-tight'>DOCS</span>
              </div>
              <nav className='space-y-1'>
                {menuItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      'flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      activeHash === `#${item.id}`
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className='w-4 h-4' />
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            </aside>
            <main className='flex-1 bg-background'>{MainContent}</main>
          </div>

          {/* Mobile Menu Trigger at Bottom */}
          <div className='lg:hidden fixed bottom-0 left-0 right-0 z-50'>
            {/* Menu Drawer */}
            {isMobileMenuOpen && (
              <div className='absolute bottom-full left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-2 duration-300'>
                <div className='text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-2'>
                  Documentation Sections
                </div>
                <nav className='grid grid-cols-1 gap-0.5'>
                  {menuItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => scrollToSection(e, item.id)}
                      className={cn(
                        'flex items-center space-x-3 px-4 py-2.5 transition-all',
                        activeHash === `#${item.id}`
                          ? 'bg-primary/5 text-primary font-bold border-l-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <item.icon className='w-4 h-4' />
                      <span className='text-sm'>{item.label}</span>
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Bottom Toggle Bar */}
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='w-full h-12 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.4)] flex items-center justify-between px-6 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-t border-border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group rounded-none text-foreground'
              variant='ghost'
            >
              <div className='flex items-center space-x-3'>
                <div className='p-1.5 rounded bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors'>
                  <Book className='w-4 h-4' />
                </div>
                <div className='flex items-baseline space-x-2'>
                  <span className='text-[10px] text-muted-foreground font-black uppercase tracking-wider'>
                    On this page:
                  </span>
                  <span className='text-xs font-bold'>
                    {menuItems.find((m) => `#${m.id}` === activeHash)?.label ||
                      'Introduction'}
                  </span>
                </div>
              </div>
              <div className='text-muted-foreground group-hover:text-foreground transition-colors'>
                {isMobileMenuOpen ? (
                  <ChevronDown className='w-4 h-4' />
                ) : (
                  <ChevronUp className='w-4 h-4' />
                )}
              </div>
            </Button>
          </div>
        </Layout>
      ) : (
        <div className='min-h-screen bg-slate-50 dark:bg-slate-950'>
          <nav className='border-b bg-background/50 backdrop-blur-md sticky top-0 z-50'>
            <div className='max-w-7xl mx-auto px-6 h-20 flex items-center justify-between'>
              <Link href='/' className='flex items-center space-x-2'>
                <Logo className='scale-150' />
                <span className='text-xl font-bold tracking-tighter'>
                  MORPHIC
                </span>
              </Link>
              <div className='flex items-center space-x-4'>
                <Button asChild size='sm'>
                  <Link href='/'>Back to Home</Link>
                </Button>
              </div>
            </div>
          </nav>

          {/* Mobile Menu Trigger at Bottom */}
          <div className='lg:hidden fixed bottom-0 left-0 right-0 z-50'>
            {/* Menu Drawer */}
            {isMobileMenuOpen && (
              <div className='absolute bottom-full left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-2 duration-300'>
                <div className='text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-2'>
                  Documentation Sections
                </div>
                <nav className='grid grid-cols-1 gap-0.5'>
                  {menuItems.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => scrollToSection(e, item.id)}
                      className={cn(
                        'flex items-center space-x-3 px-4 py-2.5 transition-all',
                        activeHash === `#${item.id}`
                          ? 'bg-primary/5 text-primary font-bold border-l-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <item.icon className='w-4 h-4' />
                      <span className='text-sm'>{item.label}</span>
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Bottom Toggle Bar */}
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='w-full h-12 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.4)] flex items-center justify-between px-6 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-t border-border hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group rounded-none text-foreground'
              variant='ghost'
            >
              <div className='flex items-center space-x-3'>
                <div className='p-1.5 rounded bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors'>
                  <Book className='w-4 h-4' />
                </div>
                <div className='flex items-baseline space-x-2'>
                  <span className='text-[10px] text-muted-foreground font-black uppercase tracking-wider'>
                    On this page:
                  </span>
                  <span className='text-xs font-bold'>
                    {menuItems.find((m) => `#${m.id}` === activeHash)?.label ||
                      'Introduction'}
                  </span>
                </div>
              </div>
              <div className='text-muted-foreground group-hover:text-foreground transition-colors'>
                {isMobileMenuOpen ? (
                  <ChevronDown className='w-4 h-4' />
                ) : (
                  <ChevronUp className='w-4 h-4' />
                )}
              </div>
            </Button>
          </div>

          <div className='flex flex-col lg:flex-row max-w-7xl mx-auto min-h-screen'>
            <aside className='hidden lg:block w-64 p-8 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto'>
              <nav className='space-y-2'>
                {menuItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all border border-transparent',
                      activeHash === `#${item.id}`
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className='w-4 h-4' />
                    <span>{item.label}</span>
                  </a>
                ))}
              </nav>
            </aside>
            <main className='flex-1 bg-background/50 border-x lg:border-x-0'>
              {MainContent}
            </main>
          </div>
        </div>
      )}
    </>
  )
}
