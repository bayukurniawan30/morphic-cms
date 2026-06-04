# Morphic CMS Release Notes - v1.2.4

This release introduces global CORS support on API routes to resolve preflight and cross-origin query/submission errors for external headless frontends, and enhances the Collection List visual experience by displaying rich inline thumbnail previews for media columns.

## Features and Improvements

### Networking & Security (CORS)
- **Global CORS Middleware**: Integrated Hono's official CORS middleware (`hono/cors`) on all `/api/*` endpoints. It dynamically mirrors the requesting origin and permits standard headers like `Authorization` and `X-Tenant-ID` during browser preflight options checks.
- **Form Submission Integrity**: External domains configured in a form's "Allowed Origins" list can now successfully execute standard cross-origin `POST` fetch submissions to public endpoints.

### UI & Collection List Experience
- **Inline Media Previews**: Replaced generic text lists (like `"File selected"`) inside Collection tables with high-end, responsive thumbnail previews.
- **Repeater and Gallery Previews**: If multiple files/images are linked to an entry, the grid column displays a stack of up to **3 side-by-side square boxes** and automatically appends a numeric indicator (e.g. `+2`) for remaining files.
- **Video Fallbacks**: Handles video formats by generating safe image poster previews seamlessly.
