import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const tags = await prisma.tag.findMany({
      where: { userId },
      select: { name: true },
    });

    return NextResponse.json(tags);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching tags' }, { status: 500 });
  }
}
