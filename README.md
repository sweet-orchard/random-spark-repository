# Spin Picker

Spin Picker is a Next.js app for quickly deciding what to work on next.
It combines a task list, animated spin reel, history tracking, and account-based task storage with Supabase.

## What the app does

- Lets users sign up and log in with email/password.
- Stores tasks per user in Supabase.
- Organizes work into folders and spin lists.
- Spins a reel to randomly pick one task.
- Tracks recent picks in a per-list history panel.
- Supports task editing, deletion, and quick list management.

## Tech stack

- Next.js (App Router)
- React + TypeScript
- Supabase Auth + Database
- Framer Motion (animations)
- canvas-confetti (winner celebration)
- lucide-react (icons)

## Project structure

- `app/page.tsx`: Main spin experience (dashboard, folders, lists, reel, history).
- `app/login/page.tsx`: Login screen.
- `app/signup/page.tsx`: Sign-up screen.
- `lib/supabaseClient.ts`: Supabase client setup from env vars.

## Prerequisites

- Node.js 20+ recommended
- npm (or pnpm/yarn)
- A Supabase project

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start development server:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Supabase notes

The app expects:
- `tasks` table (task rows per user)
- `spins` table (legacy spin metadata per user)
- `user_state` table (full UI state sync: folders, spins, history, active selections, recents)

Run the SQL in [supabase/user_state.sql](/Users/virasaienko/Documents/CODE DRAFTS/spinning choice/spin-picker/supabase/user_state.sql) to create `user_state` with RLS.

For `tasks`, each row should include:
At minimum, each row should include:

- `id` (uuid)
- `title` (text)
- `description` (text, nullable)
- `created_at` (timestamp)
- `user_id` (uuid)

The UI queries tasks with:

- `select * from tasks where user_id = <current user>`
- insert, update, and delete operations scoped to `user_id`

If you use RLS, add policies so authenticated users can only access their own rows.

## Scripts

- `npm run dev`: start local dev server
- `npm run build`: production build
- `npm run start`: run production server
- `npm run lint`: run ESLint

## Build and deploy

1. Build locally:

```bash
npm run build
```

2. Deploy to Vercel or any Next.js-compatible host.
3. Add the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars in your deployment environment.

## Deploy to GitHub Pages

This repo is configured to deploy automatically from `main` using GitHub Actions and static export.

1. In GitHub, open repository settings and enable Pages:
	- Source: `GitHub Actions`
2. Add repository secrets:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Push to `main`.
4. Wait for the `Deploy Next.js static site to GitHub Pages` workflow to complete.

Your app will be available at:

```text
https://sweet-orchard.github.io/random-spark-repository/
```

Notes:

- `next.config.ts` is configured with static export (`output: "export"`) and GitHub Pages base path support.
- The workflow sets `NEXT_PUBLIC_BASE_PATH` automatically to the repository name.
- If the repository name changes, the deployment URL path changes too.

## App summary

Spin Picker is a focused productivity tool: collect tasks, group them into spin lists, and let a clean animated picker choose what you do next.
It is useful for reducing decision fatigue and keeping momentum when you have too many options.
