# Morphic CMS Release Notes - v1.4.1

We are excited to release **Morphic CMS v1.4.1**! This patch release makes it much faster to create a new self-hosted Morphic CMS installation with the new project-creation CLI.

---

## Key Features

### Create Morphic CMS CLI

- **One-command project setup**: Create a new Morphic CMS instance with `npx create-morphic-cms@latest my-cms`.
- **Guided configuration**: The CLI can collect the database URL, initial super-admin credentials, and application domain while creating the project.
- **Secure generated configuration**: New projects receive a unique JWT secret, while the selected admin credentials are written as seed environment variables rather than being embedded in application code.
- **Optional automated setup**: When database details are provided, the CLI can install dependencies, run migrations, and seed the initial admin account.
- **Automation-friendly flags**: Options such as `--yes`, `--skip-install`, `--skip-db`, and `--ref` support CI, local testing, and reproducible setup from a specific Morphic CMS version.

---

## Upgrade Notes

- No database migration is required for existing v1.4.0 installations.
- The `create-morphic-cms` package is published separately to npm. Existing installations do not need it; it is intended for creating new projects.
- Initial admin seed values can now be set with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_USERNAME` in your environment.
