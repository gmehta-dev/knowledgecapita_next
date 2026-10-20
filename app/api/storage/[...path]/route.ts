import type { NextRequest } from 'next/server';
import { serveStoredFile } from '@/server/storage';

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return serveStoredFile(req, (await params).path);
}

export async function HEAD(req: NextRequest, { params }: Ctx) {
  return serveStoredFile(req, (await params).path, true);
}
