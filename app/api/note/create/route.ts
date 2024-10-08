import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) { 
  const { title, content, tags, recording } = await req.json();
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if tags exist or create them
    const tagRecords = await Promise.all(tags.map(async (tag: string) => {
      return prisma.tag.upsert({
        where: { 
          name_userId: {
            name: tag, 
            userId 
          } 
        },
        update: {},  // If the tag exists, do nothing
        create: { name: tag, userId }
      });
    }));

    // Create the note with associated tags
    const note = await prisma.note.create({
      data: {
        title,
        content,
        recording,
        userId,
        tags: {
          connect: tagRecords.map(tag => ({ id: tag.id }))
        }
      },
      include: {
        tags: true  // Return the note with its tags
      }
    });

    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ error: 'Error creating note' }, { status: 500 });
  }
}
