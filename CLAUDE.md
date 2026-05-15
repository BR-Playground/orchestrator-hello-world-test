# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose of this repo

This is **not a real application** — it is a scaffold whose sole purpose is to validate the [AI Implement](https://github.com/BuildDownAI/AI-Implement) end-to-end integration (Linear ↔ GitHub ↔ AI-Implement). The "feature" being verified is that an AI agent can take a Linear issue, open a PR against this repo, and have it merge cleanly. The Next.js + shadcn application exists only so there is something concrete to modify, run, and test.

When implementing changes here, prefer **minimal, conventional** edits. Adding heavy abstractions, new dependencies, or architectural reshaping is almost always out of scope — the code is intentionally small.

## Commands

- `npm install` — install dependencies (Node.js **22+** required; see [.nvmrc](.nvmrc) — run `nvm use`)
- `npm run dev` — start the Next.js dev server (port 3000; override with `PORT=8080 npm run dev`)
- `npm run build` — production build (`next build`)
- `npm start` — serve the production build (`next start -H 0.0.0.0`); run `npm run build` first
- `npm test` — run the Vitest suite (`vitest run`)
- Run a single test file: `npx vitest run test/login-form.test.tsx`
- Run in watch mode: `npx vitest`
- Filter by test name: `npx vitest run -t 'renders login mode by default'`
- `npm run lint` — run `next lint`
- `npm run db:types` — regenerate [lib/supabase/database.types.ts](lib/supabase/database.types.ts) from the linked Supabase schema. **Run after every migration.**
- Add a new shadcn component: `npx shadcn@latest add <name>` (e.g. `button`, `card`, `dialog`) — files land in [components/ui/](components/ui/)

## Architecture

The App Router carries the entire app, organized into two route groups by access level:

- **`app/(auth)/`** — public routes for unauthenticated users (`/login`, `/forgot-password`, `/reset-password`). Shares a centered card-style layout at [app/(auth)/layout.tsx](app/(auth)/layout.tsx).
- **`app/(app)/`** — authenticated routes (`/`, `/projects/*`). Pages here read the current user via the server Supabase client and operate on RLS-protected data.
- **`app/auth/`** — *not* a route group (no parens); contains route handlers for the auth flow: [app/auth/confirm/route.ts](app/auth/confirm/route.ts) (email/recovery OTP) and [app/auth/callback/route.ts](app/auth/callback/route.ts) (OAuth code exchange).

Route groups (parenthesized folder names) do **not** affect URLs — `(auth)/login/page.tsx` is served at `/login`, not `/(auth)/login`. They exist purely to organize pages that share a layout or convention.

### Page convention: Server Component page + Client Component form

Pages that need browser interactivity (`useState`, `useSearchParams`, event handlers) follow a two-file split:

- **`page.tsx`** — Server Component. Exports `metadata` for the page title, wraps the form in a `<Suspense>` boundary (required for any page using `useSearchParams` so static prerendering doesn't bail out).
- **`form.tsx`** — Client Component (`"use client"`). Holds the actual UI, state, and search-params reads.
- **`actions.ts`** — Server Actions (`"use server"` at the top). Invoked from the form via the `action={...}` prop.

This split is mandatory for any page using `useSearchParams` — see [Next docs on the Suspense bail-out](https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout).

### Auth: three Supabase clients

Auth uses `@supabase/ssr`'s cookie-based session model. Three client factories under [lib/supabase/](lib/supabase/) — pick by execution context:

- [lib/supabase/client.ts](lib/supabase/client.ts) — `createBrowserClient`. Use in Client Components that need browser-side auth (rare; most reads happen server-side).
- [lib/supabase/server.ts](lib/supabase/server.ts) — `createServerClient` reading from `cookies()`. Use in Server Components, Server Actions, and Route Handlers.
- [lib/supabase/proxy.ts](lib/supabase/proxy.ts) — `createServerClient` reading/writing the NextRequest/NextResponse cookies in middleware. Refreshes the session on every request and gates routes via `supabase.auth.getClaims()`.

The middleware entry point is [middleware.ts](middleware.ts) at the repo root. Allowlist for unauthenticated access is in [lib/supabase/proxy.ts](lib/supabase/proxy.ts) — currently `/` (home page), `/login`, `/forgot-password`, and `/auth/*`. The home page renders different content for authenticated vs unauthenticated visitors.

**Always use `supabase.auth.getClaims()` on the server.** Never `getSession()` — its cookie storage is not cryptographically verified server-side. `getClaims()` verifies the JWT locally via cached JWKS and is documented as the preferred method.

### Auth flows that exist today

| Flow                | Pages                                    | Server Actions                            | Route handler          |
|---------------------|-------------------------------------------|--------------------------------------------|------------------------|
| Email/password login | `/login`                                  | `login` ([app/(auth)/login/actions.ts](app/(auth)/login/actions.ts)) | — |
| Email/password signup | `/login` (toggle)                         | `register`                                  | `/auth/confirm` (verifyOtp) |
| GitHub OAuth        | `/login`                                  | `signInWithGithub`                          | `/auth/callback` (exchangeCodeForSession) |
| Password reset request | `/forgot-password`                       | `resetPassword` ([app/(auth)/forgot-password/actions.ts](app/(auth)/forgot-password/actions.ts)) | `/auth/confirm` (verifyOtp, type=recovery) |
| Password reset complete | `/reset-password`                      | `updatePassword` ([app/(auth)/reset-password/actions.ts](app/(auth)/reset-password/actions.ts)) | — |
| Logout              | (Server Action button, any page)         | `logout`                                    | — |

Email templates in the Supabase dashboard must use the PKCE format (`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>&next=<path>`) — the default `{{ .ConfirmationURL }}` template doesn't pass the `token_hash` and the handler will fail.

### Domain entity: `projects`

The primary domain entity, intentionally minimal:

- **Schema**: [supabase/migrations/](supabase/migrations/) — versioned, numeric-prefixed SQL files applied to the live Supabase project via the dashboard SQL editor. The `projects` table has `name`, `description`, `status` (enum: `draft|active|archived`), `user_id` FK, and timestamps.
- **Row-Level Security**: Postgres-side per-user isolation. Every query is auto-filtered by `auth.uid() = user_id`. **App code never needs `.eq("user_id", ...)`** — RLS does it. INSERTs must include `user_id` in the payload so the `WITH CHECK` policy can verify it.
- **Types**: [lib/supabase/database.types.ts](lib/supabase/database.types.ts) is generated by `npm run db:types` (which runs `supabase gen types typescript --linked`). The `Database` generic is threaded into all three Supabase client factories. **Re-run after every migration.**
- **Reads**: [app/(app)/projects/queries.ts](app/(app)/projects/queries.ts) exports `getProject(id)` (cached per-request via React's `cache()`) and the `Project` row type. List queries live inline in the list page since they take dynamic pagination params.
- **Mutations**: [app/(app)/projects/actions.ts](app/(app)/projects/actions.ts) exports `createProject`, `updateProject`, `deleteProject` Server Actions, validated by the zod schema in [app/(app)/projects/schema.ts](app/(app)/projects/schema.ts).

#### Projects routes

| Route                              | File pattern                                                       |
|------------------------------------|--------------------------------------------------------------------|
| `/projects`                         | [app/(app)/projects/page.tsx](app/(app)/projects/page.tsx) (Server) — list view, `?page=N` pagination, 10/page |
| `/projects/new`                     | `new/page.tsx` + `new/form.tsx` — create flow (Server page + Client form) |
| `/projects/[projectId]`             | `[projectId]/page.tsx` — detail view; delete confirmation in `delete-project-button.tsx` (Client, AlertDialog) |
| `/projects/[projectId]/edit`        | `[projectId]/edit/page.tsx` + `edit/form.tsx` — edit flow         |

#### Form composition pattern (all forms across the app)

- **Native HTML `<form action={serverAction}>`** — no react-hook-form yet
- **FieldGroup / Field / FieldLabel / FieldDescription** from [components/ui/field.tsx](components/ui/field.tsx) for layout; **never** raw `<div className="space-y-*">` for form structure
- **`Input` / `Textarea`** are uncontrolled (`defaultValue` for edit, no `value` for create)
- **`Select`** is forced controlled by Radix — pair with a `<input type="hidden" name="x">` mirror so the value reaches FormData
- **Hidden `<input type="hidden" name="id">`** on edit / delete forms carries the row id to the action
- **zod validates server-side** in the action; `required` + `maxLength` on inputs provide browser-level first-line defense
- **Errors via URL search params** (`redirect("/path?error=...")` in the action; form reads via `useSearchParams()`); inline `useActionState` errors deferred to Block 4
- **Destructive confirmations use AlertDialog** with a plain submit `Button` inside the form (not `AlertDialogAction` — see [delete-project-button.tsx](app/(app)/projects/[projectId]/delete-project-button.tsx) for why)

### Layout, theming, and core files

- [app/layout.tsx](app/layout.tsx) — root HTML shell. Exports the global `metadata.title` template (`%s | Test Website`) that child pages' titles slot into.
- [app/globals.css](app/globals.css) — Tailwind directives plus shadcn theme variables (HSL CSS custom properties; `.dark` block is the dark-mode palette).
- [components/ui/](components/ui/) — shadcn components copied into the repo as source files. Edit in place; add new ones with `npx shadcn@latest add <component>`. Configuration lives in [components.json](components.json).
- [components/icons/github.tsx](components/icons/github.tsx) — inline SVG used in place of `lucide-react`'s deprecated `Github` icon (lucide is removing brand icons; see lucide-icons/lucide#2792).
- [components/theme-toggle.tsx](components/theme-toggle.tsx) — Client Component that toggles the `dark` class on `<html>` directly. Demonstrates the `"use client"` + `useState` pattern.
- [lib/utils.ts](lib/utils.ts) — the `cn()` helper (`clsx` + `tailwind-merge`) used by every shadcn component to merge Tailwind classes safely.

### Tests

Vitest + React Testing Library, configured in [vitest.config.ts](vitest.config.ts) (jsdom environment, `@/*` path alias). Setup file [test/setup.ts](test/setup.ts) registers `@testing-library/jest-dom` matchers.

- **Client form tests** (e.g. [test/login-form.test.tsx](test/login-form.test.tsx), [test/projects-create-form.test.tsx](test/projects-create-form.test.tsx)) mock `next/navigation` via `vi.hoisted` so per-test search params can be set, and stub the Server Actions module so submission is a no-op.
- **Server Component tests** (e.g. [test/page.test.tsx](test/page.test.tsx), [test/projects-list.test.tsx](test/projects-list.test.tsx)) mock the Supabase server client chain. Async Server Components are invoked directly: `render(await Page({ searchParams: Promise.resolve({...}) }))`.
- The Supabase chain mock typically only needs to mock the *terminal* method (`.range`, `.maybeSingle`, `.single`). Intermediate `.from().select().order()` calls just return `this`-shaped objects pointing at the terminal mock.
- shadcn's `Empty` component renders its title as a styled `<div>`, not an `<h*>`. Assert via `getByText`, not `getByRole("heading")`.

Pattern for new pages: tests live in [test/](test/) (flat — not nested next to the source). Don't bother trying to unit-test middleware, Route Handlers, or Server Actions directly without an integration-test setup; cover them via the manual verification steps in each block's plan.

### Deployment (Fly.io)

- [fly.toml](fly.toml) — Fly app config. `[env]` block holds the two `NEXT_PUBLIC_SUPABASE_*` values (same across all environments).
- [Dockerfile](Dockerfile) + [docker-entrypoint.js](docker-entrypoint.js) — built by `@flydotio/dockerfile`. Default mode does a single `next build` at image-build time. The compile/generate split (for runtime-env-var apps) is preserved as commented placeholders in all three files.
- `SITE_URL` is a per-app **Fly secret**, not in `fly.toml [env]`, because each preview deploy needs a different value pointing at its own URL.

Two GitHub Actions workflows orchestrate deploys:

- [.github/workflows/fly-deploy.yml](.github/workflows/fly-deploy.yml) — production deploy on push to `main`. Uses `FLY_API_TOKEN` (deploy-scoped to the production app).
- [.github/workflows/fly-preview.yml](.github/workflows/fly-preview.yml) — per-PR preview deploys. Creates `orchestrator-hello-world-test-pr-<N>` on PR open, deploys on each push, destroys on PR close. Uses `FLY_API_TOKEN_PREVIEW` (org-scoped, can create apps) and `vars.FLY_ORG` (the Fly organization slug).

When adding a route: create `app/<group>/<route>/page.tsx`. For an HTTP API endpoint, create `app/api/<route>/route.ts` and export named `GET`/`POST`/etc. functions.

## Key conventions

- **TypeScript everywhere** — `.tsx` for components, `.ts` for non-JSX modules. shadcn assumes TS.
- **Path alias `@/*`** maps to the repo root (configured in both [tsconfig.json](tsconfig.json) and [vitest.config.ts](vitest.config.ts)). Prefer `@/components/ui/button` over relative paths.
- **Styling is Tailwind-only** — no CSS modules, no `style={...}` unless dynamic. Compose utility classes; reach for `cn()` when conditionally combining them.
- **Server Components by default; `"use client"` only at the leaves** that need interactivity. Pages stay Server Components so they can export `metadata`.
- **Mutations go through Server Actions**, not API routes. Forms wire `action={someServerAction}`; reading the form uses `formData.get("fieldName")`.
- **`useSearchParams` requires a `<Suspense>` boundary** in any page that uses it, or `next build` will fail.
- **No new dependencies without a clear reason** — the scaffold is deliberately small.

## Required environment variables

Local development (`.env.local`, not committed):
```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<sb_publishable_...>
SITE_URL=http://localhost:3000
```

Production (Fly app secrets, set via `flyctl secrets set --app <app-name> SITE_URL=...`). The two `NEXT_PUBLIC_SUPABASE_*` values come from `fly.toml [env]` and are inherited automatically by preview apps too.

## AI-Implement template files (do not treat as project docs)

[PLANNING.md](PLANNING.md) and [WORKFLOW.md](WORKFLOW.md) are **prompt templates** seeded by the ai-implement sync workflow. They are rendered (front matter stripped, `${VARS}` substituted) and sent to a separate Claude instance during planning/implementation runs. They are *not* documentation of this repo's architecture, though their "Repo context" sections are kept in sync with the real stack so that AI runs get accurate guidance.

The workflows in [.github/workflows/](.github/workflows/) named `claude-plan.yml`, `claude-implement.yml`, and `comment-trigger.yml` are managed by the ai-implement sync workflow — do not edit them directly; changes will be overwritten on the next sync. The `fly-deploy.yml` and `fly-preview.yml` workflows in the same directory are *not* sync-managed and are safe to edit.
