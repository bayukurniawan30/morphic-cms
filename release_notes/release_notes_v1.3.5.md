# Morphic CMS Release Notes - v1.3.5

We are excited to release **Morphic CMS v1.3.5**! This release introduces dynamic custom domain support for multi-tenant subdomain routing, enabling self-hosted installations to route subdomains, set session cookies, and switch workspaces under their own customized domain.

---

## Key Features

### Dynamic Custom Domain Subdomain Routing

- **`APP_DOMAIN` Configuration**: Added support for an `APP_DOMAIN` environment variable (falling back to `morphic-cms.com`).
- **Subdomain Tenant Resolution**: The backend dynamically detects tenant slugs from host subdomains relative to the configured `APP_DOMAIN`.
- **Wildcard Cookie Scopes**: Session cookies are scoped dynamically to the wildcard base domain (e.g. `.yourdomain.com`) using `APP_DOMAIN` to ensure seamless authentication across subdomains.
- **Smart Local Dev Fallback**: Subdomain redirection is bypassed on raw `localhost` or `127.0.0.1` environments, resolving cookie domain restrictions in modern browsers and preventing authentication loops.

### Client-Side Integration

- **Shared Inertia State**: Propagated the resolved `appDomain` to the frontend via Inertia shared props.
- **Workspace Switcher**: Updated the tenant switcher in the sidebar dashboard to dynamically route to target tenant subdomains in production and fallback to relative root paths locally.
- **Select Tenant Page**: Replaced hardcoded references to allow dynamic subdomain redirects after sign-in.

---

## Documentation & Templates

- **Setup Guidelines**: Updated `README.md` and the interactive `/documentation` page with multi-tenant subdomain setup instructions.
- **One-Click Deployments**: Added `APP_DOMAIN` configuration parameter to the Vercel Deploy button.
- **Templates**: Added `APP_DOMAIN` documentation and placeholder keys to `.env.example` and `docker-compose.yml`.
