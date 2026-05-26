# Hejal — Gestión Kolel

App web para administrar donadores, abrejim, nóminas y caja.

## Stack
- Next.js 15 (App Router)
- PostgreSQL + Prisma
- NextAuth (login con email/password)
- Tailwind CSS

## Setup en el VPS (primera vez)
```bash
cd /opt/hejal
cp .env.example .env
# editar .env con DATABASE_URL y NEXTAUTH_SECRET reales
npm ci
npx prisma migrate deploy
npm run build
npm run create:admin admin@hejal.com TU_PASSWORD "Admin"
pm2 start npm --name hejal -- start
pm2 save
```

## Importar datos desde Google Sheet
1. Hacer el Sheet público de lectura
2. Setear los `GID_*` en `.env` (uno por pestaña)
3. `npm run import:sheet`

## Comandos
- `npm run dev` — desarrollo local
- `npm run build` — build de producción
- `npm start` — arranca en :3000
- `npm run create:admin <email> <password> [nombre]`
- `npm run import:sheet`
