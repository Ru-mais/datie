import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ─── Security Headers ───
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Enable XSS filter in older browsers
  response.headers.set("X-XSS-Protection", "1; mode=block");
  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Enforce HTTPS
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.firebase.com https://*.firebasestorage.app https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com wss://*.firebaseio.com; frame-ancestors 'none';"
  );
  // Permissions policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // ─── CSRF Protection for state-changing requests ───
  // Check that mutations come from our own origin
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    // Allow requests without origin header (same-origin navigations, server-side)
    if (origin) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json(
          { error: "CSRF validation failed: cross-origin request blocked." },
          { status: 403 }
        );
      }
    }
  }

  return response;
}

export const config = {
  // Apply middleware to all API routes
  matcher: ["/api/:path*"],
};
