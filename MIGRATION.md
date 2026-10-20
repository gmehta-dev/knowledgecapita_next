# Migration notes: CRA + Express → Next.js

## Architecture

| Before | After |
|---|---|
| `sharecomReactJs` (CRA, React 18, react-router) served by Apache | `app/(site)/*` pages, Client Components, served by Next.js |
| `knowledgeCapita-API` (Express) behind proxy at `/api/*` | `app/api/*` Route Handlers, same process |
| `express.static('src/storage')` at `/api/storage/*` | `app/api/storage/[...path]` streaming from `STORAGE_PATH` |
| `cors()` middleware | `middleware.ts` (same allowed origins / headers) |
| multer disk upload | `server/storage.ts` (`request.formData()`, same checks + naming) |

Nothing had to remain a separate service. **No database schema or data changes.**
Models are copied verbatim; `autoIndex` is off by default so the app never builds
indexes on the production database.

## API compatibility

Every endpoint keeps its URL, method, status codes and response body:

`POST /api/auth/{sign-up,sign-in,pass-reset,pass-change}`, `GET /api/auth/sign-out`,
`GET|POST /api/user/profile`, `POST /api/upload-image`, `GET /api/dashboard`,
`GET /api/dashboard/:pid`, `GET|POST /api/calender`, `GET|POST /api/activities`,
`PUT|DELETE /api/activities/:id`, `POST /api/contact`, `GET /api/health`,
`GET /api/storage/{profile,bioFile}/:file`, and the JSON 404 for unknown routes.

JWTs are signed/verified the same way, so with the same `JWT_SECRET` **existing
logins remain valid** across the cutover. The browser keeps using the same
storage key (`__ad_shareCo__`).

Verified by `tests/contract/api.contract.test.mjs` (54 tests): passes against the
legacy Express API **and** the Next.js app (dev and production build).

### Intentional differences (error paths only)

| Case | Express | Next.js |
|---|---|---|
| Upload with wrong file type or invalid `type` field | 500 `Internal server error` | 400 with the specific message |
| Malformed JSON body | 500 `Internal server error` | 400 `Invalid JSON body` |
| Wrong HTTP method on an existing route (e.g. `GET /api/auth/sign-in`) | 404 `Route not found` | 405 (empty body) |
| Oversized profile image | file written to disk, then 400 | 400, nothing written |
| Query params like `?industry[$ne]=x` | parsed into an object by Express `qs` (NoSQL operator injection) | always plain strings |
| Uploaded filename | multer `originalname` | basename with control chars / slashes stripped |

## Frontend changes

- Pages copied from `src/pages` to `views/` with only mechanical edits:
  react-router → `next/link` / `next/navigation`, `useOutletContext` → `useLayoutContext`
  (`lib/layout-context.tsx`), `useNavigate` shim in `lib/navigation.ts`.
- `MainLayout` → `components/SiteShell.tsx`. Pages render after mount in the
  browser (as in CRA) because auth lives in localStorage.
- **Profile detail URL**: now `/profile-detail?pid=<id>` instead of router state,
  so the page can be refreshed/shared. `/profile-detail` without `pid` still
  redirects home.
- `react-quill` → `react-quill-new` (same API; `react-quill` does not work on
  React 19, which the App Router requires). Loaded client-side only.
- `react-toastify` 9 → 11 (v9 crashes on React 19 when a toast is shown; same `toast.*` API, CSS now injected automatically).
- `lib/Auth.ts` guarded for server rendering; behaviour unchanged.
- `public/content.json` / `authData.json` are still fetched at runtime, so they
  can be edited on the server without rebuilding.
- Inter font: moved from a mid-file SCSS `@import url()` to a `<link>` in `app/layout.tsx`.
- Page titles also set through Next metadata.

## Environment variables

| Legacy | Next.js | Notes |
|---|---|---|
| API `MONGODB_URI` | `MONGODB_URI` | same value as production API |
| API `JWT_SECRET` | `JWT_SECRET` | **must be identical** |
| API `JWT_EXPIRES_IN` | `JWT_EXPIRES_IN` | |
| API `ALLOWED_ORIGINS` | `ALLOWED_ORIGINS` | read at runtime |
| API `STORAGE_PATH` (unused by code; path was hardcoded) | `STORAGE_PATH` | absolute path to the folder containing `profile/` and `bioFile/` |
| API `PORT` | `PORT` | standalone server port |
| API `MEDIA_BASE_URL`, `SMTP_*`, `NODE_ENV` | – | unused by the legacy code |
| CRA `REACT_APP_API_URL` | `NEXT_PUBLIC_API_URL` | optional, default `/api/` |
| CRA `REACT_APP_MEDIA_API_URL` | `NEXT_PUBLIC_MEDIA_API_URL` | optional, default `/api/storage` |
| CRA `REACT_APP_LOGOUT_REDIRECT_URL` | `NEXT_PUBLIC_LOGOUT_REDIRECT_URL` | optional, default `/` |
| – | `MONGODB_AUTO_INDEX`, `MONGODB_MAX_POOL_SIZE` | new, optional |

Only `NEXT_PUBLIC_*` values reach the browser; none of them are secrets.

## Known issues carried over unchanged (decide separately)

These exist in the live app today and were deliberately **not** changed:

1. `GET /api/dashboard` is public and returns every visible profile; the
   "PhD Scholar only" restriction for non-admins is enforced only in the browser.
2. `GET /api/dashboard/:pid` always returns `email`; `name_visibility` is never applied.
3. `searching` is passed to MongoDB `$regex` unescaped (slow-query / regex injection).
4. `POST /api/auth/pass-reset` does not send an email (TODO in legacy code).
5. "Remember me" off → session stored in sessionStorage, which is lost after a reload.
6. Admin emails are duplicated in `public/authData.json` and `server/constants.ts`
   (the server copy is the one enforced).

