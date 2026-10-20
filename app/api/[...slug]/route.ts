// JSON 404 for unknown API routes (legacy: `{ message: 'Route not found' }`).
const notFound = () => Response.json({ message: 'Route not found' }, { status: 404 });

export const GET = notFound;
export const POST = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;
