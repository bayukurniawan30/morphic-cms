import { PublicFooter } from '@/components/PublicFooter'
import { PublicHeader } from '@/components/PublicHeader'
import { Head, Link } from '@inertiajs/react'
import { ArrowRight, BookOpen, Calendar, Clock } from 'lucide-react'

interface PostContent {
  title: string
  slug: string
  excerpt?: string
  content?: string
  publish_at?: string
  featuredImage?: {
    secureUrl: string
    alt?: string
  }
  seo?: {
    title?: string
    description?: string
    keywords?: string
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

interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
}

interface BlogIndexProps {
  user: any
  posts: Post[]
  pagination: Pagination
}

export default function BlogIndex({ user, posts, pagination }: BlogIndexProps) {
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

  return (
    <div className='min-h-screen bg-deep-mocha-950 text-slate-100 selection:bg-primary/30 overflow-x-hidden font-sans relative antialiased'>
      {/* Glowing Blobs */}
      <div className='absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none' />
      <div className='absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none' />

      <Head>
        <title>Blog | Morphic CMS</title>
        <meta
          name='description'
          content='Read the latest updates, tutorials, and articles about Morphic CMS.'
        />
      </Head>

      {/* Navigation */}
      <PublicHeader />

      {/* Main Content */}
      <main className='relative z-10 max-w-5xl mx-auto px-6 py-16 md:py-24'>
        {/* Header Title */}
        <div className='text-center max-w-3xl mx-auto mb-16'>
          <h1 className='text-4xl md:text-6xl font-black tracking-tighter text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-6'>
            Blog
          </h1>
          <p className='text-slate-400 text-lg md:text-xl font-medium leading-relaxed'>
            Stay updated with the latest releases, design systems, technical
            deep-dives, and guides from the Morphic CMS team.
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className='text-center py-20 bg-[#1b1818]/30 border border-white/5 rounded-2xl backdrop-blur-xl'>
            <BookOpen className='w-12 h-12 text-slate-600 mx-auto mb-4' />
            <h3 className='text-xl font-semibold text-slate-300'>
              No posts published yet
            </h3>
            <p className='text-slate-500 mt-2'>
              Check back later for new content!
            </p>
          </div>
        ) : (
          <div className='space-y-12'>
            {posts.map((post) => {
              const content = post.content
              return (
                <article
                  key={post.id}
                  className='group bg-[#1b1818]/40 border border-white/5 hover:border-white/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 transition-all duration-300 backdrop-blur-xl shadow-lg relative overflow-hidden'
                >
                  {/* Glowing background hint on hover */}
                  <div className='absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none' />

                  {/* Thumbnail */}
                  <div className='w-full md:w-80 shrink-0 aspect-[16/9] md:aspect-auto rounded-xl overflow-hidden bg-deep-mocha-950 border border-white/5 relative'>
                    {content.featuredImage?.secureUrl ? (
                      <img
                        src={content.featuredImage.secureUrl}
                        alt={content.featuredImage.alt || content.title}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                        loading='lazy'
                      />
                    ) : (
                      <div className='w-full h-full flex items-center justify-center text-slate-700 bg-deep-mocha-900'>
                        <BookOpen className='w-10 h-10' />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className='flex flex-col justify-between flex-grow relative z-10'>
                    <div>
                      {/* Date & Info */}
                      <div className='flex items-center space-x-4 text-xs font-semibold text-slate-500 mb-3'>
                        <span className='flex items-center gap-1'>
                          <Calendar className='w-3.5 h-3.5' />
                          {formatDate(content.publish_at || post.createdAt)}
                        </span>
                        <span className='w-1 h-1 bg-slate-600 rounded-full' />
                        <span className='flex items-center gap-1'>
                          <Clock className='w-3.5 h-3.5' />
                          {content.content
                            ? Math.max(
                                1,
                                Math.ceil(
                                  content.content.split(/\s+/).length / 200
                                )
                              )
                            : 1}{' '}
                          min read
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className='text-2xl md:text-3xl font-black text-white leading-tight mb-3 group-hover:text-primary transition-colors'>
                        <Link href={`/blog/${content.slug}`}>
                          {content.title}
                        </Link>
                      </h2>

                      {/* Excerpt */}
                      <p className='text-slate-400 text-sm md:text-base leading-relaxed line-clamp-3 mb-6'>
                        {content.excerpt || 'Read the full article...'}
                      </p>
                    </div>

                    {/* Read More Link */}
                    <div>
                      <Link
                        href={`/blog/${content.slug}`}
                        className='inline-flex items-center text-sm font-bold text-slate-300 hover:text-white group/link transition-colors'
                      >
                        Read Article
                        <ArrowRight className='w-4 h-4 ml-1.5 transition-transform group-hover/link:translate-x-1' />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className='flex justify-between items-center mt-12 border-t border-white/5 pt-8'>
                <Link
                  href={`/blog?page=${pagination.currentPage - 1}`}
                  className={`px-5 py-2.5 rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold flex items-center gap-1 ${
                    pagination.currentPage <= 1
                      ? 'pointer-events-none opacity-40'
                      : ''
                  }`}
                >
                  Previous
                </Link>
                <span className='text-slate-500 text-sm font-medium'>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Link
                  href={`/blog?page=${pagination.currentPage + 1}`}
                  className={`px-5 py-2.5 rounded-full border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold flex items-center gap-1 ${
                    pagination.currentPage >= pagination.totalPages
                      ? 'pointer-events-none opacity-40'
                      : ''
                  }`}
                >
                  Next
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  )
}
