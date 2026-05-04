# Morphic CMS Release Notes - v1.1.5

## Overview

Version 1.1.5 introduces significant productivity improvements and stabilizes the application's metadata management. The highlight of this release is the new **Collection Templates** system, which allows developers to bootstrap common content structures in seconds.

---

## New Features

### Collection Templates

We've added a "Load from template" dropdown to the Collection creation screen. This allows you to instantly populate your collection with standard fields for:

- **Category**: Title and Slug.
- **Blog Post**: Title, Slug, Content (Rich Text), Excerpt, and Featured Image.
- **Product**: Name, Slug, Description, Price, SKU, and Thumbnail.
- **Team Member**: Full Name, Position, Bio, Photo, and Email.

### Comprehensive API Documentation

The built-in documentation now explicitly lists available query parameters for the `Get Entries` endpoint. This makes it easier to implement:

- **Pagination**: Using `page` and `limit`.
- **Localization**: Filtering by `locale` or requesting `_all` languages.
- **Trash**: Retrieving soft-deleted items with the `trash=true` flag.

---

## Improvements & Fixes

### Unified Metadata & SEO

- **Dynamic Titles**: Centralized page title logic in the main Layout. Page titles now follow a consistent `Title | Morphic CMS` format across the entire app.
- **Favicon Synchronization**: Unified favicon implementation across Landing, Login, and Dashboard pages using `favicon.png`.
- **Conflict Resolution**: Fixed a bug where hardcoded title tags in the server-side shell were overriding dynamic titles from React components.
- **Code Optimization**: Removed redundant metadata tags from over 20+ files, simplifying the codebase and reducing maintenance overhead.

### Technical Updates

- **Inertia integration**: Switched to the more robust `title` prop on the Inertia `<Head>` component for reliable tab title updates.
- **Static Asset Serving**: Updated Hono and Vite configurations to correctly prioritize and serve the new favicon assets.
- **Version bump**: Updated project version to `1.1.5` in `package.json`.
