# Morphic CMS

Morphic CMS is a modern, lightweight, and high-performance headless CMS built with a focus on speed, developer experience, and elegant design. It leverages a powerful tech stack to provide a seamless workflow for managing dynamic content and user administration.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbayukurniawan30%2Fmorphic-cms&env=DATABASE_URL,JWT_SECRET,JWT_EXPIRES_IN_DAYS,CLOUDINARY_API_SECRET,CLOUDINARY_API_SECRET,CLOUDINARY_CLOUD_NAME,CLOUDINARY_UPLOAD_PRESET,RESEND_API_KEY,EMAIL_FROM)

## ✨ Key Features

- **Multi-tenant Architecture**: Manage multiple isolated organizations and workspaces from a single instance.
- **Dynamic Content Builder**: Create custom collections and global fields with a flexible field system.
- **Media & Document Management**: Integrated Cloudinary support with automatic tenant-based folder organization.
- **Secure API**: Tenant-scoped REST API with JWT authentication and API Key support.
- **Internationalization (i18n)**: Built-in multi-language support for global content delivery.
- **Premium UI**: Dark-themed, responsive dashboard built with Shadcn UI and Tailwind.

## 🚀 Tech Stack

### Backend

- **Framework**: [Hono](https://hono.dev/) - A small, fast, and ultra-lightweight web framework.
- **Runtime**: Node.js (with Hono v4+).
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - A TypeScript ORM for SQL databases with maximum type safety.
- **Database**: [Neon PostgreSQL](https://neon.tech/) - Serverless Postgres.
- **Auth**: JWT-based authentication with `hono/jwt` and `bcryptjs` for security.

### Frontend

- **Framework**: [React](https://reactjs.org/) with [Inertia.js](https://inertiajs.com/) - Build single-page apps without the complexity of modern SPAs.
- **Build Tool**: [Vite](https://vite.dev/) - Fast and lean development server.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom "Deep Mocha" premium theme.
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) - Beautifully designed components built with Radix UI.
- **Icons**: [Phosphor](https://phosphoricons.com/) and [Lucide React](https://lucide.dev/) for a crisp and consistent visual language.
- **Toasts**: [Sonner](https://sonner.stevenly.cc/) for elegant, non-blocking notifications.
- **Theming**: `next-themes` for seamless light/dark mode support.

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (preferred package manager)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/bayukurniawan30/morphic-cms
   cd morphic-cms
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following:

   ```env
   DATABASE_URL=
   JWT_SECRET=
   JWT_EXPIRES_IN_DAYS=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_UPLOAD_PRESET=
   # Email Service (Resend)
   RESEND_API_KEY=re_...
   EMAIL_FROM=Morphic CMS <onboarding@resend.dev>
   ```

4. **Run the development server**:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🗄️ Database Management

This project uses **Drizzle ORM** for database schema management and migrations.

### Schema Synchronization (Fast Path)

To quickly push your schema changes directly to the database (recommended for local development):

```bash
pnpm db:push
```

### Migrations (Production Path)

To generate and run official migration files:

1. **Generate migrations**:

   ```bash
   pnpm db:generate
   ```

2. **Apply migrations**:
   ```bash
   pnpm db:migrate
   ```

### Seeding

To populate your database with initial data (e.g., default super admin):

```bash
pnpm db:seed
```

### Database Studio

Explore and edit your data visually:

```bash
pnpm db:studio
```

## 🚀 Deployment (Vercel)

This project is optimized for deployment on **Vercel** using the **Hono Framework Preset**.

### 1. Vercel Configuration

- **Framework Preset**: Select `Hono` in the Vercel Dashboard.
- **Node Runtime**: Pin to `20.x` or `22.x` in `package.json`.
- **Environment Variables**:
  - `DATABASE_URL`: Your Neon/Postgres connection string.
  - `JWT_SECRET`: A secure random string for signing tokens.
  - `JWT_EXPIRES_IN_DAYS`: Token expiration duration in days.
  - `CLOUDINARY_API_KEY`: Your Cloudinary API key.
  - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret.
  - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name for media storage.
  - `CLOUDINARY_UPLOAD_PRESET`: Your Cloudinary upload preset.
  - `RESEND_API_KEY`: Your Resend API key for email services.
  - `EMAIL_FROM`: The sender email address.
  - `NODE_ENV`: Set to `production`.

### 2. Architecture Notes

- **ESM Native**: All internal imports must use the `.js` extension to comply with ESM in Node environments.
- **Root Entry Point**: The project uses a root `index.ts` to export the Hono `app` directly for Vercel's automatic detection.
- **Asset Handling**: In production, the Hono server reads `dist/.vite/manifest.json` at runtime to resolve hashed JS/CSS filenames.
- **Inertia Protocol**: The backend includes a custom Inertia middleware that handles initial page loads by injecting a `data-page` attribute and subsequently serving JSON for XHR requests.

---

## 🛠️ Tech Stack

- **Backend**: [Hono](https://hono.dev/) (Web Standards Framework)
- **Frontend**: [React](https://react.dev/) + [Inertia.js](https://inertiajs.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + [Neon](https://neon.tech/)
- **Icons**: [Phosphor Icons](https://phosphoricons.com/) + [Lucide React](https://lucide.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)

---

## 📝 License

MIT
