import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyTwoFactorToken, generateToken, decryptAES } from "@/lib/security";
import { z } from "zod";

const twoFactorSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().optional(), 
  secretKey: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = twoFactorSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { userId, code, secretKey } = validation.data;

    if (!code && !secretKey) {
      return NextResponse.json({ message: "Must provide either 2FA code or Backup Secret Key" }, { status: 400 });
    }

    // Find User
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ message: "User or 2FA not configured" }, { status: 400 });
    }

    // Decrypt the AES-256 encrypted stored secret backup securely from RAM
    const rawSecret = decryptAES(user.twoFactorSecret);

    // Verify code OR Secret Backup
    let isVerified = false;
    
    if (code) {
      isVerified = verifyTwoFactorToken(rawSecret, code);
    } else if (secretKey) {
      // Validate user input raw secret against the decrypted server secret
      isVerified = (rawSecret === secretKey);
    }

    if (!isVerified) {
      return NextResponse.json({ message: "Invalid Two-Factor auth code or secret key" }, { status: 401 });
    }

    // Generate JWT token finally
    const token = generateToken(user.id);

    return NextResponse.json({
      message: "Login successful",
      token
    }, { status: 200 });

  } catch (error) {
    console.error("2FA Final Auth Error: ", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
