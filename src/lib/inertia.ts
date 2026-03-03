import { Context, Next } from 'hono';

export const inertia = (viewFile: string = 'index.html') => {
  return async (c: Context, next: Next) => {
    c.set('inertia', (component: string, props: any = {}) => {
      const inertiaProps = {
        component,
        props,
        url: c.req.url,
        version: null,
      };
      
      const isInertiaRequest = c.req.header('X-Inertia') === 'true';

      if (isInertiaRequest) {
        return c.json(inertiaProps, 200, {
          'X-Inertia': 'true',
          'Vary': 'Accept',
        });
      }

      // Determine if we are in development mode to inject Vite Refresh preamble
      const isDev = process.env.NODE_ENV !== 'production';
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
            ${vitePreamble}
        </head>
        <body>
            <!-- Inertia app mounting point -->
            <div id="app" data-page='${JSON.stringify(inertiaProps).replace(/'/g, "&apos;")}'></div>
            <script type="module" src="/src/client.tsx"></script>
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
