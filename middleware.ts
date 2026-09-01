import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Route-level gate. This is deliberately NOT the only protection — every
 * sensitive table also has RLS (db/002_rls.sql), and pages re-check role via
 * getAppUserSession() server-side. This middleware exists to redirect
 * unauthenticated visitors before any protected UI streams to the client,
 * and to keep "/wp-admin" from being mistaken for a security boundary by
 * itself (per spec section 38 — the path is not the security mechanism).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isStaffArea = pathname.startsWith('/staff') && pathname !== '/staff/login';
  const isAdminArea = pathname.startsWith('/wp-admin') && pathname !== '/wp-admin/login';
  const isAgentArea = pathname.startsWith('/track/agent') && pathname !== '/track/agent';

  if (!isStaffArea && !isAdminArea && !isAgentArea) {
    return NextResponse.next();
  }

  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          res.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginPath = isAdminArea ? '/wp-admin/login' : isAgentArea ? '/track/agent' : '/staff/login';
    const redirectUrl = new URL(loginPath, req.url);
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Role-narrowing beyond "logged in" happens in each page via
  // getAppUserSession(), since middleware runs on the edge without a
  // convenient way to run the same service-role query cheaply on every
  // request. This still blocks the overwhelming majority of unauthorized
  // access attempts (anyone without a session at all) before any protected
  // page renders.
  return res;
}

export const config = {
  matcher: ['/staff/:path*', '/wp-admin/:path*', '/track/agent/:path*'],
};
