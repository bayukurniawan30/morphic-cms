# Morphic CMS Release Notes - v1.2.1

This release delivers critical security isolation enhancements, rich API documentation revisions, fully realized deployment guidelines (Docker & AWS), and a visual System Architecture Flow diagram to the documentation dashboard.

## Features and Improvements

### Security & Tenant Isolation

- **Fixed Cross-Tenant Leakage**: Patched a vulnerability in the global Hono API authentication middleware where requests omitting the `X-Tenant-ID` header could query database assets across multiple organizations.
- **Enforced Tenant Verification**: Non-super-admins are now strictly blocked with a `403 Forbidden` response (`"Valid X-Tenant-ID header is required for this request"`) if the `X-Tenant-ID` header is absent or if they attempt to access a workspace they do not belong to.

### Visual Architecture Diagram

- **Added System Flow Diagram**: Integrated a gorgeous, code-drawn 4-tier System Architecture Flow diagram under the Core Architecture Pillars section illustrating the data lifecycle from **Request Origin** ➔ **Hono Gateway** ➔ **Drizzle ORM** ➔ **Neon Postgres**.
- **Responsive Interactive Lines**: Added desktop connector arrows that dynamically hover-highlight and smoothly animate, scaling down cleanly to a vertical layout on mobile devices.

### Extended Deployment Options (Docker & AWS)

- **Docker VPS Setup**: Documented containerized VPS setups using pre-configured `Dockerfile` and `docker-compose.yml` assets, complete with schema initialization instructions.
- **AWS Serverless Workflow**: Documented a 100% serverless, enterprise AWS-native setup leveraging AWS Lambda (`hono/aws-lambda`), Aurora Serverless v2, S3/CloudFront CDN routing, SES email, and S3 file storage.
- **Vercel Deploy Button**: Updated the deploy button in `README.md` to request `STORAGE_SERVICE` and `EMAIL_SERVICE` inputs during initial creation and resolved a duplicate parameter bug.

### API Reference & Styling Refinements

- **Real-World Payloads**: Replaced JSON response placeholders with detailed schemas mirroring real-world relational database payloads for `GET /api/collections`, `GET /api/collections/:slug/entries`, and `GET /api/entries/:id`.
- **Headless CMS Comparison Matrix**: Added a tabular matrix comparing Headless vs. Traditional CMS and comparing Morphic CMS with popular choices like Strapi, Contentful, and Sanity.
- **Premium Font & Layout Polish**:
  - Overrode browser styles inside `<CodeBlock>` components using inline monospace styles to guarantee clean typography.
  - Revamped query parameter boxes and webhook signature blocks to use `bg-muted` and `bg-slate-950` tokens for perfect contrast in light and dark modes.
  - Refined headers color from `text-slate-500` to high-contrast `text-black` in light mode and `dark:text-slate-400` in dark mode.
