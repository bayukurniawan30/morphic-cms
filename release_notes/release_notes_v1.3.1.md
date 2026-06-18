# Morphic CMS Release Notes - v1.3.1

This release introduces public form views for internal collections with custom branding theme colors and headers, active/inactive toggling, Cloudflare Turnstile bot protection, and IP-based rate limiting.

## Features and Improvements

### Public Forms & Theme Branding
- **Custom HSL Themes**: Introduced 8 curated color presets (`slate`, `emerald`, `blue`, `indigo`, `violet`, `rose`, `orange`, `yellow`) that dynamically apply CSS styles to the public form.
- **Media Manager Header Images**: Allowed users to select and embed header images directly from the Morphic media manager.
- **Custom Copy**: Added options to set custom header and footer branding text to personalize the submission experience.
- **Status Toggle**: Added a toggle switch in the Form settings to open or close the form. When closed, visitors see a beautiful restricted/closed page and backend submissions are automatically blocked.

### Bot Prevention & Security
- **Cloudflare Turnstile**: Integrated Turnstile token verification on the frontend and validated the response in the backend API.
- **IP Rate Limiting**: Added `hono-rate-limiter` middleware to enforce a limit of 5 submissions per 15 minutes per IP per form to prevent spam.
- **Local Dev Bypasses**: Bypassed Turnstile challenges and allowed-origin restrictions on `localhost` or `127.0.0.1` hostnames for an optimized developer experience.

### Configuration & Documentation
- **Updated Vercel Deploy Template**: Appended `CLOUDFLARE_TURNSTILE_SITE_KEY` and `CLOUDFLARE_TURNSTILE_SECRET_KEY` variables to the one-click Deploy button.
- **Documentation Overhaul**: Added a new segment to the system documentation page and updated `README.md` to guide developers on configuring public forms and setting up Turnstile keys.
