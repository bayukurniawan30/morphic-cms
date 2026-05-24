# Morphic CMS Release Notes - v1.1.7

## Overview

Version 1.1.7 is a feature and stability release for Morphic CMS, focusing on enhancing the **Form Builder UX**, upgrading **Form Entries Management**, and resolving key **Technical Bugs**. This version introduces smart field automation, collection-link visibility, highly usable action controls, and improved unit testing coverage.

---

## New Features & UX Improvements

### Smart Form Builder Automation

Form definitions and collection links are now seamlessly synchronized in the form builder:

- **Dynamic Field Injection**: Selecting a **Connected Collection** automatically appends a required `collection_id` text field to the form fields list. Selecting "None" automatically filters out any existing field named `collection_id`.
- **Bi-directional Reset**: If a user deletes the `collection_id` field manually from the form builder using the trash icon, the **Connected Collection (Optional)** dropdown automatically resets back to **None**.

### Revamped Form Entries Management

The form entries view (`EntriesList.tsx`) has been redesigned for a more premium, white-label CMS feel:

- **Action Controls**: Replaced hidden action menus with explicit, accessible action buttons (**Details** and **Delete**) to align with the style of other CMS listing pages.
- **Details Inspector**: Details opens a dedicated dialog showing a structured, clean JSON view of all submitted data fields.
- **Header Metadata**: The subtitle now dynamically shows the **Connected Collection** name alongside a bullet divider if the form is linked to a database collection.
- **Optimized Layouts**: Corrected the Date column width (200px) to prevent excessive whitespace and truncation.

---

## Bug Fixes & API Stability

### Technical Stability

- **Public Submission Endpoint Parser**: Fixed an issue causing an `Internal Server Error` (`SyntaxError: No number after minus sign in JSON`) when processing raw form submit payloads from external API clients.
- **API Boundary Handling**: Fixed an array boundary/index check error on line 3689 of the API controller (`src/api/index.ts`).
- **Robust Test Coverage**: Added comprehensive new tests to `src/api/index.test.ts` to validate form submission, validation logic, and public routes, ensuring future updates do not cause regressions.

---

## Technical Note for Upgrading

If you are upgrading from v1.1.6, please run the database migration to add the `collection_id` column to the `forms` table:

```bash
pnpm install
pnpm run db:migrate
pnpm run build
```
