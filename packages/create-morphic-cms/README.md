# create-morphic-cms

Scaffold a self-hosted Morphic CMS instance.

```bash
npx create-morphic-cms@latest my-cms
```

The CLI clones the selected Morphic CMS release, writes a secure local `.env`, installs dependencies, and—when a `DATABASE_URL` is supplied—runs migrations and creates the initial super admin.

## Options

```bash
npx create-morphic-cms@latest my-cms \
  --ref v1.4.0 \
  --database-url "postgresql://..." \
  --admin-email admin@example.com \
  --admin-password "use-a-strong-password" \
  --admin-username admin
```

Use `--skip-install` or `--skip-db` when you want to complete those steps manually. Use `--help` for the complete option list.
