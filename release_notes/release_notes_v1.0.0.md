# 🚀 Morphic CMS v1.0.0 — Initial Release

We are excited to announce the official release of **Morphic CMS v1.0.0**! 

Morphic CMS is a modern, lightweight, and high-performance headless CMS built with a focus on speed, developer experience, and elegant design. This initial release establishes a powerful foundation for managing dynamic content across multiple organizations with a premium administrative experience.

---

## ✨ Key Features

- **Multi-tenant Architecture**: Manage multiple isolated organizations and workspaces from a single instance with zero data leakage.
- **Dynamic Content Builder**: Create custom collections and global fields with a flexible field system tailored to your data needs.
- **Media & Document Management**: Native Cloudinary integration with automatic tenant-based folder organization and optimized delivery.
- **Secure API & Auth**: Tenant-scoped REST API protected by JWT authentication and granular API Key support.
- **Internationalization (i18n)**: Built-in multi-language support for seamless global content delivery.
- **Premium UI/UX**: A beautiful, dark-themed responsive dashboard built with Shadcn UI and Tailwind CSS, featuring a custom "Deep Mocha" aesthetic.

---

## 🚀 Tech Stack

### Backend
- **Hono**: Ultra-lightweight web framework for high-performance routing.
- **Drizzle ORM**: Max type-safety and developer productivity for SQL interactions.
- **Neon PostgreSQL**: Serverless Postgres for effortless scaling.
- **JWT Auth**: Secure, stateless authentication for both dashboard and API.

### Frontend
- **React & Inertia.js**: Single-page application performance without the complexity of traditional SPAs.
- **Vite**: Next-generation frontend tooling for rapid development.
- **Shadcn UI & Tailwind**: Industry-leading design system for a premium, accessible interface.

---

## 🛠️ Management & Tooling
- **Schema Sync**: Push schema changes directly to the database with `pnpm db:push`.
- **Database Studio**: Explore and edit your data visually with a built-in UI.
- **Seeding**: Quickly populate your instance with default data via `pnpm db:seed`.
- **Vercel Optimized**: Ready-to-deploy configuration for the Hono Framework Preset.

---

## 📝 Getting Started
Check out the [README.md](./README.md) for full installation and deployment instructions.

**Morphic CMS** — Built for speed. Designed for elegance. Ready for your next project.
