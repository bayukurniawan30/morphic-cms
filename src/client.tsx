import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import './index.css';

import { ThemeProvider } from './components/theme-provider';

createInertiaApp({
  resolve: name => {
    // A simple resolver for Vite
    const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
    return pages[`./pages/${name}.tsx`] as any;
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <App {...props} />
      </ThemeProvider>
    );
  },
});
