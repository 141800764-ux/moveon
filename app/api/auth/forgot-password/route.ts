import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Always return success even if user not found (security best practice)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If that email exists, a reset link has been sent",
      });
    }

    // Delete any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, used: false },
    });

    // Create new token — expires in 1 hour
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${resetToken.token}`;

    // Send email
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: user.email!,
      subject: "Reset your MoveOn password",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 40px 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: #111111; border-radius: 16px; padding: 40px; border: 1px solid #2a2a2a;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #c8922a; font-size: 28px; margin: 0;">MoveOn</h1>
                <p style="color: #a0a0a0; margin-top: 8px;">Logistics Platform</p>
              </div>
              
              <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 12px;">Reset your password</h2>
              <p style="color: #a0a0a0; line-height: 1.6; margin-bottom: 32px;">
                Hi ${user.name || "there"},<br/><br/>
                We received a request to reset your password. Click the button below to create a new password. This link expires in <strong style="color: #ffffff;">1 hour</strong>.
              </p>
              
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${resetUrl}" 
                   style="background: #c8922a; color: #000000; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
                If you didn't request this, you can safely ignore this email. Your password will not change.<br/><br/>
                Or copy this link into your browser:<br/>
                <a href="${resetUrl}" style="color: #c8922a; word-break: break-all;">${resetUrl}</a>
              </p>
            </div>
          </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "If that email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password]", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}