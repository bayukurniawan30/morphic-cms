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
  Key,
  Layers,
  Server,
  Shield,
  Terminal,
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
      <pre className='bg-slate-950 text-slate-300 p-6 rounded-xl overflow-x-auto font-mono text-sm border border-slate-800 shadow-xl'>
        <code>{code}</code>
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
    { id: 'getting-started', label: 'Quick Start', icon: Zap },
    { id: 'field-types', label: 'Field Types', icon: Layers },
    { id: 'api-reference', label: 'API Reference', icon: Terminal },
    { id: 'auth', label: 'Authentication', icon: Shield },
    { id: 'storage', label: 'Storage', icon: Cloud },
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
        <p>
          Morphic CMS is a developer-first headless content management system.
          It provides a flexible way to model your data, a beautiful UI for
          content editors, and instant REST APIs for your frontend.
        </p>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-8'>
          <div className='p-4 rounded-xl border bg-muted/30'>
            <h4 className='font-bold flex items-center mb-2'>
              <Database className='w-4 h-4 mr-2' /> Database First
            </h4>
            <p className='text-sm'>
              Built on top of Drizzle ORM and Postgres. We recommend using{' '}
              <a
                href='https://neon.tech'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary underline hover:opacity-80'
              >
                Neon.tech
              </a>{' '}
              for a free, high-performance serverless Postgres database.
            </p>
          </div>
          <div className='p-4 rounded-xl border bg-muted/30'>
            <h4 className='font-bold flex items-center mb-2'>
              <Zap className='w-4 h-4 mr-2' /> Instant APIs
            </h4>
            <p className='text-sm'>
              Define a collection and get a production-ready REST API
              immediately.
            </p>
          </div>
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
          <p className='text-sm opacity-80'>
            Rename <code>.env.example</code> to <code>.env</code> and add your{' '}
            <code>DATABASE_URL</code>.
          </p>
          <div className='bg-primary/5 border border-primary/20 p-4 lg:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 mt-4'>
            <Database className='w-5 h-5 text-primary shrink-0' />
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
              className='group p-6 rounded-2xl border bg-card hover:border-primary/50 transition-all'
            >
              <div className='flex items-center justify-between mb-2'>
                <code className='text-primary font-bold text-sm bg-primary/5 px-2 py-1 rounded'>
                  type: '{f.type}'
                </code>
              </div>
              <p className='text-sm font-medium mb-4'>{f.description}</p>
              <div className='bg-zinc-950 p-4 rounded-lg font-mono text-xs text-zinc-400 border border-zinc-800'>
                {f.example}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id='api-reference' title='API Reference' icon={Terminal}>
        <p>Morphic generates predictable, resource-oriented REST APIs.</p>
        <div className='space-y-8 mt-8'>
          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest opacity-60'>
              <span className='w-1.5 h-1.5 rounded-full bg-green-500 mr-2' />
              Get Collections
            </h4>
            <CodeBlock code={`GET /api/collections`} />
            <p className='text-sm'>
              Retrieve a list of all your defined collections.
            </p>
          </div>
          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest opacity-60'>
              <span className='w-1.5 h-1.5 rounded-full bg-green-500 mr-2' />
              Get Entries
            </h4>
            <CodeBlock
              code={`GET /api/collections/:slug/entries?page=1&limit=10`}
            />
            <p className='text-sm'>
              Returns a paginated list of entries for the given collection slug
              or ID.
            </p>
          </div>
          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest opacity-60'>
              <span className='w-1.5 h-1.5 rounded-full bg-green-500 mr-2' />
              Get Single Entry
            </h4>
            <CodeBlock code={`GET /api/collections/:slug/entries/:entryId`} />
            <p className='text-sm'>Fetch a specific entry by its ID or slug.</p>
          </div>
          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest opacity-60'>
              <span className='w-1.5 h-1.5 rounded-full bg-blue-500 mr-2' />
              Create Entry
            </h4>
            <CodeBlock
              code={`POST /api/collections/:id/entries\nContent-Type: application/json\n\n{\n  "title": "New Entry",\n  "content": "..."\n}`}
            />
            <p className='text-sm'>
              Requires an API key with <code>create</code> permissions.
            </p>
          </div>
          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest opacity-60'>
              <span className='w-1.5 h-1.5 rounded-full bg-amber-500 mr-2' />
              Update Entry
            </h4>
            <CodeBlock
              code={`PUT /api/collections/:id/entries/:entryId\nContent-Type: application/json\n\n{\n  "title": "Updated Title"\n}`}
            />
            <p className='text-sm'>Partially update an existing entry.</p>
          </div>
          <div className='space-y-4'>
            <h4 className='font-bold flex items-center text-sm uppercase tracking-widest opacity-60'>
              <span className='w-1.5 h-1.5 rounded-full bg-red-500 mr-2' />
              Delete Entry
            </h4>
            <CodeBlock code={`DELETE /api/collections/:id/entries/:entryId`} />
            <p className='text-sm'>
              Permanently remove an entry. Returns a <code>200 OK</code> status
              on success.
            </p>
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
          Morphic CMS uses <strong>Cloudinary</strong> to store and serve your
          media files (images, videos) and documents. This ensures your assets
          are optimized and delivered via a high-performance CDN.
        </p>
        <div className='bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start space-x-3 mt-6'>
          <Layers className='w-5 h-5 text-blue-500 mt-0.5' />
          <div className='text-sm space-y-2'>
            <p className='font-bold text-blue-800 dark:text-blue-400'>
              Required Environment Variables
            </p>
            <ul className='list-disc list-inside text-blue-700/80 dark:text-blue-500/80'>
              <li>
                <code>CLOUDINARY_CLOUD_NAME</code>: Your unique cloud name from
                Cloudinary dashboard.
              </li>
              <li>
                <code>CLOUDINARY_UPLOAD_PRESET</code>: An unsigned upload preset
                configured in your Cloudinary settings.{' '}
                <a
                  href='https://cloudinary.com/documentation/upload_presets'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='underline hover:text-blue-600'
                >
                  Learn more
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <Section id='hosting' title='Deployment' icon={Server}>
        <p>
          Morphic is optimized for Vercel but can be hosted anywhere that
          supports Node.js.
        </p>
        <div className='space-y-4 mt-4'>
          <p className='text-sm'>1. Push your code to GitHub.</p>
          <p className='text-sm'>2. Connect to Vercel.</p>
          <p className='text-sm'>
            3. Set environment variables (<code>DATABASE_URL</code>,{' '}
            <code>JWT_SECRET</code>, <code>JWT_EXPIRES_IN_DAYS</code>,{' '}
            <code>CLOUDINARY_CLOUD_NAME</code>,{' '}
            <code>CLOUDINARY_UPLOAD_PRESET</code>, <code>RESEND_API_KEY</code>,{' '}
            <code>EMAIL_FROM</code>).
          </p>
          <p className='text-sm font-bold text-primary'>
            Done! Automated deployments on every push.
          </p>
        </div>
      </Section>
    </div>
  )

  return (
    <>
      <Head title='Documentation | Morphic CMS' />

      {user ? (
        <Layout user={user}>
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
              <div className='absolute bottom-full left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-2 duration-300'>
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
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
              className='w-full h-12 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center justify-between px-6 bg-white/90 backdrop-blur-md border-t border-border hover:bg-slate-50 transition-all group rounded-none text-foreground'
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
                    {menuItems.find((m) => `#m.id` === activeHash)?.label ||
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
              <div className='absolute bottom-full left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-2 duration-300'>
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
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
              className='w-full h-12 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex items-center justify-between px-6 bg-white/90 backdrop-blur-md border-t border-border hover:bg-slate-50 transition-all group rounded-none text-foreground'
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