## Testing

```bash
# Clone the LOCAL database into sharecom_contract_test (refuses non-localhost / non-*_test targets)
SOURCE_URI=mongodb://localhost:27017/sharecom npm run test:db

# Start the app against the test DB, then:
API_BASE=http://localhost:3000/api npm run test:contract
# Same suite against legacy Express (no /api prefix):
API_BASE=http://localhost:4101 npm run test:contract
```

Run `npm run test:db` before each run; the suite creates users/entries.

## New feature: super admin (user management)

Only users with `role: "super_admin"` can manage users. Regular users and the
activities admins (`AUTHORIZED_EMAILS`) get **403**.

| Endpoint | Purpose |
|---|---|
| `GET /api/admin/users?page=&size=&searching=` | All users, including hidden profiles, with email/phone/role. Search matches name, email or phone (literal, not regex). `size` ≤ 100. |
| `GET /api/admin/users/:id` | Full user (no password) |
| `PUT /api/admin/users/:id` | Update any subset of: name, email, phone_number, password (reset), role, designation, industry, area_of_specialization, bios, scheduling_assistance, profile_image, `*_visibility`. Duplicate email/phone → 400 like sign-up. |
| `DELETE /api/admin/users/:id` | Deletes the user **and their calendar entries**. Uploaded files and activities they created are kept. |

UI: **Admin** link in the header (super admins only) → `/admin/users`
(search, pagination, edit dialog, delete). The edit dialog sends only changed
fields, so legacy values that are no longer in the dropdown lists are not re-validated.

Safety rules:
- Nobody can make themselves super admin: `role` is rejected by sign-up and profile update (422).
- A super admin cannot delete themselves or remove their own role, so there is always at least one.
- The role is re-read from the database on every request, so a demotion takes effect immediately.
- Every update and delete is logged: `[admin] user <id> updated by <email>: <fields>` / `... deleted by ...`.

### Database impact

One **optional** field, `role` (`"user"` | `"super_admin"`), on `users`. Existing
documents are not touched: a missing value is treated as `"user"`. The legacy
Express API ignores the field and keeps working on the same database (verified:
the full contract suite passes against Express with `role` present).

### Creating the first super admin

There is no UI or API for this on purpose. On the server:

```bash
MONGODB_URI='<production uri>' node scripts/make-super-admin.mjs someone@example.com
# shows database, user and role change, then asks "Apply this change? (yes/no)"
MONGODB_URI='<production uri>' node scripts/make-super-admin.mjs someone@example.com --revoke
```

It changes exactly one field on one user. The user must log out and back in
to see the Admin menu.

### Tests

`npm run test:admin` (20 tests, Next.js only): role checks, 401/403 for
anonymous/users/activities admins, list/search/pagination, update (incl. email
change, password reset, promote/demote), self-protection, delete with calendar
cleanup.

## SEO-friendly URLs

| Before | After |
|---|---|
| `/profile-detail?pid=<id>` (client-rendered, empty HTML for crawlers) | `/profile/<name-slug>-<id>` server-rendered |
| static `public/sitemap.xml` (2024, listed private pages) | `app/sitemap.ts`: home, about, contact + every visible profile, live from the DB |
| `robots.txt` allowing everything | `app/robots.ts`: blocks `/api/` (except profile photos), `/admin/`, `/myaccount`, `/register`, `/calender`; links the sitemap |

- **Redirects:** `/profile-detail?pid=<id>` → 308 → `/profile/<id>` → 308 → `/profile/<name>-<id>`
  (done in `middleware.ts` so crawlers get real HTTP redirects). Outdated slugs (renamed users)
  also 308 to the current one. Old links, bookmarks and indexed URLs keep working.
- **Profile pages** render on the server with the same visibility rules as `GET /api/dashboard/:pid`
  (shared `server/profiles.ts`), plus title, meta description (from role and brief bio),
  canonical URL, Open Graph/Twitter tags with the profile photo, and schema.org `Person` JSON-LD.
- Hidden profiles (`profile_visibility: 0`) are reachable by link as before but marked `noindex`
  and left out of the sitemap. The email is not included in the server HTML.
- Directory "View Profile" is now a real link (crawlable, opens in a new tab with middle-click).
- `SITE_URL` (server env, default `https://knowledgecapita.com`) is used for canonical/sitemap URLs.
- Tests: `npm run test:seo` (11).

## Live bugs fixed during pre-deploy testing

Both exist on the current production site; fixed here, with tests:

1. **Profile save rejected for 20 dropdown options.** The UI offers labels such as
   "Chief Executive Officer (CEO)", "BFSI, Investment & Trading", "Environment, Health & Safety";
   the API only accepted "CEO", "BFSI Investment & Trading", … → "Invalid designation".
   Existing users already hold these values. Fix: the API accepts both forms (additive).
2. **Newly uploaded photos/CVs show as broken.** Upload returns `profile/<file>`, the UI stores it
   and then builds `/storage/profile/` + value → `/storage/profile/profile/<file>` (404). Fix: storage
   route accepts the doubled prefix, so existing production records display without a data change.

Also: Next.js 15.5.4 → 15.5.28 (critical/high security advisories), `react-toastify` 9 → 11
(v9 crashed the page on React 19 whenever a toast was shown).

Remaining known quirks (unchanged from the live site): any 401, including a wrong password on
login, reloads to the home page after 1 second; an invalid `?pid` shows an empty profile shell
(now: 404 page). Quill 2.0.3 has a low-severity advisory in `getSemanticHTML`, which the editors
no longer call (`useSemanticHTML={false}`, same HTML as the legacy editor).
