# Morphic CMS Release Notes - v1.2.0

This release introduces critical search engine optimization improvements, builder usability refinements, and mobile responsive layout enhancements across entries and form builders.

## Features and Improvements

### Search Engine Optimization
- Fixed Open Graph and Twitter image rendering by converting relative image paths to absolute URLs.
- Resolved metadata tags for og:image, og:logo, and twitter:image dynamically using Hono server context origin on server-rendered routes and window location origin on the client-side homepage.

### Form Builder
- Added a secondary Add Field button at the bottom of the field list in Create Form and Edit Form pages whenever 3 or more fields exist.
- Repositioned the Required switch and Trash button to sit inline on a single row in mobile view for both Add and Edit Form builders.
- Added a standard 6px margin-top (using mt-1.5) to Required switch fields in both Collections and Forms builders for a cleaner alignment.

### Entry Form Layout
- Redesigned the Entry Form header layout to be completely responsive on mobile viewports.
- Stacked metadata info (Collection name and Last updated user info) vertically on mobile and hid the dot divider.
- Re-structured the top action buttons (API Preview, History, Details) to support flexible wrapping inside a full-width container on small screens.
- Pushed the Details toggle button to the right side on mobile devices using left auto margin spacing while retaining normal row-end grouping on desktop screens.
