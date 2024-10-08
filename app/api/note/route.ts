import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all notes for the authenticated user, including associated tags
    const notes = await prisma.note.findMany({
      where: {
        userId: userId,
      },
      include: {
        tags: true,  // Include associated tags with each note
      },
    });

    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Error fetching notes" }, { status: 500 });
  }
}
