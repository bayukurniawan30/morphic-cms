export const RESERVED_SLUGS = new Set([
  'www', 'api', 'app', 'blog', 'docs', 'status', 'admin', 'portal', 'auth',
  'login', 'signup', 'register', 'support', 'help', 'billing', 'account',
  'dashboard', 'settings', 'static', 'assets', 'cdn', 'mail', 'email', 'pop',
  'imap', 'smtp', 'secure', 'security', 'root', 'host', 'localhost', 'dev',
  'test', 'prod', 'staging', 'demo', 'web', 'legal', 'terms', 'privacy',
  'about', 'contact', 'jobs', 'careers', 'shop', 'store', 'documentation',
  'git', 'github', 'gitlab', 'feedback', 'community', 'forum', 'pricing',
  'faq', 'news', 'press', 'events', 'partners', 'morphic', 'morphic-cms',
  'morphiccms', 'cms', 'panel', 'console', 'system', 'main', 'home',
  'official', 'public', 'internal'
])

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase().trim())
}
