import 'server-only';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { Readable } from 'stream';
import type { NextRequest } from 'next/server';
import { ApiError } from './errors';
import { json } from './http';
import { requireUser } from './auth';

/** Root of uploaded files. Point this at the legacy API's `src/storage` folder in production. */
export function storageRoot(): string {
  return path.resolve(process.env.STORAGE_PATH || 'storage');
}

const UPLOAD_TYPES = ['profile', 'bioFile'] as const;
type UploadType = (typeof UPLOAD_TYPES)[number];

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // multer `limits.fileSize`
const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 512 * 1024; // bound memory before parsing multipart

/** Same checks as the legacy multer `fileFilter`. */
function checkFileType(type: UploadType, file: File): void {
  const ext = path.extname(file.name).toLowerCase();
  if (type === 'profile') {
    const allowed = /jpeg|jpg|png/;
    if (!(allowed.test(ext) && allowed.test(file.type))) {
      throw new ApiError(400, 'Profile image must be JPG, PNG, or JPEG');
    }
  } else {
    const allowedExt = /pdf|doc|docx/;
    const allowedMime = /pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document/;
    if (!(allowedExt.test(ext) && allowedMime.test(file.type))) {
      throw new ApiError(400, 'Bio file must be PDF, DOC, or DOCX');
    }
  }
}

// POST /upload-image  (multipart: type=profile|bioFile, file=<binary>)
export async function uploadFile(req: NextRequest) {
  await requireUser(req);

  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    throw new ApiError(400, 'File too large');
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, 'No file uploaded');
  }

  const type = form.get('type');
  const fileEntry = form.get('file');
  const file = fileEntry instanceof File ? fileEntry : null;

  if (file) {
    if (type !== 'profile' && type !== 'bioFile') {
      throw new ApiError(400, 'Invalid file type parameter');
    }
    checkFileType(type, file);
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ApiError(400, 'File too large');
    }
  }

  if (!file) {
    throw new ApiError(400, 'No file uploaded');
  }

  // Validate file size per type
  if (type === 'profile' && file.size > 2 * 1024 * 1024) {
    throw new ApiError(400, 'Profile image must be less than 2MB');
  }
  if (type === 'bioFile' && file.size > 5 * 1024 * 1024) {
    throw new ApiError(400, 'Bio file must be less than 5MB');
  }

  // Same naming scheme as multer config: `${Date.now()}_${originalname}` (basename only)
  const originalName = path.basename(file.name).replace(/[\u0000-\u001f/\\]/g, '');
  const filename = `${Date.now()}_${originalName}`;
  const dir = path.join(storageRoot(), type as UploadType);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return json({
    image: `${type}/${filename}`,
    message: 'File uploaded successfully'
  });
}

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

const notFound = () => json({ message: 'Route not found' }, 404);

/** Replacement for `express.static('storage')`, limited to the upload folders. */
export async function serveStoredFile(req: NextRequest, segments: string[], headOnly = false) {
  // Uploads return `profile/<file>` and the frontend stores that value, but builds
  // URLs as `<media>/profile/` + value, so newer records resolve to
  // `profile/profile/<file>`. Accept the doubled prefix so they display.
  if (segments.length > 2 && segments[0] === segments[1]) segments = segments.slice(1);

  if (segments.length < 2 || !(UPLOAD_TYPES as readonly string[]).includes(segments[0])) return notFound();
  if (segments.some((s) => !s || s.startsWith('.') || s.includes('/') || s.includes('\\') || s.includes('\0'))) {
    return notFound();
  }

  const root = path.join(storageRoot(), segments[0]);
  const filePath = path.resolve(root, ...segments.slice(1));
  if (!filePath.startsWith(root + path.sep)) return notFound();

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    return notFound();
  }
  if (!stat.isFile()) return notFound();

  const lastModified = stat.mtime.toUTCString();
  const etag = `W/"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`;
  const headers = new Headers({
    'Content-Type': CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Content-Length': String(stat.size),
    'Last-Modified': lastModified,
    ETag: etag,
    'Cache-Control': 'public, max-age=0',
    'X-Content-Type-Options': 'nosniff'
  });

  const ifNoneMatch = req.headers.get('if-none-match');
  const ifModifiedSince = req.headers.get('if-modified-since');
  if (ifNoneMatch === etag || (!ifNoneMatch && ifModifiedSince && new Date(ifModifiedSince) >= new Date(lastModified))) {
    return new Response(null, { status: 304, headers });
  }

  if (headOnly) return new Response(null, { status: 200, headers });

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, { status: 200, headers });
}
