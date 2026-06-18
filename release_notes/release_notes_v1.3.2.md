# Morphic CMS Release Notes - v1.3.2

This release addresses issues with webhook creation and modification submission behaviors in the dashboard administration panel.

## Bug Fixes

### Webhooks Form Submission
- **Fixed Plain JSON Response Error**: Fixed an issue where creating or editing a webhook prompted an Inertia render error: `"All Inertia requests must receive a valid Inertia response, however a plain JSON response was received."`
- **AJAX Fetch Submission**: Changed the form submit handler to perform a manual `fetch` payload post rather than routing via Inertia's `post` helper, matching established API patterns in the CMS.
- **Improved Loading States**: Introduced local submission tracking (`isSubmitting`) to correctly disable actions and update button loading labels while saving changes.
