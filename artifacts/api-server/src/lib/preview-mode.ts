import crypto from "crypto";
import { Request } from "express";

const PREVIEW_TOKEN_SECRET = process.env.PREVIEW_TOKEN_SECRET;

export function validatePreviewMode(req: Request): boolean {
  if (!PREVIEW_TOKEN_SECRET) {
    return false;
  }

  const previewHeader = req.headers['x-preview-mode'];
  if (previewHeader !== 'trustee') return false;

  const previewToken = req.headers['x-preview-token'] as string;
  if (previewToken) {
    const expectedToken = crypto.createHmac('sha256', PREVIEW_TOKEN_SECRET)
      .update('trustee-preview')
      .digest('hex')
      .substring(0, 16);
    return previewToken === expectedToken;
  }

  return process.env.NODE_ENV !== 'production';
}
