import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, generateTwoFactorSecret, generateQRCode, encryptAES } from "@/lib/security";
import { z } from "zod";

// Secure password rules: At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const registerSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password requires at least one uppercase letter")
    .regex(/[a-z]/, "Password requires at least one lowercase letter")
    .regex(/[0-9]/, "Password requires at least one number")
    .regex(/[^A-Za-z0-9]/, "Password requires at least one special character"),
  captchaToken: z.string().min(1, "CAPTCHA is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: "Validation error", errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { username, email, password, captchaToken } = validation.data;

    // Verify Google reCAPTCHA
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"; // Fallback to Google's test key
    const captchaVerifyResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${captchaToken}`,
      { method: "POST" }
    );
    
    const captchaVerifyData = await captchaVerifyResponse.json();
    if (!captchaVerifyData.success) {
      return NextResponse.json(
        { message: "CAPTCHA verification failed. Are you a bot?" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username or email already in use" },
        { status: 409 }
      );
    }

    // Hash the password securely
    const hashedPassword = await hashPassword(password);

    // Setup 2FA configuration
    const secret = generateTwoFactorSecret(username);
    const encryptedSecret = encryptAES(secret.base32);

    // Save to Database
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        twoFactorSecret: encryptedSecret, // Save encrypted version
      }
    });

    // Generate QR Code for 2FA setup on client side
    const qrCodeUrl = await generateQRCode(secret.otpauth_url || "");

    return NextResponse.json({
      message: "User registered successfully",
      qrCodeUrl,
      secret: secret.base32,
      userId: newUser.id
    }, { status: 201 });

  } catch (error) {
    console.error("Registration Error: ", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
