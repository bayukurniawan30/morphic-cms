# Morphic CMS v1.1.0 — The Multi-Tenant Expansion

This release marks a major milestone for **Morphic CMS**, transforming the platform into a true multi-tenant powerhouse. Version 1.1.0 introduces complete organization isolation and a significantly upgraded media handling system.

---

## Major Feature: Full Multi-Tenancy Support

Morphic CMS now supports multiple isolated workspaces within a single instance. This is perfect for agencies, enterprises, or any project managing multiple distinct clients.

- **Workspace Isolation**: Data, users, and media are now strictly scoped to their respective tenants.
- **Tenant Switcher**: A seamless new UI component in the sidebar for Super Admins to hop between organizations.
- **Role-Based Tenant Access**: Users can now hold different roles (Owner, Member) in different workspaces.
- **Scoped API Access**: Every API request is now validated against the active tenant context, ensuring total data security.

---

## Enhanced Cloudinary Integration

We’ve overhauled the way media and documents are handled to ensure better organization and faster performance.

- **Tenant-Based Folders**: Media is now automatically organized into dedicated Cloudinary folders per tenant, keeping your storage clean and structured.
- **Optimized Upload Flow**: Improved the underlying upload logic for both high-resolution images and large documents.
- **Unified Document Support**: Enhanced handling for non-image assets (PDFs, ZIPs, etc.) with consistent metadata management.

---

## Security & Performance

- **JWT Scoping**: Hardened JWT tokens to include tenant-level claims.
- **Middleware Optimization**: New tenant-detection middleware that resolves the active workspace with zero overhead.
- **Improved API Key Logic**: API keys can now be scoped to specific workspaces for secure third-party integrations.

**Morphic CMS** — Scalable. Isolated. More powerful than ever.
