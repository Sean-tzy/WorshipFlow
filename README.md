# WorshipFlow AI

Next-generation church presentation platform for songs, Bible slides, media, service planning, and live worship operation.

## 1. Product Architecture Overview

WorshipFlow AI is split into a Vite React frontend and a Laravel 12 REST API backend. The frontend delivers the premium SaaS workspace: landing page, auth, dashboard, command palette, presentation builder, live mode, Bible generator, service planner, media library, history, and settings. The backend is designed around Laravel Sanctum authentication, MySQL UUID tables, repositories, service classes, API resources, form requests, policies, queues, and FFmpeg media jobs.

The product model is church-first. Users belong to churches through `church_members`, presentations contain structured slides, songs contain sections, service plans compose presentations and custom items, and activity/AI logs provide auditability.

## 2. Complete Folder Structure

```txt
WorshipFlow/
  src/
    components/        Reusable animated UI primitives and app shell
    data/              Typed product fixture data
    lib/               Utilities and environment configuration
    pages/             Landing, auth, dashboard, builder, live, Bible, planner, media, history, settings
  backend/
    app/
      Repositories/    Data access layer contracts and implementations
      Services/        AI, media, presentation, Bible, and import services
    database/
      migrations/      Laravel migration examples
    routes/api.php     Versioned Sanctum API routes
  database/schema.sql  Normalized MySQL schema
  openapi.yaml         REST API documentation seed
  docker/              Nginx SPA runtime config
  .github/workflows/   CI build workflow
```

## 3. Database Schema

The database uses UUID primary keys, foreign keys, indexes, soft deletes, JSON settings/theme fields, activity logs, and AI generation logs. Core tables include users, churches, members, roles, permissions, songs, song sections, backgrounds, media files, presentations, slides, Bible books/chapters/verses, service plans, favorites, views, settings, and AI logs.

See `database/schema.sql` for the full MySQL schema and `backend/database/migrations` for Laravel migration examples.

## 4. Backend Implementation

Backend target stack:

- Laravel 12
- MySQL 8
- Laravel Sanctum
- REST API resources
- Form requests for validation
- Policies for church-scoped authorization
- Repository pattern for persistence
- Service layer for AI, YouTube import, lyrics splitting, media processing, Bible generation, and presentation rendering
- Queues for FFmpeg thumbnail/metadata generation and long AI jobs

Important backend files:

- `backend/routes/api.php`
- `backend/app/Repositories/PresentationRepository.php`
- `backend/app/Services/AiPresentationService.php`
- `database/schema.sql`
- `openapi.yaml`

## 5. API Routes

The API is versioned under `/api/v1`.

Primary route groups:

- Auth: register, login, logout, forgot password, reset password, current user
- Churches and users
- Songs, YouTube import, AI lyric splitting
- Presentations, slides, duplicate, present
- Media uploads, thumbnails, backgrounds
- Bible search and Bible presentation generation
- Service plans and drag-order persistence
- Settings and activity logs
- AI background, theme, font, color, lyric, and layout generation

## 6. Frontend Implementation

Frontend stack:

- React 19
- Vite
- TypeScript
- TailwindCSS
- Framer Motion
- React Router
- React Hook Form
- Zod
- React Hot Toast
- Recharts
- Lucide icons

React routes:

- `/` landing page
- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/app` dashboard
- `/app/builder`
- `/app/live`
- `/app/bible`
- `/app/planner`
- `/app/media`
- `/app/history`
- `/app/settings`

## 7. UI Component System

The UI uses a dark-first design system:

- Background: `#09090B`
- Card surface: `#111113`
- Accent system: violet, sky blue, emerald
- 20px rounded cards
- Glass panels, glowing borders, and soft shadows
- Inter and Space Grotesk typography
- Lucide icons for controls
- Motion-wrapped buttons, cards, pages, and modals

shadcn/ui strategy: add shadcn primitives as the production API solidifies, keeping local wrappers for `Button`, cards, dialogs, menus, command palette, forms, tabs, sliders, switches, and toast styling.

## 8. Animation System

Framer Motion is used for:

- Page transitions
- Sidebar collapse
- Card hover lift
- Button press states
- Command palette modal transitions
- Live slide fades
- Builder step transitions
- Floating hero mockup animation

Motion respects `prefers-reduced-motion` through global CSS.

## 9. Key Screens and Flows

- Landing: premium SaaS hero, feature cards, demo area, testimonials, FAQ, pricing CTA, footer.
- Auth: login, register, forgot/reset-ready UI, remember me, Google-ready button, Zod validation.
- Dashboard: statistics, chart, recent songs, upcoming service, storage, activity.
- Command palette: `Ctrl + K`, grouped results, search across product domains.
- Builder: YouTube import, lyric editor, background selection, typography preview, two-monitor preview.
- Live: operator/audience mode, timer, next slide, black/blank controls, quick jump, confidence monitor.
- Bible: reference search and verse-to-slide generation.
- Planner: Sunday plan ordering and service presentation mode.
- Media: drag upload surface, asset grid, FFmpeg-ready metadata architecture.
- Settings: church identity, presentation, team, shortcuts.

## 10. Deployment Setup

Environment variables live in `.env` and `.env.example`.

Frontend:

```bash
npm install
npm run api
npm run dev
npm run build
```

Run `npm run api` in one terminal and `npm run dev` in another. The frontend uses `VITE_API_URL`, which defaults to `http://localhost:8000/api`.

Docker:

```bash
docker compose up --build
```

Vercel:

- Uses `vercel.json`
- Set `VITE_API_URL`
- Build command: `npm run build`
- Output: `dist`

Railway/Render/DigitalOcean/Hostinger VPS:

- Use Dockerfile or Node build with Nginx/static hosting
- Set `VITE_API_URL`
- Run backend Laravel API separately with MySQL and queue workers

## 11. README

This README is the implementation and launch guide. It documents the architecture, schema, routes, UI system, animation system, and deployment strategy so the repository presents as a cohesive SaaS project.

## 12. Final Production Checklist

- Replace fixture data with TanStack Query API calls.
- Generate a full Laravel 12 app in `backend/` and move route/service/repository files into it.
- Add complete migrations for every table in `database/schema.sql`.
- Add Laravel Form Requests, Resources, Policies, Factories, Seeders, and Pest tests.
- Add media queue jobs using FFmpeg for thumbnails and metadata.
- Add real YouTube metadata provider and lyrics provider integrations.
- Add OpenAPI generation from Laravel routes.
- Add Playwright visual regression tests for landing, builder, and live mode.
- Add shadcn/ui primitives for dialogs, tabs, sliders, select menus, command, and forms.
- Add light mode and high contrast tokens.
- Add offline cache and optimistic updates.
- Add CI jobs for backend tests once Laravel is installed.
