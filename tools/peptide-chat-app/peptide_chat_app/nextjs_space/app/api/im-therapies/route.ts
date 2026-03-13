import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const imTherapies = await prisma.iMTherapy.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(imTherapies);
  } catch (error) {
    console.error('Error fetching IM therapies:', error);
    return NextResponse.json({ error: 'Failed to fetch IM therapies' }, { status: 500 });
  }
}
