import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const ivTherapies = await prisma.iVTherapy.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(ivTherapies);
  } catch (error) {
    console.error('Error fetching IV therapies:', error);
    return NextResponse.json({ error: 'Failed to fetch IV therapies' }, { status: 500 });
  }
}
