import { NextResponse } from "next/server";
import { signJWT } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { adminSecret } = await req.json();

    if (!adminSecret || adminSecret !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Invalid administrative key." }, { status: 403 });
    }

    // Issue a short-lived admin token (1 hour)
    const adminToken = signJWT({ uid: "admin", email: "admin@datie.app" }, 60 * 60);

    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_token", adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Admin Login Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
