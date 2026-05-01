import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Exposes all users strictly for demonstration/dashboard purposes
export async function GET(req: Request) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        passwordHash: true,
        twoFactorSecret: true,
        isTwoFactorEnabled: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Dashboard User Fetch Error: ", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
