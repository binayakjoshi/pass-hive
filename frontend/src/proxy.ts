import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const authToken = req.cookies.get("access_token")?.value;

  const { pathname } = req.nextUrl;

  const authRoutes = ["/login", "/signup"];

  const protectedRoutes = ["/vaults"];

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (!authToken && isProtectedRoute)
    return NextResponse.redirect(new URL("/login", req.url));

  if (authToken && isAuthRoute)
    return NextResponse.redirect(new URL("/vault", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};
