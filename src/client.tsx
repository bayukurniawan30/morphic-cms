import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import './index.css';

import { ThemeProvider } from './components/theme-provider';

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
    const page: any = pages[`./pages/${name}.tsx`];
    if (!page) {
      console.error(`Page not found: ${name}. Available pages:`, Object.keys(pages));
      return null;
    }
    return page.default || page;
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <App {...props} />
      </ThemeProvider>
    );
  },
});
