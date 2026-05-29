# Morphic CMS v1.1.9 Release Notes

## Overview

This release focuses on improving multi-tenant access control and permissions, restructuring the codebase for better modularity, and introducing responsive enhancements for collection designers, the media library, and the API previewer.

## Key Changes

- **Automatic Tenant Redirects**: If a user is only assigned to a single tenant workspace, the system now automatically bypasses the manual selection screen and redirects them to their active workspace immediately, showing a clean loading screen.
- **Tenant Owner Permission Fixes**: 
  - Fixed a permission logic bug where tenant Owners were blocked from newly created collections inside their tenant. Owners now have automatic, complete privileges (create, read, update, delete) to manage any collection inside their workspace.
  - Allowed tenant Owners to successfully update and save user API Key Abilities in the user edit endpoint.
- **Dynamic Collection Designer Layout**:
  - Combined the Required toggle and the Delete action button inside collection fields to sit side-by-side in a single row on mobile screens.
  - Formatted fields header buttons to stack vertically on mobile screens.
  - Fixed a sub-field Name auto-generation bug inside Nested Fields (Repeater) child items.
  - Added a conditional Add Field action button at the bottom of the list for collection schemas with 3 or more fields.
- **API Preview Responsive Layout**: Relocated copy buttons to a responsive dropdown menu behind a single three-dots icon trigger on mobile viewports, while keeping three separate full-sized copy buttons for desktop viewports.
- **Settings and Sidebar Security**: Hidden the system-wide Transactional Email Settings sidebar navigation link and settings card from non-super-admin users to prevent dead links.
- **Restructured API Key Abilities**: Moved the root-level ApiKeyAbilities.tsx page component under a dedicated sub-folder structure as List.tsx to improve project organization.
- **Media Library Tip**: Added a helpful navigation tip box below the breadcrumbs inside the Media Library when folders exist.
- **Search Engine Optimization (SEO)**: 
  - Added rich, complete SEO metadata (description, keywords, robots directives, Open Graph, and Twitter Cards) to the Simple Homepage view.
  - Initialized a custom robots.txt inside the public folder to direct search engine crawlers and secure administrative dashboards from search indexing.
