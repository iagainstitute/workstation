import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/mongodb";
import { Collections } from "@/lib/collections";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Invalid code format" },
        { status: 400 }
      );
    }

    const accessCodesCol = await getCollection(Collections.ACCESS_CODES);

    const accessCode = await accessCodesCol.findOne({
      code: code.toUpperCase().trim(),
    });

    if (!accessCode) {
      return NextResponse.json(
        { success: false, message: "Invalid access code" },
        { status: 400 }
      );
    }

    if (accessCode.used) {
      return NextResponse.json(
        { success: false, message: "This code has already been used" },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(accessCode.expires_at || accessCode.expiresAt);
    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, message: "This code has expired" },
        { status: 400 }
      );
    }

    await accessCodesCol.updateOne(
      { _id: accessCode._id },
      {
        $set: {
          used: true,
          used_at: now.toISOString(),
          usedAt: now,
          updated_at: now,
          updatedAt: now,
        },
      }
    );

    const expiresIn = Math.floor(
      (expiresAt.getTime() - now.getTime()) / 1000
    );

    return NextResponse.json({
      success: true,
      message: "Access code verified successfully",
      expiresIn,
    });
  } catch (error: any) {
    console.error("Error verifying access code:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
