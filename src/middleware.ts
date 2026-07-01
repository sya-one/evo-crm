import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect to dashboard if already logged in and visiting login
    if (path === "/login" && token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Protect all routes under /dashboard
    if (path.startsWith("/dashboard") && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Allow login page without auth
        if (path === "/login") return true;
        // Protect API routes
        if (path.startsWith("/api/auth")) return true;
        if (path.startsWith("/api")) return !!token;
        // Protect dashboard routes
        if (path.startsWith("/dashboard")) return !!token;
        // Allow other paths
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login"],
};