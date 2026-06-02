# Morphic CMS Release Notes - v1.2.2

This release delivers a critical security patch addressing authentication blocks during Multi-Factor Authentication (2FA) verification.

## Features and Improvements

### Security & Authentication

- **Fixed 2FA Login Authorization Block**: Resolved an issue where users trying to verify their login session using an Authenticator app dynamic TOTP code received a `401 Unauthorized` error.
- **Bypassed Pending Authentication Gate**: Added the `/api/auth/login/2fa` verification route to the global Hono API authentication exception bypass list. Since the session token is only issued _after_ successful verification, this route now correctly permits public payloads before concluding standard authorization validation.
