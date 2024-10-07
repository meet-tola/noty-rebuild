import { NextResponse } from "next/server";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/app/lib/db";

// POST handler
export async function POST(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await clerkClient().users.getUser(userId);

    const { id, emailAddresses, fullName, imageUrl } = clerkUser;
    const email = emailAddresses[0]?.emailAddress;

    const existingUser = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id,
          email,
          fullName,
        },
      });
    }

    return NextResponse.json(
      { message: "User handled successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET handler
export async function GET(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await clerkClient().users.getUser(userId);

    return NextResponse.json({ user: clerkUser }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
