import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ivTherapy = await prisma.iVTherapy.findUnique({
      where: { id: params.id }
    });

    if (!ivTherapy) {
      return NextResponse.json({ error: 'IV Therapy not found' }, { status: 404 });
    }

    return NextResponse.json(ivTherapy);
  } catch (error) {
    console.error('Error fetching IV therapy:', error);
    return NextResponse.json({ error: 'Failed to fetch IV therapy' }, { status: 500 });
  }
}
