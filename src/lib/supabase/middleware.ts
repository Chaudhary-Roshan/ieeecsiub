import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// In-memory sliding window rate limiter for certificate verification scraping protection
const verifyRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkVerificationRateLimit(ip: string): boolean {
  const now = Date.now();
  if (verifyRateLimits.size > 2000) {
    for (const [key, val] of verifyRateLimits.entries()) {
      if (now > val.resetAt) verifyRateLimits.delete(key);
    }
  }

  const record = verifyRateLimits.get(ip);
  if (!record || now > record.resetAt) {
    verifyRateLimits.set(ip, { count: 1, resetAt: now + 60000 }); // 1-minute window
    return false;
  }

  record.count++;
  return record.count > 35; // Maximum 35 verification attempts per minute per IP
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const path = request.nextUrl.pathname;

  // Anti-scraping rate limiting on certificate verification
  if (path.startsWith("/verify/") && path !== "/verify") {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               request.headers.get("x-real-ip") || 
               "anonymous-ip";
    if (checkVerificationRateLimit(ip)) {
      return new NextResponse(
        "Rate limit exceeded: Too many verification queries from this address. Please wait 60 seconds.",
        {
          status: 429,
          headers: {
            "Content-Type": "text/plain",
            "Retry-After": "60",
          },
        }
      );
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gbuafbcebcbwzvefqhcr.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdidWFmYmNlYmNid3p2ZWZxaGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNjUxNjgsImV4cCI6MjEwODk0MTE2OH0.j1tB4mcsDnyRUYo36EQk90fz-xR0VT55L5kqomLgeDU";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run on static assets
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.includes(".")
  ) {
    return supabaseResponse;
  }

  // Guard /admin routes (except /admin/login)
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check staff session
    // If not authenticated, redirect to /admin/login with return URL
    if (!user) {
      // In development/transition if staff session is not yet active, allow access or redirect
      // When Supabase Auth is active, enforce redirect:
      const hasAuthCookie = request.cookies.get("sb-access-token") || request.cookies.get("supabase-auth-token") || request.cookies.get("ieee_staff_session");
      if (!hasAuthCookie) {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/login";
        url.searchParams.set("redirect", path);
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

