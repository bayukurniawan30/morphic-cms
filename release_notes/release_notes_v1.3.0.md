# Morphic CMS Release Notes - v1.3.0

This release introduces Nested Group fields to the schema builder, a brand new interactive API Playground for developer testing, Media Alt Text capabilities for SEO/accessibility, and significant validation engine enhancements.

## Features and Improvements

### Schema Builder & Nested Groups
- **Group Field Type**: Introduced a new `group` field type, allowing fields to be nested inside an object structure.
- **Recursive Zod Validation**: Upgraded the validation engine (`buildZodSchema`) to recursively build Zod validation rules for nested group schemas.
- **Refined Validation Engine**: 
  - Standardized required validations (enforcing `min(1)` for required text, email, select, date, time, and slug fields).
  - Improved handling of optional fields by preprocessing empty strings and nulls to `undefined` before checking optional constraints.
- **New Collection Templates**: Added pre-configured schema templates for **Website Metadata** (with sitename, description, array/repeater list of extra metadata keys) and **Social Media** (platforms and links) to accelerate setup.
- **Nested Group Editor**: Integrated comprehensive nested group field rendering and validator feedback within the dynamic Entry Form compiler.

### Interactive API Playground
- **Embedded API Tester**: Launched an interactive API Playground (`/api-playground`) accessible directly from the sidebar.
- **Auto-Configured Credentials**: Automatically inherits the authenticated user's API key (in `Authorization` header) and active `X-Tenant-ID` header.
- **Developer Features**: Supports HTTP method selection (GET, POST, PUT, DELETE), endpoint path inputs (must start with `/api`), custom request header injection, valid JSON body validation, response status/time telemetry, and a syntax-highlighted terminal-style response panel.

### Media Alt Text (SEO & Accessibility)
- **Database Migration**: Added an `alt` varchar column to the `media` schema (migration `0009_light_ender_wiggin.sql`).
- **Alt Text Management**: Implemented a `PUT /api/media/:id` endpoint and updated the media library UI viewer dialog to include an Alt Text editor panel. Alt text is now automatically injected into image tags.
- **Strict Media Auth**: Overhauled media route authorization middleware to verify both API Key and session cookie contexts, enforcing that only `super_admin` or tenant `owner` accounts can perform write operations (POST, PUT, DELETE).

### Documentation & Documentation Upgrades
- **Expanded API Docs**: Documented the new Media Library & Document Library endpoints (Get, Upload, Edit Alt Text) inside the system API Docs page.
- **Authorization Standards**: Standardized authentication headers (`Authorization: Bearer YOUR_API_KEY`) and tenant constraints across all CURL code blocks.
