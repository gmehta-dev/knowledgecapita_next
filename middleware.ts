import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS for /api/* - same behaviour as the legacy `cors({ origin: ALLOWED_ORIGINS, credentials: true })`.
 * The bundled frontend is same-origin and does not need it; this keeps any
 * external clients of the API working.
 */
const ALLOW_METHODS = 'GET,POST,PUT,DELETE,OPTIONS';
const ALLOW_HEADERS = 'Content-Type,Authorization';

function allowedOrigins(): string[] {
  return process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];
}

export function middleware(req: NextRequest) {
  // Legacy profile URL /profile-detail?pid=<id> -> permanent redirect to the SEO URL.
  // /profile/<id> then redirects to /profile/<name-slug>-<id>. Done here (not in the
  // page) so crawlers get a real HTTP 308 instead of a client-side redirect.
  if (req.nextUrl.pathname === '/profile-detail') {
    const pid = req.nextUrl.searchParams.get('pid');
    const url = req.nextUrl.clone();
    url.search = '';
    if (pid && /^[a-f0-9]{24}$/i.test(pid)) {
      url.pathname = `/profile/${pid.toLowerCase()}`;
      return NextResponse.redirect(url, 308);
    }
    url.pathname = '/';
    return NextResponse.redirect(url, 307);
  }

  const origin = req.headers.get('origin');
  const allowed = origin && allowedOrigins().includes(origin) ? origin : null;

  const res = req.method === 'OPTIONS'
    ? new NextResponse(null, { status: 204 })
    : NextResponse.next();

  res.headers.append('Vary', 'Origin');
  if (allowed) {
    res.headers.set('Access-Control-Allow-Origin', allowed);
    res.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    res.headers.set('Access-Control-Allow-Methods', ALLOW_METHODS);
    res.headers.set('Access-Control-Allow-Headers', ALLOW_HEADERS);
    res.headers.set('Content-Length', '0');
  }
  return res;
}

export const config = {
  // Default (edge) runtime: it streams request bodies, whereas the nodejs middleware
  // runtime buffers them with a size cap that truncates file uploads.
  matcher: ['/api/:path*', '/profile-detail']
};
