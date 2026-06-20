# Morphic CMS Release Notes - v1.3.4

We are pleased to release **Morphic CMS v1.3.4**! This patch update improves responsive behavior on the landing page and aligns the admin interface form previews with actual backend routing.

---

## Enhancements

### Form Builder Refinements

- **Public Submission URLs**: Updated the **Public Submission Endpoint** field displayed inside both the **Add Form** and **Edit Form** creators (`src/pages/Forms/Add.tsx` and `src/pages/Forms/Edit.tsx`). The preview URL now correctly includes the active tenant's slug (`/api/forms/{tenantSlug}/{slug}/submit`), matching the backend routing schema and documentation.
