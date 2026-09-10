# Vertex

Vertex is an AI-powered learning platform for exploring structured courses and watching lessons without leaving the product. Course, instructor, category, module, and lesson content is managed in Sanity; learners can browse the catalog, expand course modules, and play the seeded YouTube lessons in place.

## Features

- Browse a public course catalog backed by Sanity content.
- Open individual course pages with curriculum, learning outcomes, and course metadata.
- Expand modules to reveal ordered lesson links.
- Watch seeded YouTube lesson videos inside Vertex.
- Sign in and sign up with Clerk.
- Access the embedded Sanity Studio at `/studio` for content management.

## Tech stack

- **Framework:** Next.js 16 with the App Router and React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 and custom responsive CSS
- **CMS:** Sanity Studio 5, `next-sanity`, and `@sanity/image-url`
- **Authentication:** Clerk (`@clerk/nextjs`)
- **Video playback:** YouTube privacy-enhanced iframe embeds
- **Tooling:** ESLint, npm, and Git

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and provide the required Clerk and Sanity values.

3. Start the application:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Available scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Main routes

- `/` — home page and featured courses
- `/courses` — complete course catalog
- `/courses/[slug]` — course curriculum and module accordion
- `/lessons/[slug]` — in-site video lesson player
- `/studio` — Sanity Studio

## Content

The repository includes the Sanity schema and provided seed files. Seeded content is read through a server-only Sanity client; local credentials stay in `.env.local` and are not committed.
