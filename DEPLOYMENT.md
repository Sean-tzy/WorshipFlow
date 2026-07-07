# Deployment Guide

## Local

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:8080`.

## Vercel

1. Import the repository.
2. Set `VITE_API_URL`.
3. Use `npm run build`.
4. Deploy output directory `dist`.

## Railway

1. Create a frontend service from the repo.
2. Set `VITE_API_URL`.
3. Railway reads `railway.json`.

## Render

Use a static site:

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment: `VITE_API_URL`

## Hostinger VPS or DigitalOcean

Use Docker Compose or build static files and serve with Nginx. Run the Laravel API, MySQL, queues, scheduler, and FFmpeg worker as separate services.
