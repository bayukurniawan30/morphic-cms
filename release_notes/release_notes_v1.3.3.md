# Morphic CMS Release Notes - v1.3.3

We are thrilled to release **Morphic CMS v1.3.3**! This update focuses on enhancing developer documentation, styling the homepage playground sandbox, and implementing a new Changelog portal.

---

## Features & Enhancements

### Interactive Homepage

- **Gradient Background**: Replaced the landing page's video backdrop with a radial-fade masked `gradient-pattern.webp` background.
- **Playground Sandbox Grid**: Re-arranged the Playground's schema configuration controls into a compact 2-column grid and lowered the code output panel minimum heights to `320px` to fit above-the-fold content beautifully.

### Omnichannel Code Snippets

- **Multi-Language Support**: Added new API fetch examples for various programming languages to easily retrieve collection content.
- **Custom Vector Logos**: Added premium vector icons for each selectable SDK language, dynamically updating the code block headers with matching virtual file extensions.

### Dynamic Changelog Portal

- **Automated Release Notes Reader**: Added a Hono backend route (`GET /changelog`) that dynamically reads local markdown files in `release_notes/`, parses them to HTML, and serves them.
- **Timeline Page Component**: Added `src/pages/Changelog.tsx` to render a vertical release timeline styled with Tailwind Typography.
- **Scroll-to-Top Button**: Integrated an animated scroll-to-top button on the Changelog layout that activates smoothly after scrolling past `300px`.

---

## API & Admin Refinements

- **Tenant Pre-Validation**: Added proactive duplicate checks for tenant slugs in `POST /api/tenants`, preventing database-level unhandled exceptions and returning a clean `400 Bad Request` with validation feedback instead.
- **Forms Endpoint Docs**: Corrected the contact form submit mock snippet inside `src/pages/ApiDocs.tsx` to include the required `/your-tenant-slug/` prefix.
- **List UI Alignment**: Converted the localization language actions column in `Localization/List.tsx` to use flat text "Delete" buttons rather than icons.
