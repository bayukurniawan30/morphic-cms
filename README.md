# Morphic CMS

Morphic CMS is a modern, lightweight, and high-performance headless CMS built with a focus on speed, developer experience, and elegant design. It leverages a powerful tech stack to provide a seamless workflow for managing dynamic content and user administration.

## 🚀 Tech Stack

### Backend
- **Framework**: [Hono](https://hono.dev/) - A small, fast, and ultra-lightweight web framework.
- **Runtime**: Node.js (with Hono v4+).
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - A TypeScript ORM for SQL databases with maximum type safety.
- **Database**: [Neon PostgreSQL](https://neon.tech/) - Serverless Postgres.
- **Auth**: JWT-based authentication with `hono/jwt` and `bcryptjs` for security.

### Frontend
- **Framework**: [React](https://reactjs.org/) with [Inertia.js](https://inertiajs.com/) - Build single-page apps without the complexity of modern SPAs.
- **Build Tool**: [Vite](https://vitejs.dev/) - Fast and lean development server.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom "Deep Mocha" premium theme.
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) - Beautifully designed components built with Radix UI.
- **Icons**: [Phosphor](https://phosphoricons.com/) and custom SVG icons.
- **Toasts**: [Sonner](https://sonner.stevenly.cc/) for elegant, non-blocking notifications.
- **Theming**: `next-themes` for seamless light/dark mode support.

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (preferred package manager)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd morphic-cms
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   DATABASE_URL=your_postgres_url
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN_DAYS=7
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

## 🏗️ Build and Deployment

To create a production build:
```bash
pnpm build
```
This project is optimized for deployment on platforms like Vercel via the Hono Vercel adapter.

## 📄 License
MIT
