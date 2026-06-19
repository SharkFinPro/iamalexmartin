# AGENTS.md

Onboarding + decision-making reference for AI agents working in this repo. Keep it concise; link out rather than duplicating. See [README.md](README.md) for human build instructions.

## What this is

`iamalexmartin` is Alex Martin's personal portfolio: a **Next.js 16 (App Router) + React 19 + TypeScript** site, styled with **SCSS modules**, content sourced from **Hygraph (GraphCMS)**, deployed on **Vercel**. There is **no database** — all content lives in Hygraph; presentation config lives in a single Hygraph JSON entry.

The site has a lightweight, **database-free admin editor**: log in with an env-var key, then edit most content *inline on the page it lives on* (no separate CMS UI for routine edits).

## Architecture at a glance

- **Rendering**: Server Components by default; CMS pages set `export const dynamic = "force-dynamic"` (fresh per request, no caching to invalidate). Interactive bits are small `"use client"` islands.
- **Data flow**: pages `POST` GraphQL to `process.env.CMS_ENDPOINT` (public read). Writes go through Server Actions using a secret mutation token — never the client.
- **Admin mode**: a single signed, httpOnly cookie. Each server page reads it via `isAuthed()` and threads an `isAdmin` boolean into its client islands; when true, inline edit controls render. Visitors see zero change.
- **The real authorization boundary is the Server Action**, not the UI or middleware — every write re-verifies the session before mutating.

## Key directories & modules

- `src/app/` — routes (App Router). `(index)/` home, `projects/`, `projects/[slug]/`, `about/`, `contact/`, `admin/`.
- `src/app/admin/` — login/logout (`actions.ts`), the write Server Actions (`contentActions.ts`), a minimal dashboard (`page.tsx`, `DashboardControls.tsx`) for site-wide toggles, and a **Media Library** (`media/`) listing all Hygraph assets (any type, draft + published) with per-asset publish/rename and a **crop-and-upload** flow (`MediaUploader.tsx`, using `react-advanced-cropper`: a 2:1 preset matching how project images render, plus an always-available free-form mode). Uploads land as DRAFT; the admin publishes them with the existing button.
- `src/lib/` — core, framework-light logic:
  - `cms.ts` — `cmsQuery` (public read) / `cmsQueryAuthed` (token read, needed for DRAFT-stage content) / `cmsMutate` (authenticated write). Honors optional `CMS_MUTATION_ENDPOINT`.
  - `getAssets.ts` — Media Library data layer; reads all assets at DRAFT stage and derives `status` ("published"/"draft") from `documentInStages`.
  - `session.ts` — pure Web-Crypto HMAC session sign/verify + `checkAdminKey` (Edge-safe; no `next/headers`).
  - `auth.ts` — cookie-store helpers (`setSession`/`clearSession`/`isAuthed`); imports `next/headers`, server-only.
  - `siteConfig.ts` — pure config types/helpers (ordering, flags, featured). Safe to import in client code.
  - `getSiteConfig.ts` — reads the `siteConfig` singleton (kept separate so `siteConfig.ts` stays import-safe for clients).
- `src/components/` — shared UI. Notably `EditableText/` (generic inline field editor) and `useDragReorder.ts` (pointer-drag reorder hook used by both the projects grid and featured section).
- `src/proxy.ts` — Next 16 proxy (formerly `middleware`) guarding `/admin` only.

## Content model (Hygraph)

Editable models and the fields the admin may write are whitelisted in `EDITABLE_FIELDS` in `src/app/admin/contentActions.ts`: `Project`, `Description` (keyed by `location`), `PortfolioCard`. Rich-text, images, and relations are intentionally **not** inline-editable.

Presentation state lives in one **`SiteConfig`** entry (a single JSON `data` field), shaped by `SiteConfigData` in `siteConfig.ts`: `projectOrder`, `featuredOrder`, per-project `{ visible, featured }` flags, and `homepage` toggles. Defaults are applied so the site works before any config is saved.

## Conventions & patterns

