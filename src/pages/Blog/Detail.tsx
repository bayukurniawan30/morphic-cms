import { PublicFooter } from '@/components/PublicFooter'
import { PublicHeader } from '@/components/PublicHeader'
import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'

interface PostContent {
  title: string
  slug: string
  excerpt?: string
  content?: string
  publish_at?: string
  featuredImage?: {
    secureUrl: string
    alt?: string
    width?: number
    height?: number
  }
  seo?: {
    title?: string
    description?: string
    keywords?: string
    og_image?: {
      secureUrl: string
      width?: number
      height?: number
    }
  }
}

interface Post {
  id: number
  tenantId: number
  collectionId: number
  content: PostContent
  createdAt: string
  updatedAt: string
}

interface BlogDetailProps {
  user: any
  post: Post
}

export default function BlogDetail({ user, post }: BlogDetailProps) {
  const content = post.content

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const readTime = content.content
    ? Math.max(1, Math.ceil(content.content.split(/\s+/).length / 200))
    : 1

  return (
    <div className='min-h-screen bg-deep-mocha-950 text-slate-100 selection:bg-primary/30 overflow-x-hidden font-sans relative antialiased'>
      {/* Glowing Blobs */}
      <div className='absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none' />
      <div className='absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none' />

      <Head>
        <title>{content.seo?.title || `${content.title} | Morphic CMS`}</title>
        <meta
          name='description'
          content={content.seo?.description || content.excerpt || ''}
        />
        {content.seo?.keywords && (
          <meta name='keywords' content={content.seo.keywords} />
        )}
        <link
          rel='canonical'
          href={`${window.location.origin}/blog/${content.slug}`}
        />

        {/* Open Graph / Twitter Tags */}
        <meta property='og:type' content='article' />
        <meta
          property='og:url'
          content={`${window.location.origin}/blog/${content.slug}`}
        />
        <meta property='og:site_name' content='Morphic CMS' />
        <meta property='og:locale' content='en_US' />
        <meta
          property='og:title'
          content={content.seo?.title || `${content.title} | Morphic CMS`}
        />
        <meta
          property='og:description'
          content={content.seo?.description || content.excerpt || ''}
        />
        {content.seo?.og_image?.secureUrl ? (
          <meta property='og:image' content={content.seo.og_image.secureUrl} />
        ) : content.featuredImage?.secureUrl ? (
          <meta property='og:image' content={content.featuredImage.secureUrl} />
        ) : null}
        {content.featuredImage?.alt ? (
          <meta property='og:image:alt' content={content.featuredImage.alt} />
        ) : (
          <meta property='og:image:alt' content={content.title} />
        )}
        <meta
          property='og:image:width'
          content={String(
            content.seo?.og_image?.width || content.featuredImage?.width || 1200
          )}
        />
        <meta
          property='og:image:height'
          content={String(
            content.seo?.og_image?.height ||
              content.featuredImage?.height ||
              630
          )}
        />
        <meta property='twitter:card' content='summary_large_image' />
        {content.seo?.og_image?.secureUrl ? (
          <meta name='twitter:image' content={content.seo.og_image.secureUrl} />
        ) : content.featuredImage?.secureUrl ? (
          <meta
            name='twitter:image'
            content={content.featuredImage.secureUrl}
          />
        ) : null}
      </Head>

      {/* Navigation */}
      <PublicHeader />

      {/* Main Content */}
      <main className='relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20'>
        {/* Back Link */}
        <Link
          href='/blog'
          className='inline-flex items-center text-sm font-semibold text-slate-400 hover:text-white mb-10 transition-colors group'
        >
          <ArrowLeft className='w-4 h-4 mr-2 transition-transform group-hover:-translate-x-0.5' />
          Back to Blog
        </Link>

        {/* Article Meta */}
        <div className='flex items-center space-x-4 text-xs md:text-sm font-semibold text-slate-500 mb-6'>
          <span className='flex items-center gap-1.5'>
            <Calendar className='w-4 h-4' />
            {formatDate(content.publish_at || post.createdAt)}
          </span>
          <span className='w-1.5 h-1.5 bg-slate-700 rounded-full' />
          <span className='flex items-center gap-1.5'>
            <Clock className='w-4 h-4' />
            {readTime} min read
          </span>
        </div>

        {/* Article Title */}
        <h1 className='text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight uppercase tracking-tight mb-8'>
          {content.title}
        </h1>

        {/* Featured Image */}
        {content.featuredImage?.secureUrl && (
          <div className='w-full aspect-[16/9] rounded-2xl overflow-hidden bg-deep-mocha-950 border border-white/5 shadow-2xl mb-12 group'>
            <img
              src={content.featuredImage.secureUrl}
              alt={content.featuredImage.alt || content.title}
              className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ease-out'
            />
          </div>
        )}

        {/* Excerpt Banner */}
        {content.excerpt && (
          <div className='border-l-4 border-primary/50 bg-[#1b1818]/30 px-6 py-4 rounded-r-xl text-slate-300 text-base md:text-lg italic font-medium leading-relaxed mb-10 backdrop-blur-md border-y border-r border-white/5'>
            {content.excerpt}
          </div>
        )}

        {/* Content Body */}
        <article className='prose prose-invert max-w-none prose-slate md:prose-lg leading-relaxed selection:bg-primary/20'>
          <style>{`
            .prose table {
              display: block;
              width: 100%;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
            }
            .prose table th, .prose table td {
              min-width: 150px;
            }
          `}</style>
          {content.content ? (
            <div dangerouslySetInnerHTML={{ __html: content.content }} />
          ) : (
            <p className='text-slate-500 italic'>
              No content available for this post.
            </p>
          )}
        </article>
      </main>

      <PublicFooter />
    </div>
  )
}
