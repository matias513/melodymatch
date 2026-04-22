# MelodyMatch Starter

Starter lanzable para una web que busca canciones por tarareo con un catálogo curado inicial.

## Qué incluye
- Next.js 15 + TypeScript + Tailwind
- API `/api/search`
- SQLite con Prisma
- Historial de búsquedas
- Catálogo curado de 60+ hits globales y LATAM
- Matching demo a partir de features básicas del audio

## Cómo correrlo

```bash
npm install
cp .env.example .env
npm run db:generate
npx prisma migrate dev --name init
npm run dev
```

Abrí `http://localhost:3000`

## Deploy rápido
- Subí el repo a GitHub
- Importalo en Vercel
- En Vercel agregá `DATABASE_URL`
- En producción cambiá SQLite por Postgres si querés escalar

## Importante
Esta versión sirve para lanzar una beta. Para reconocimiento serio a gran escala después hay que sumar:
- catálogo/licencias más grandes
- embeddings de audio
- búsqueda vectorial
- mejores features melódicas
