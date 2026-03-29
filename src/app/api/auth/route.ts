import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const dashboardPassword = process.env.DASHBOARD_PASSWORD;
    const authSalt = process.env.AUTH_SALT || "";

    if (!dashboardPassword) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (password === dashboardPassword) {
      const hashed = await hashPassword(password, authSalt);
      const response = NextResponse.json({ hash: hashed });
      
      response.cookies.set("dashboard_auth", hashed, {
        path: "/",
        maxAge: 604800, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      
      return response;
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("dashboard_auth");
  return response;
}
