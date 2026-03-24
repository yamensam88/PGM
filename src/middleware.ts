import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const DEFAULT_PATHS: Record<string, string> = {
  admin: '/dispatch/dashboard',
  owner: '/dispatch/dashboard',
  dispatcher: '/dispatch/runs',
  manager: '/dispatch/runs',
  hr: '/dispatch/hr',
  finance: '/dispatch/analytics',
  driver: '/driver',
};

const ALLOWED_PREFIXES: Record<string, string[]> = {
  admin: ['/dispatch', '/driver'],
  owner: ['/dispatch', '/driver'],
  dispatcher: ['/dispatch/runs', '/dispatch/settings', '/driver'], // Let them see settings if they want, but sidebar blocks it anyway. Let's just restrict strictly.
  manager: ['/dispatch/runs', '/driver'],
  hr: ['/dispatch/hr'],
  finance: ['/dispatch/analytics'],
  driver: ['/driver'],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuth = !!token;
  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === '/login';
  const isRootPage = pathname === '/';

  if (isAuthPage || isRootPage) {
    if (isAuth && token.role) {
      const defaultPath = DEFAULT_PATHS[token.role as string] || '/dispatch/dashboard';
      return NextResponse.redirect(new URL(defaultPath, request.url));
    }
    if (isRootPage && !isAuth) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return null;
  }

  if (!isAuth) {
    let from = request.nextUrl.pathname;
    if (request.nextUrl.search) {
      from += request.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/login?from=${encodeURIComponent(from)}`, request.url)
    );
  }

  if (token.role) {
     const role = token.role as string;
     const allowed = ALLOWED_PREFIXES[role] || [];
     
     if (pathname.startsWith('/dispatch') || pathname.startsWith('/driver')) {
        // Admin and owner bypass
        if (role === 'admin' || role === 'owner') {
            return NextResponse.next();
        }

        const hasAccess = allowed.some(prefix => pathname.startsWith(prefix));
        if (!hasAccess) {
           const defaultPath = DEFAULT_PATHS[role] || '/login';
           return NextResponse.redirect(new URL(defaultPath, request.url));
        }
     }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dispatch/:path*', '/driver/:path*', '/login'],
};
