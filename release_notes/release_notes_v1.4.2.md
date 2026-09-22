# Morphic CMS Release Notes - v1.4.2

We are excited to release **Morphic CMS v1.4.2**! This documentation-focused patch makes it easier to connect applications to Morphic CMS using the official JavaScript and TypeScript SDK.

---

## Documentation & Developer Experience

### Official JavaScript / TypeScript SDK

- **Published SDK guidance**: Added installation and setup instructions for [`@morphic-cms/sdk`](https://www.npmjs.com/package/@morphic-cms/sdk).
- **Typed integration example**: Updated the in-app API Docs to demonstrate the SDK instead of requiring users to manually construct authenticated `fetch` requests.
- **REST API reference**: Added an SDK quick-start card covering API-key authentication, tenant headers, pagination, and typed entry access.
- **Secure usage guidance**: Clarified that API keys belong in server-side environment variables and must not be exposed in public browser bundles.

### GraphQL REST API Parity

- **Collection permission enforcement**: GraphQL entry reads and mutations now apply the same API-key collection abilities as the REST API.
- **Paginated entry queries**: Added `entriesPage`, returning entry pagination metadata that matches REST responses; the original `entries` query remains available for compatibility.
- **Richer entry querying**: Added single-entry reads plus REST-aligned locale, status, trash, sorting, relation-population, and exact Select/Radio/Boolean filter support.
- **Entry mutations**: Added GraphQL mutations to create, update, and delete entries, including validation, webhooks, trash behavior, and entry-version snapshots.

---

## Upgrade Notes

- No database migration is required for existing v1.4.1 installations.
- The SDK is distributed separately as `@morphic-cms/sdk`; install it in a consuming application with `pnpm add @morphic-cms/sdk`.
