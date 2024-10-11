import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from "@clerk/nextjs/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { isPinned } = await req.json();
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const note = await prisma.note.findUnique({
      where: { id: params.id },
      select: { userId: true }
    });

    if (!note || note.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedNote = await prisma.note.update({
      where: { id: params.id },
      data: { isPinned },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating pin status' }, { status: 500 });
  }
}
