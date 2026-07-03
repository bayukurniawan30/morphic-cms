import fs from 'fs'
import { Context, Next } from 'hono'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let manifest: any = null
const isDev = process.env.NODE_ENV !== 'production'

// Load manifest once on startup in production
if (!isDev) {
  const possiblePaths = [
    path.join(process.cwd(), 'dist', '.vite', 'manifest.json'),
    path.join(process.cwd(), '.vite', 'manifest.json'),
    path.join(__dirname, '..', '..', 'dist', '.vite', 'manifest.json'),
    path.join(__dirname, '..', 'dist', '.vite', 'manifest.json'),
    path.join('/var/task', 'dist', '.vite', 'manifest.json'),
    path.join('/var/task', '.vite', 'manifest.json'),
    './dist/.vite/manifest.json',
  ]

  for (const manifestPath of possiblePaths) {
    try {
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
        console.log('✅ Vite manifest found at:', manifestPath)
        break
      }
    } catch (e) {
      // Continue searching
    }
  }

  if (!manifest) {
    console.error(
      '❌ CRITICAL: Vite manifest not found. Production assets will fail to load.'
    )
  }
}

export const inertia = (viewFile: string = 'index.html') => {
  return async (c: Context, next: Next) => {
    // Determine if this is an Inertia request outside the closure
    const getHeader = (name: string) => {
      try {
        return c.req.header(name)
      } catch (e) {
        const rawHeaders = (c.req.raw as any)?.headers
        if (rawHeaders) {
          return typeof rawHeaders.get === 'function'
            ? rawHeaders.get(name)
            : rawHeaders[name.toLowerCase()]
        }
        return undefined
      }
    }

    const isInertiaRequest = getHeader('X-Inertia') === 'true'

    c.set(
      'inertia',
      (
        component: string,
        props: any = {},
        options: { status?: number } = {}
      ) => {
        const status = options.status || 200
        // Merge shared props if they exist in context
        const sharedProps = c.get('inertiaSharedProps' as any) || {}
        const mergedProps = { ...sharedProps, ...props }

        const pageTitle = mergedProps.title || 'Morphic CMS - Modern Headless CMS'
        
        let pageDesc = 'The Edge-Ready, High-Performance Headless CMS for Modern Developers.'
        if (mergedProps.post?.content?.seo?.description) {
          pageDesc = mergedProps.post.content.seo.description
        } else if (mergedProps.post?.content?.excerpt) {
          pageDesc = mergedProps.post.content.excerpt
        } else if (mergedProps.meta?.description) {
          pageDesc = mergedProps.meta.description
        }

        let pageImage = `${new URL(c.req.url).origin}/twitter_card.png`
        if (mergedProps.post?.content?.seo?.og_image?.secureUrl) {
          pageImage = mergedProps.post.content.seo.og_image.secureUrl
        } else if (mergedProps.post?.content?.featuredImage?.secureUrl) {
          pageImage = mergedProps.post.content.featuredImage.secureUrl
        } else if (mergedProps.meta?.ogImage) {
          pageImage = mergedProps.meta.ogImage
        }

        let pageImageAlt = pageTitle
        if (mergedProps.post?.content?.featuredImage?.alt) {
          pageImageAlt = mergedProps.post.content.featuredImage.alt
        }

        let pageImageWidth = '1200'
        let pageImageHeight = '630'
        
        if (mergedProps.post?.content?.seo?.og_image?.width) {
          pageImageWidth = String(mergedProps.post.content.seo.og_image.width)
          pageImageHeight = String(mergedProps.post.content.seo.og_image.height)
        } else if (mergedProps.post?.content?.featuredImage?.width) {
          pageImageWidth = String(mergedProps.post.content.featuredImage.width)
          pageImageHeight = String(mergedProps.post.content.featuredImage.height)
        }

        let pageType = 'website'
        if (component === 'Blog/Detail') {
          pageType = 'article'
        }

        const canonicalUrl = c.req.url.split('?')[0]

        const inertiaProps = {
          component,
          props: mergedProps,
          url: c.req.url,
          version: null,
        }

        if (isInertiaRequest) {
          return c.json(inertiaProps, status as any, {
            'X-Inertia': 'true',
            Vary: 'Accept',
          })
        }

        // Determine asset paths
        let jsPath = '/src/client.tsx'
        let cssTags = ''

        if (!isDev && manifest) {
          const entry = manifest['index.html']
          if (entry) {
            jsPath = `/${entry.file}`
            if (entry.css) {
              cssTags = entry.css
                .map((css: string) => `<link rel="stylesheet" href="/${css}">`)
                .join('\n')
            }
          }
        }

        const vitePreamble = isDev
          ? `
        <script type="module">
          import RefreshRuntime from "/@react-refresh"
          RefreshRuntime.injectIntoGlobalHook(window)
          window.$RefreshReg$ = () => {}
          window.$RefreshSig$ = () => (type) => type
          window.__vite_plugin_react_preamble_installed__ = true
        </script>
        <script type="module" src="/@vite/client"></script>
      `
          : ''

        // Serve HTML with data-page attribute for initial load
        const html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="description" content="${pageDesc.replace(/"/g, '&quot;')}" />
            <meta name="keywords" content="headless cms, edge-ready, multi-tenant, react cms, modern cms" />
            <link rel="icon" type="image/png" href="${new URL(c.req.url).origin}/favicon.png" />
            <link rel="canonical" href="${canonicalUrl}" />
            
            <!-- Fallback Open Graph / Social Media Meta Tags (Visible to crawlers without JavaScript) -->
            <meta property="og:type" content="${pageType}" />
            <meta property="og:url" content="${canonicalUrl}" />
            <meta property="og:site_name" content="Morphic CMS" />
            <meta property="og:locale" content="en_US" />
            <meta property="og:title" content="${pageTitle.replace(/"/g, '&quot;')}" />
            <meta property="og:description" content="${pageDesc.replace(/"/g, '&quot;')}" />
            <meta property="og:image" content="${pageImage}" />
            <meta property="og:image:alt" content="${pageImageAlt.replace(/"/g, '&quot;')}" />
            <meta property="og:image:width" content="${pageImageWidth}" />
            <meta property="og:image:height" content="${pageImageHeight}" />
            <meta property="og:logo" content="${new URL(c.req.url).origin}/favicon.png" />
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content="${canonicalUrl}" />
            <meta property="twitter:title" content="${pageTitle.replace(/"/g, '&quot;')}" />
            <meta property="twitter:description" content="${pageDesc.replace(/"/g, '&quot;')}" />
            <meta property="twitter:image" content="${pageImage}" />

            <script>
              window.addEventListener('error', function(e) {
                console.error('Global Runtime Error:', e.message, 'at', e.lineno, ':', e.colno);
                document.body.innerHTML += '<div style="color:red; padding:20px; font-family:sans-serif;"><b>Runtime Error:</b> ' + e.message + '</div>';
              });
              console.log('Inertia loading component: ${component}', 'JS Path: ${jsPath}');
            </script>
            ${cssTags}
            ${vitePreamble}
        </head>
        <body class="bg-background text-foreground">
            <div id="app" data-page='${JSON.stringify(inertiaProps).replace(/'/g, '&apos;')}'>
              <div id="inertia-loading" style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; background: #1a1a1a; color: #fff;">
                <style>
                  @keyframes pulse-logo {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                  }
                  @keyframes color-cycle {
                    0%, 100% { color: #9f9394; }
                    50% { color: #514849; }
                  }
                  .logo-animate {
                    animation: pulse-logo 2s ease-in-out infinite, color-cycle 3s ease-in-out infinite;
                  }
                </style>
                <div class="logo-animate">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="64" 
                    height="64" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="1.5" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M21 8.007v7.986a2 2 0 0 1 -1.006 1.735l-7 4.007a2 2 0 0 1 -1.988 0l-7 -4.007a2 2 0 0 1 -1.006 -1.735v-7.986a2 2 0 0 1 1.006 -1.735l7 -4.007a2 2 0 0 1 1.988 0l7 4.007a2 2 0 0 1 1.006 1.735" />
                    <path d="M3.29 6.97l4.21 2.03" />
                    <path d="M20.71 6.97l-4.21 2.03" />
                    <path d="M20.7 17h-17.4" />
                    <path d="M11.76 2.03l-4.26 6.97l-4.3 7.84" />
                    <path d="M12.24 2.03q 2.797 4.44 4.26 6.97t 4.3 7.84" />
                    <path d="M12 17l-4.5 -8h9l-4.5 8" />
                    <path d="M12 17v5" />
                  </svg>
                </div>
                <p style="margin-top: 24px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; font-size: 14px;">Morphic CMS</p>
                <p style="font-size: 11px; color: #888; margin-top: 4px;">Preparing your workspace...</p>
              </div>
            </div>
            <script type="module" src="${jsPath}" onerror="console.error('Failed to load script: ${jsPath}'); document.getElementById('inertia-loading').innerHTML = '<p style=color:red>Failed to load application assets. Check console.</p>'"></script>
        </body>
        </html>`

        return c.html(html, status as any)
      }
    )

    await next()
  }
}

declare module 'hono' {
  interface ContextVariableMap {
    inertia: (
      component: string,
      props?: any,
      options?: { status?: number }
    ) => Response | Promise<Response>
  }
}
