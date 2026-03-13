export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const peptide = await prisma.peptide.findUnique({
      where: { id: params.id }
    });
    if (!peptide) {
      return NextResponse.json({ error: 'Peptide not found' }, { status: 404 });
    }
    return NextResponse.json(peptide);
  } catch (error) {
    console.error('Error fetching peptide:', error);
    return NextResponse.json({ error: 'Failed to fetch peptide' }, { status: 500 });
  }
}
