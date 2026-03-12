import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imTherapy = await prisma.iMTherapy.findUnique({
      where: { id: params.id }
    });

    if (!imTherapy) {
      return NextResponse.json({ error: 'IM Therapy not found' }, { status: 404 });
    }

    return NextResponse.json(imTherapy);
  } catch (error) {
    console.error('Error fetching IM therapy:', error);
    return NextResponse.json({ error: 'Failed to fetch IM therapy' }, { status: 500 });
  }
}
