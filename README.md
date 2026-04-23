<div align="center">
  <img src="https://github.com/bayukurniawan30/morphic-cms/blob/main/morphic_cms_hero_mockup.png?raw=true" alt="Morphic CMS Hero" width="100%" style="border-radius: 12px; margin-bottom: 20px;" />

# MORPHIC CMS

**The Edge-Ready, High-Performance Headless CMS for Modern Developers.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbayukurniawan30%2Fmorphic-cms&env=DATABASE_URL,JWT_SECRET,JWT_EXPIRES_IN_DAYS,CLOUDINARY_API_SECRET,CLOUDINARY_API_SECRET,CLOUDINARY_CLOUD_NAME,CLOUDINARY_UPLOAD_PRESET,RESEND_API_KEY,EMAIL_FROM)

_Built with Hono, Drizzle, and Neon. Designed to be fast, beautiful, and effortless._

</div>

---

### 🚀 Why Morphic?

Morphic CMS isn't just another content manager. It's a lightweight, developer-first platform designed to run at the **Edge**. While other CMSs feel heavy and bloated, Morphic stays agile—leveraging a serverless-first stack that ensures your API is as fast as your content delivery network.

- **⚡ Blazing Fast**: Built on Hono, the ultra-lightweight web framework.
- **☁️ Serverless & Edge-Ready**: Perfect for Vercel, Cloudflare Workers, and Neon DB.
- **🎨 Premium UI**: A sleek, dark-themed dashboard that doesn't just work—it looks incredible.
- **🏗️ Developer Experience**: Type-safe with Drizzle ORM and built with the power of React + Inertia.js.

---

### ✨ Key Features

- **🌐 Multi-tenant Architecture**: Scale your SaaS easily. Manage isolated organizations and workspaces from a single instance.
- **🛠️ Dynamic Schema Builder**: Define custom collections and global settings with a powerful, intuitive field system.
- **📁 Smart Media Management**: Seamlessly integrated Cloudinary support with automatic, tenant-based organization.
- **🔒 Secure by Design**: Tenant-scoped REST API with JWT authentication and granular API Key permissions.
- **🌍 Built-in i18n**: Native multi-language support for global content strategies.
- **📊 Real-time Analytics**: Built-in API usage tracking and performance monitoring out of the box.

---

### 🛠️ The "Edge-First" Tech Stack

Morphic leverages the most cutting-edge tools in the ecosystem:

| Layer        | Technology                               | Why?                                                           |
| ------------ | ---------------------------------------- | -------------------------------------------------------------- |
| **Core**     | [Hono](https://hono.dev/)                | Sub-millisecond overhead, runs on any runtime.                 |
| **Database** | [Neon PostgreSQL](https://neon.tech/)    | Serverless, autoscaling, and branched workflows.               |
| **ORM**      | [Drizzle ORM](https://orm.drizzle.team/) | TypeScript-first, zero-runtime overhead.                       |
| **Bridge**   | [Inertia.js](https://inertiajs.com/)     | The feel of an SPA with the simplicity of server-side routing. |
| **Styling**  | [Tailwind CSS](https://tailwindcss.com/) | Rapid, beautiful, utility-first design.                        |

---

### 📦 Quick Start

#### One-Click Deploy

The fastest way to get Morphic running is to click the **Deploy with Vercel** button above. It will set up your repository, environment variables, and initial deployment in seconds.

#### Local Development

1. **Clone & Install**:

   ```bash
   git clone https://github.com/bayukurniawan30/morphic-cms.git
   cd morphic-cms
   pnpm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in your database and Cloudinary credentials.

3. **Database Setup**:

   ```bash
   pnpm run db:push    # Push schema to Neon
   pnpm run db:seed    # Seed initial admin user
   ```

4. **Run**:
   ```bash
   pnpm run dev
   ```

---

### 🤝 Contributing

We love stars! ⭐ If you find Morphic useful, please give it a star on GitHub to help others find it.

Morphic is an open-source project. Feel free to open issues or submit PRs to help us build the fastest CMS on the web.

---

<div align="center">
  <p>Made with ❤️ by <b>Bayu Kurniawan</b></p>
</div>
