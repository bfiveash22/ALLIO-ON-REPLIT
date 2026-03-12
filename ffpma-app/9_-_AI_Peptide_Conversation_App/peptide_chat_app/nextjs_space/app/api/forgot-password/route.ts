import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Find user (case-insensitive)
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase().trim(), mode: 'insensitive' } }
    });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry }
    });
    
    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://peptide-chat.abacusai.app';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    // Send email
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #06b6d4; border-bottom: 2px solid #06b6d4; padding-bottom: 10px;">
          Password Reset Request
        </h2>
        <p style="color: #333;">Hi ${user.name || 'there'},</p>
        <p style="color: #333;">You requested to reset your password for your FF Peptide Console account.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(to right, #06b6d4, #a855f7); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
            Reset Your Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">FF Peptide Intelligence Console</p>
      </div>
    `;
    
    const emailResponse = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        subject: 'Reset Your FF Peptide Console Password',
        body: htmlBody,
        is_html: true,
        recipient_email: user.email,
        sender_email: 'noreply@peptide-chat.abacusai.app',
        sender_alias: 'FF Peptide Console'
      })
    });
    
    const emailResult = await emailResponse.json();
    
    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult);
      // Don't expose email sending failure to user
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
