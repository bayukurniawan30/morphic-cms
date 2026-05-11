# Morphic CMS Release Notes - v1.1.6

## Overview

Version 1.1.6 is a major update that brings automation and white-labeling capabilities to Morphic CMS. This release introduces a robust **Webhook Management System** for integrating with external services like Vercel and Slack, along with a new **Simple Homepage** mode for a cleaner, branded entry point.

---

## New Features

### Webhook Management System

Take automation to the next level with our new tenant-scoped Webhook system. You can now configure outgoing HTTP notifications for various system events:

- **Entries**: Triggers on created, updated, published, and deleted (including trash).
- **Media**: Triggers on file uploads and deletions.
- **Forms**: Triggers whenever a frontend form receives a new submission.

**Security First**: Each webhook supports an optional **Secret Key** for HMAC SHA256 signing, allowing your receiving server to verify that the request truly came from Morphic CMS via the `X-Morphic-Signature` header.

### Simple Homepage Mode

For users who want to use Morphic CMS as a backend without the full marketing landing page, we've introduced a "Simple Homepage" toggle.

- **Minimal Branding**: A clean, centered view showing "Powered by Morphic CMS" and your domain.
- **Deep Mocha Aesthetic**: The simple view is styled with our premium Deep Mocha theme, featuring dynamic background glows and a "live" status pulse.
- **Configuration**: Simply set `SIMPLE_HOMEPAGE=1` in your environment variables.

---

## Improvements & Fixes

### Deep Mocha Theme Refinement

- Applied a consistent **Deep Mocha** color palette to the branding elements.
- Enhanced background glow visibility with multi-layered, animated gradients for a more premium "Edge" feel.
- Added a feature-highlight section to the simple homepage showcasing core capabilities (Dynamic Schemas, Instant APIs, and Flexible Field Types).

### Technical Stability

- **API Logging**: Fixed a regression in the API Logging middleware where `apiLogs` was missing from the schema imports.
- **Stale Import Cleanup**: Removed legacy and unused imports from the main API router to improve compilation speed and reduce bundle size.
- **Bulk Operations**: Added webhook triggers to transactional bulk entry creation.

---

## Technical Note for Upgrading

If you are upgrading from v1.1.5, please run the following to update your database schema for webhooks:

```bash
npm run db:generate
npm run db:migrate
```
