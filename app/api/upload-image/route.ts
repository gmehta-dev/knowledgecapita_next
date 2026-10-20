import { handler } from '@/server/http';
import { uploadFile } from '@/server/storage';

export const POST = handler(uploadFile);
