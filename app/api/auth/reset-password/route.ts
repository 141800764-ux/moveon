import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Find token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { message: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    if (resetToken.used) {
      return NextResponse.json(
        { message: "This reset link has already been used" },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { message: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and mark token as used
    await Promise.all([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("[POST /api/auth/reset-password]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, message: "No token provided" });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
      return NextResponse.json({
        valid: false,
        message: "Invalid or expired reset link",
      });
    }

    return NextResponse.json({
      valid: true,
      email: resetToken.user.email,
      name: resetToken.user.name,
    });
  } catch (error) {
    return NextResponse.json({ valid: false, message: "Server error" });
  }
}