import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const note = await prisma.note.findUnique({
      where: { id: Number(params.id) },
      include: {
        tags: true,  
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching note' }, { status: 500 });
  }
}

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const note = await prisma.note.delete({
      where: { id: Number(params.id) },
    });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting note' }, { status: 500 });
  }
}
