# Vaultly

**Securely store, manage, and share your files.**

Vaultly is a secure file-storage and sharing application. Authenticated users can upload, manage, and share files with private/public visibility controls.

> This README will be expanded as features are implemented. See `docs/` for architecture notes.

## Features

- User registration, login, and logout (planned)
- Secure large-file uploads to Cloudinary (planned)
- File management dashboard (planned)
- Public/private visibility and shareable links (planned)

## Architecture

```
Frontend (Next.js) → REST API (Express) → PostgreSQL + Cloudinary
```

Detailed architecture documentation will live in `docs/architecture.md`.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Validation | Zod |
| ORM | Prisma |
| Database | PostgreSQL |
| Storage | Cloudinary (signed / chunked uploads) |
| Monorepo | npm workspaces |

## Repository Structure

```
vaultly/
  apps/
    web/          # Next.js frontend
    api/          # Express REST API
  packages/
    shared/       # Shared types and validation schemas
  prisma/         # Database schema and migrations
  docs/           # Architecture and setup documentation
  .github/        # CI workflows (planned)
```

## Prerequisites

- Node.js 20+
- PostgreSQL
- Cloudinary account (for file storage)

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Never commit secrets.

## Local Setup

```bash
npm install
npm run dev:web
npm run dev:api
```

Database migrations and full setup instructions will be added in later phases.

## License

Private — technical assignment.
