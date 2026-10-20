// Liveness probe (does not touch the database, same as the legacy API).
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
