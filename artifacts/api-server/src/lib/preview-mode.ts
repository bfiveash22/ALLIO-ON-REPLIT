import crypto from "crypto";
import { Request } from "express";

const PREVIEW_TOKEN_SECRET = process.env.PREVIEW_TOKEN_SECRET;

if (!PREVIEW_TOKEN_SECRET) {
  console.warn("[SECURITY] PREVIEW_TOKEN_SECRET env var is not set — preview-mode endpoints will reject all requests in production");
}

export function validatePreviewMode(req: Request): boolean {
  const previewHeader = req.headers['x-preview-mode'];
  if (previewHeader !== 'trustee') return false;

  const previewToken = req.headers['x-preview-token'] as string;
  if (previewToken && PREVIEW_TOKEN_SECRET) {
    const expectedToken = crypto.createHmac('sha256', PREVIEW_TOKEN_SECRET)
      .update('trustee-preview')
      .digest('hex')
      .substring(0, 16);
    return previewToken === expectedToken;
  }

  return process.env.NODE_ENV !== 'production';
}
