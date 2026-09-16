# Morphic CMS Release Notes - v1.4.0

We are excited to release **Morphic CMS v1.4.0**! This release expands Morphic CMS into a more complete multi-tenant cloud platform, with subscription-aware plans, stronger workspace controls, webhook observability, richer public content tools, and a more capable developer API.

---

## Key Features

### Cloud Plans, Pricing & Billing

- **Free and Pro plans**: Introduced plan-aware limits for workspaces, collections, users, localization, webhook-log retention, and monthly API usage.
- **Polar checkout integration**: Added Pro checkout and signed Polar webhook handling to automatically upgrade or downgrade account access.
- **Pricing experience**: Added public and authenticated pricing pages, launch pricing, and a Pro subscriber overview for super administrators.
- **Billing policies**: Added Terms, Privacy, and Refund Policy pages for the cloud service.

### Multi-Tenant Workspace Improvements

- **Workspace-aware limits**: Enforced collection and user limits based on the workspace owner's plan.
- **Workspace discovery**: Added workspace search to the tenant switcher and clearer workspace creation availability.
- **Reserved workspace slugs**: Prevented workspace slugs from conflicting with product routes.
- **Public signup flow**: Added account signup, email verification, and improved tenant selection for cloud users.

### Webhooks & Operational Visibility

- **Webhook delivery logs**: Record delivery status, response metadata, duration, and safely truncated response bodies.
- **Webhook log viewer**: Added filtering and inspection tools for webhook delivery history.
- **Automatic retention**: Added a daily Vercel Cron task that retains logs according to the workspace plan.
- **Usage reporting**: Added monthly API-request counters to the dashboard and improved usage tracking efficiency.

### Content, Forms & API Improvements

- **Collection-field API filters**: REST and GraphQL entry queries can now exact-match top-level Select, Radio, and Boolean fields. Multiple filters use AND logic and apply before pagination.
- **API documentation**: Added in-app API documentation, collection schema previews, richer examples, and an improved API Playground with a quick collection endpoint picker.
- **Granular API-key permissions**: Extended API-key ability checks to media and media-folder access.
- **Form enhancements**: Added public submission endpoint copy actions, automatic form closure after a configured maximum number of entries, and safer form-state updates.
- **Reliable entry defaults**: Improved initialization and validation of Boolean and nested field values.
- **Relation API fix**: Corrected relation population for specific entry API responses.

### Public Site, SEO & UI

- **Blog and content presentation**: Added public blog listing and detail pages, dynamic sitemap support, draft API previews, and enhanced social metadata.
- **Marketing improvements**: Updated the landing page, documentation, social preview imagery, analytics integration, and featured-product badges.
- **Dashboard and management UI**: Refined page layouts, rich-text editor behavior, table styling, media selection, metrics tooltips, and user/collection management views.
- **Sidebar sponsor card**: Added a dismissible, session-random sponsored recommendation card in the sidebar.

---

## Deployment & Performance

- **Vercel asset delivery**: Updated deployment handling to prevent production CSS and JavaScript asset lookup failures.
- **JSONB query performance**: Added a space-efficient GIN index for entry content, improving exact JSONB field filtering.
- **Faster serverless queries**: Reduced avoidable internal HTTP requests during cold starts.

---

## Upgrade Notes

- Apply the new Drizzle migrations (`0012` through `0017`) before running v1.4.0 in production.
- Cloud deployments using billing must configure the Polar environment variables, including `POLAR_API_TOKEN`, `POLAR_PRODUCT_ID`, and `POLAR_WEBHOOK_SECRET`.
- Existing self-hosted installations can continue using the `SELF_HOSTED` plan tier and do not need to enable checkout.
