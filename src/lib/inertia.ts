import { Context, Next } from 'hono';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let manifest: any = null;
const isDev = process.env.NODE_ENV !== 'production';

// Load manifest once on startup in production
if (!isDev) {
  const possiblePaths = [
    path.join(process.cwd(), 'dist', '.vite', 'manifest.json'),
    path.join(process.cwd(), '.vite', 'manifest.json'),
    path.join(__dirname, '..', '..', 'dist', '.vite', 'manifest.json'),
    path.join(__dirname, '..', 'dist', '.vite', 'manifest.json'),
    path.join('/var/task', 'dist', '.vite', 'manifest.json'),
    path.join('/var/task', '.vite', 'manifest.json'),
    './dist/.vite/manifest.json'
  ];
  
  for (const manifestPath of possiblePaths) {
    try {
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        console.log('✅ Vite manifest found at:', manifestPath);
        break;
      }
    } catch (e) {
      // Continue searching
    }
  }

  if (!manifest) {
    console.error('❌ CRITICAL: Vite manifest not found. Production assets will fail to load.');
  }
}

export const inertia = (viewFile: string = 'index.html') => {
  return async (c: Context, next: Next) => {
    // Determine if this is an Inertia request outside the closure
    const getHeader = (name: string) => {
      try {
        return c.req.header(name);
      } catch (e) {
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
        url: c.req.url,
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
            <div id="app" data-page='${JSON.stringify(inertiaProps).replace(/'/g, "&apos;")}'>
              <div id="inertia-loading" style="height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: sans-serif; background: #1a1a1a; color: #fff;">
                <div style="width: 40px; height: 40px; border: 3px solid #333; border-top-color: #7c3aed; border-radius: 50%; animate: spin 1s linear infinite;"></div>
                <script>
                  const style = document.createElement('style');
                  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
                  document.head.appendChild(style);
                </script>
                <p style="margin-top: 20px; font-weight: 500;">Morphic CMS</p>
                <p style="font-size: 12px; color: #666;">Loading application assets...</p>
              </div>
            </div>
            <script type="module" src="${jsPath}" onerror="console.error('Failed to load script: ${jsPath}'); document.getElementById('inertia-loading').innerHTML = '<p style=color:red>Failed to load application assets. Check console.</p>'"></script>
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
