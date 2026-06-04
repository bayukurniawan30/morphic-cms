# Morphic CMS v1.1.8 Release Notes

## Overview

This release introduces highly requested security features along with several UI/UX improvements, making the CMS more secure and easier for developers to integrate with.

## New Features

- **Two-Factor Authentication (2FA)**: Robust 2FA support using TOTP (Google Authenticator, Authy, etc.) to protect your workspace.
  - Full backend infrastructure for generating, verifying, and managing 2FA secrets.
  - Secure two-step login challenge flow.
  - Generates 10 single-use Recovery Codes for backup access.
- **Form Entries API Preview**: Added a new "API Preview" capability to the Form Entries page. Developers can now easily copy the exact REST endpoint URL and view the live JSON response payload for fetching form submissions remotely.

## UI/UX Enhancements

- **Premium 2FA Setup Experience**: Redesigned the 2FA Setup modal with a beautiful two-column layout, step-by-step visual badges, glassmorphism effects, gradient text, and a stylized Recovery Codes secure card.
- **Profile Settings Layout**: Improved the responsive layout on the User Edit profile page to correctly stack the Developer Settings and Security sidebars.

## Bug Fixes

- **otplib v13 Compliance**: Fixed an issue where the `verifySync` method was incorrectly accessing `.isValid` instead of `.valid` due to recent API changes in `otplib`, which was preventing successful 2FA verification.
- **API Preview Styling**: Corrected dark mode overrides in the new API Preview dialog to ensure it strictly respects the user's active light/dark theme settings.
