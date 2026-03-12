export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const peptides = await prisma.peptide.findMany({
      orderBy: { discoveryYear: 'asc' }
    });
    return NextResponse.json(peptides);
  } catch (error) {
    console.error('Error fetching peptides:', error);
    return NextResponse.json({ error: 'Failed to fetch peptides' }, { status: 500 });
  }
}
