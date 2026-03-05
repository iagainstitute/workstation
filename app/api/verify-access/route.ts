import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Invalid code format" },
        { status: 400 }
      );
    }

    // Find the access code
    const { data: accessCode, error: fetchError } = await supabaseAdmin
      .from("access_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (fetchError || !accessCode) {
      return NextResponse.json(
        { success: false, message: "Invalid access code" },
        { status: 404 }
      );
    }

    // Check if already used
    if (accessCode.used) {
      return NextResponse.json(
        { success: false, message: "This code has already been used" },
        { status: 403 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(accessCode.expires_at);

    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, message: "This code has expired" },
        { status: 403 }
      );
    }

    // Mark code as used
    const { error: updateError } = await supabaseAdmin
      .from("access_codes")
      .update({
        used: true,
        used_at: new Date().toISOString(),
      })
      .eq("id", accessCode.id);

    if (updateError) {
      console.error("Error updating access code:", updateError);
      return NextResponse.json(
        { success: false, message: "Failed to process code" },
        { status: 500 }
      );
    }

    // Calculate remaining seconds until expiry
    const remainingSeconds = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);

    // Success
    return NextResponse.json({
      success: true,
      message: "Access code verified successfully",
      expiresIn: remainingSeconds, // seconds remaining
    });
  } catch (error) {
    console.error("Error verifying access code:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
