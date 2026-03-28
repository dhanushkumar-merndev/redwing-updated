import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const authCookie = req.cookies.get("dashboard_auth")?.value;
  const dashboardPassword = process.env.DASHBOARD_PASSWORD;
  const authSalt = process.env.AUTH_SALT || "";

  if (!dashboardPassword) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const expectedHash = await hashPassword(dashboardPassword, authSalt);

  if (authCookie !== expectedHash) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|api/auth|_next|favicon|image|site.webmanifest|android-chrome|apple-touch-icon).*)"],
};
