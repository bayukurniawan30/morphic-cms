import { Context, Next } from 'hono';
import fs from 'fs';
import path from 'path';

let manifest: any = null;
const isDev = process.env.NODE_ENV !== 'production';

// Load manifest once on startup in production
if (!isDev) {
  const possiblePaths = [
    path.join(process.cwd(), 'dist', '.vite', 'manifest.json'),
    path.join(process.cwd(), '.vite', 'manifest.json'),
    path.join(__dirname, '..', '..', 'dist', '.vite', 'manifest.json'),
    path.join('/var/task', 'dist', '.vite', 'manifest.json'),
  ];
  
  for (const manifestPath of possiblePaths) {
    try {
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        console.log('✅ Vite manifest loaded from:', manifestPath);
        break;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  if (!manifest) {
    console.error('❌ Failed to load Vite manifest from any location. Production assets may be broken.');
  }
}

export const inertia = (viewFile: string = 'index.html') => {
  return async (c: Context, next: Next) => {
    // Determine if this is an Inertia request outside the closure
    // Also handle possible Hono-Vercel adapter quirks by providing a fallback
    const getHeader = (name: string) => {
      try {
        return c.req.header(name);
      } catch (e) {
        // Fallback for Node-style raw requests if the Hono wrapper is in a broken state
        const rawHeaders = (c.req.raw as any)?.headers;
        if (rawHeaders) {
          return typeof rawHeaders.get === 'function' 
            ? rawHeaders.get(name) 
            : rawHeaders[name.toLowerCase()];
        }
        return undefined;
      }
    };

    const isInertiaRequest = getHeader('X-Inertia') === 'true';

    c.set('inertia', (component: string, props: any = {}) => {
      const inertiaProps = {
        component,
        props,
        url: c.req.url, // c.req.url is usually safe as it's a getter
        version: null,
      };

      if (isInertiaRequest) {
        return c.json(inertiaProps, 200, {
          'X-Inertia': 'true',
          'Vary': 'Accept',
        });
      }

      // Determine asset paths
      let jsPath = '/src/client.tsx';
      let cssTags = '';

      if (!isDev && manifest) {
        const entry = manifest['index.html'];
        if (entry) {
          jsPath = `/${entry.file}`;
          if (entry.css) {
            cssTags = entry.css.map((css: string) => `<link rel="stylesheet" href="/${css}">`).join('\n');
          }
        }
      }

      const vitePreamble = isDev ? `
        <script type="module">
          import RefreshRuntime from "/@react-refresh"
          RefreshRuntime.injectIntoGlobalHook(window)
          window.$RefreshReg$ = () => {}
          window.$RefreshSig$ = () => (type) => type
          window.__vite_plugin_react_preamble_installed__ = true
        </script>
        <script type="module" src="/@vite/client"></script>
      ` : '';

      // Serve HTML with data-page attribute for initial load
      const html = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Morphic CMS</title>
            ${cssTags}
            ${vitePreamble}
        </head>
        <body class="bg-background text-foreground">
            <div id="app" data-page='${JSON.stringify(inertiaProps).replace(/'/g, "&apos;")}'></div>
            <script type="module" src="${jsPath}"></script>
        </body>
        </html>`;

      return c.html(html);
    });

    await next();
  };
};

declare module 'hono' {
  interface ContextVariableMap {
    inertia: (component: string, props?: any) => Response | Promise<Response>;
  }
}
