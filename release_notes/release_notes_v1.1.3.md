# Morphic CMS Release Notes - v1.1.3

We are excited to announce **v1.1.3**, a major update focused on visual excellence, user safety, and premium interface refinements. This release transforms the initial user journey and brings professional-grade polish to the core management experience.

## Highlights

### Creative Authentication Suite

- **Redesigned Login Experience**: A completely transformed `Login` page featuring glassmorphism, dynamic animated background blurs, and the official Morphic logo integration.
- **Premium Workspace Selection**: Redesigned `SelectTenant` page with a clean SaaS aesthetic, utilizing the `deep-mocha` design system for a cohesive transition into the admin panel.
- **Interactive CTAs**: Added a sophisticated "moving border" shimmer effect to the primary "Get Started" button on the home page.

### Enhanced Content Safety

- **Unsaved Changes Guard**: Implemented an intelligent `isDirty` navigation guard in the Entry Form. Users are now protected from accidental data loss with a confirmation alert if they try to leave the page with unsaved changes.
- **Submission Awareness**: The safety guard automatically disengages during active form submissions to ensure a frictionless "Save" and "Publish" workflow.

### Media & Asset Management

- **Video Preview Support**: The entry form now dynamically generates and displays Cloudinary-powered thumbnails for video resources, providing visual clarity for multi-media collections.
- **Media Reordering**: Added intuitive move-left/move-right controls for gallery items, allowing users to arrange media assets directly within the entry form.
- **Type Clarity**: Updated media pickers to explicitly mention support for both images and video (up to 10MB).

### Table & List Improvements

- **Sequential Row Numbering**: Replaced database IDs with intuitive, pagination-aware row numbers (1, 2, 3...) in the Entries List.
- **Contextual Labeling**: Updated "ID" headers to "#" and improved the visibility of badges and identifiers across the dashboard and list views.

## UI/UX Refinements

- **Deterministic Shape Avatars**: Replaced generic text initials with consistent, user-specific shape icons (Stars, Diamonds, etc.) and soft pastel backgrounds.
- **Contrast Optimization**: Significantly improved the readability of Activity IDs and header badges using the `deep-mocha` palette.
- **Responsive Fixes**: Resolved layout overlap issues between content and branding on the login page for smaller viewports.

## Technical Fixes & Improvements

- **Loader Synchronization**: Replaced manual spinners with the standardized `Loader2` component for consistent loading feedback.
- **Bracket Integrity**: Fixed JSX syntax errors and bracket mismatches in the paginated entry list.
- **Layout Stability**: Corrected button centering and z-index issues in the new animated components.
