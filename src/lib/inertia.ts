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

    c.set('inertia', (component: string, props: any = {}) => {
      const inertiaProps = {
        component,
        props,
        url: c.req.url,
        version: null,
      }

      if (isInertiaRequest) {
        return c.json(inertiaProps, 200, {
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
            <title>Morphic CMS</title>
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

      return c.html(html)
    })

    await next()
  }
}

declare module 'hono' {
  interface ContextVariableMap {
    inertia: (component: string, props?: any) => Response | Promise<Response>
  }
}
