// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("Request URL:", request.url);
  return NextResponse.next();
}

export const config = {
  matcher: "/api/auth/:path*",
};
