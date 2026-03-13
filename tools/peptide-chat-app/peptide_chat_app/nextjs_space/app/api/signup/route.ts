export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    
    // Case-insensitive check for existing user
    const existing = await prisma.user.findFirst({ 
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } } 
    });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: hashed, name: name || '' }
    });
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}
