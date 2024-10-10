import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching note" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { title, content, tags } = await req.json();
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if tags exist or create them
    const tagRecords = await Promise.all(
      tags.map(async (tag: string) => {
        return prisma.tag.upsert({
          where: {
            name_userId: {
              name: tag,
              userId,
            },
          },
          update: {}, // If the tag exists, do nothing
          create: { name: tag, userId },
        });
      })
    );

    const updatedNote = await prisma.note.update({
      where: { id: Number(params.id) },
      data: {
        title,
        content,
        tags: {
          connect: tagRecords.map((tag) => ({ id: tag.id })),
        },
      },
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.log(error);

    return NextResponse.json({ error: "Error updating note" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const note = await prisma.note.delete({
      where: { id: Number(params.id) },
    });

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Error deleting note" }, { status: 500 });
  }
}
