import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from "@clerk/nextjs/server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { title, content, tags, recording } = await req.json();
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updatedNote = await prisma.note.update({
      where: { id: Number(params.id) },
      data: {
        title,
        content,
        tags,
        recording,
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    return NextResponse.json({ error: 'Error updating note' }, { status: 500 });
  }
}
