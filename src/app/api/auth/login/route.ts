import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/security";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { email, password, userAgent, ipAddress } = validation.data;

    const user = await prisma.user.findFirst({
      where: { email }
    });

    if (!user) {
      // Return generic error to prevent account enumeration
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Check Account Lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return NextResponse.json({ 
        message: "Account locked due to too many failed attempts. Try again later." 
      }, { status: 403 });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      let updateData: any = { failedLoginAttempts: newFailedAttempts };

      // Lockout logic: Lock for 15 minutes after 3 failed attempts
      if (newFailedAttempts >= 3) {
        updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); 
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });

      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // Reset failed attempts upon successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null
      }
    });

    // We do not issue JWT yet, we require 2FA first
    // Save login attempt
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || "unknown",
        device: "Web Browser"
      }
    });

    // Ideally, send email notification of new device login here using nodemailer
    // To keep it simple in this scope, let's assume the email function gets called here.

    return NextResponse.json({
      message: "Password verified, proceed to 2FA",
      requiresTwoFactor: true,
      userId: user.id
    }, { status: 200 });

  } catch (error) {
    console.error("Login Error: ", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