- **Inline editing**: wrap a CMS text value in `<EditableText model="<Model>" id={entry.id} field="<field>" value={...} editable={isAdmin}>{...}</EditableText>`. Any query feeding an editable field must also fetch the entry `id`. `Banner` takes an optional `edit` prop to make its title/description editable. `EditableText` also accepts an optional `action` prop to override the default `updateContentField` write — used by the Media Library to rename assets stage-aware (it keeps a draft a draft instead of auto-publishing). Asset renaming writes a custom **`title`** field on the Asset model (Hygraph won't edit `fileName` in place); the UI falls back to the filename minus extension when `title` is empty.
- **Writes are optimistic**: actions do **not** call `revalidatePath` — the read CDN lags briefly after a write, and a refetch would clobber the optimistic UI. Client components hold local state and show the saved value immediately. Don't reintroduce revalidation here without accounting for that.
- **Styling**: SCSS modules + CSS custom properties from `src/styles/_themes.scss` (light/dark via `data-theme`); SCSS color literals in `src/styles/variables.scss`. Match surrounding files.
- **Edge constraint**: `proxy.ts` and anything it imports must use Web Crypto only (no Node `crypto`, no `next/headers`) — that's why session crypto lives in `session.ts`, separate from `auth.ts`.

## Common commands

- `npm run dev` — dev server (port 80).
- `npm run build` / `npm start` — production build / serve.
- Typecheck: `npx tsc --noEmit --ignoreDeprecations 6.0` (the flag silences a pre-existing `baseUrl` deprecation; `next lint` is deprecated in Next 16).

## Environment / deployment

Server-only env vars (`.env.local` + Vercel): `CMS_ENDPOINT`, `ADMIN_KEY`, `HYGRAPH_MUTATION_TOKEN`, optional `CMS_MUTATION_ENDPOINT`, plus `CONTACT_EMAIL`/`EMAIL_KEY` (Mailgun, used by `contact/sendMessage.ts`). Deployed on Vercel.

## Cautions / non-obvious behavior

- **Hygraph permissions**: the mutation token needs **Update (Draft) + Publish** on every editable model (`SiteConfig`, `Project`, `Description`, `PortfolioCard`), plus **Create + Read (Draft) + Update (Draft) + Publish + Unpublish** on `Asset` for the Media Library (upload, display, rename via the custom `title` field, and publish/unpublish). Uploads use Hygraph's direct-upload flow — `createAsset` returns a pre-signed S3 POST, then the binary is uploaded to storage (`cmsUpload` in `cms.ts`; the legacy `<host>/upload` endpoint is disabled on this project). The cropped image is exported client-side from a `<canvas>` and sent through the `uploadAsset` Server Action. A "Mutation failed due to permission errors" message means the token scope is missing, not a code bug.
- **Mutation endpoint**: if `CMS_ENDPOINT` is the read CDN (`*.cdn.hygraph.com`), writes may be rejected — set `CMS_MUTATION_ENDPOINT` to the regular Content API host.
- **Gradient/heading text + EditableText**: gradient titles use `-webkit-text-fill-color: transparent`. `EditableText`'s wrapper is `display: contents` (so it doesn't break the clip) and resets fill color on the input; headings pass `floatEdit` so the pencil doesn't wrap a line. Be careful changing these.
- **Hidden projects**: filtered for visitors in list/detail/sitemap but visible (dimmed) to admins; detail pages `notFound()` for non-admins.
- **Drag reorder** uses pointer events with a floating clone + edge auto-scroll (`useDragReorder.ts`); the dragged card's entrance animation must be cancelled (`animation: none; opacity: 1`) on the floating clone or it overrides the tilt/visibility.

## Extending the project

- **New inline-editable field**: add the field to the model's entry in `EDITABLE_FIELDS`, fetch the entry `id` in the query, wrap the value in `EditableText`.
- **New site-wide toggle / config**: extend `SiteConfigData` (+ `DEFAULT_CONFIG`/`normalizeConfig`), read it where needed, and add a control in `DashboardControls.tsx` or inline.
- **New reorderable list**: reuse `useDragReorder` and persist via `saveConfig` with a new order array.

## Maintaining this document

Update `AGENTS.md` when a change affects how an agent should reason about the project — not for routine content/styling tweaks. Triggers:

- Architecture or rendering-strategy changes (e.g. caching/ISR, new runtime constraints).
- New subsystems, routes, or shared modules in `src/lib` / `src/components`.
- Changes to the auth/admin model, the Server-Action write boundary, or the optimistic-update approach.
- New or changed editable models/fields or `SiteConfig` shape.
- New env vars, deployment target, or CMS/provider changes.
- New conventions, or commands/tooling changes (build, typecheck, lint).

Keep it concise and link to source files rather than duplicating implementation detail.
