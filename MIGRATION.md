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
