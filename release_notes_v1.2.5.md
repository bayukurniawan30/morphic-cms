# Morphic CMS Release Notes - v1.2.5

This release introduces form submission email notification capabilities, allowing workspace administrators and editors to configure real-time notifications when users submit forms.

## Features and Improvements

### Form Notifications
- **Email Notifications Toggle**: Added a toggle switch in both the **Form Add** and **Form Edit** builders to configure whether submission alerts should be sent to all users in the active tenant workspace.
- **Tenant User Routing**: Form submissions automatically query all active users belonging to the form's tenant to send them notification emails, ensuring workspace-isolated alerts.
- **Themed HTML Notifications**: Configured email templates to match the workspace's welcome email color scheme (`#87787a` for header, `#514849` for accents and borders, and `#f9f9f9` for background details), presenting a beautiful, modern table displaying the submitted form data.
- **Spam Filtering Integration**: Email notifications are safely skipped if a honeypot field is triggered, protecting workspace inboxes from automated spam submissions.
