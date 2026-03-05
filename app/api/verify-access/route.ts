import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Invalid code format" },
        { status: 400 }
      );
    }

    // Query the access code from database
    const accessCode = await db.accessCode.findFirst({
      where: {
        code: code.toUpperCase(),
      },
    });

    // Check if code exists
    if (!accessCode) {
      return NextResponse.json(
        { success: false, message: "Invalid access code" },
        { status: 400 }
      );
    }

    // Check if code is already used
    if (accessCode.used) {
      return NextResponse.json(
        { success: false, message: "This code has already been used" },
        { status: 400 }
      );
    }

    // Check if code has expired
    const now = new Date();
    if (now > accessCode.expiresAt) {
      return NextResponse.json(
        { success: false, message: "This code has expired" },
        { status: 400 }
      );
    }

    // Mark code as used
    await db.accessCode.update({
      where: { id: accessCode.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Calculate remaining time until expiry
    const expiresIn = Math.floor(
      (accessCode.expiresAt.getTime() - now.getTime()) / 1000
    );

    return NextResponse.json({
      success: true,
      message: "Access code verified successfully",
      expiresIn,
    });
  } catch (error) {
    console.error("Error verifying access code:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
