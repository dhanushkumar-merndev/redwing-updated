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
      return NextResponse.json({ hash: hashed });
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
