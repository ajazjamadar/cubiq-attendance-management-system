import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cubic-attendance-secure-jwt-key-change-in-production-2026'
);

const COOKIE_NAME = 'cubic_auth_token';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static and public assets pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let session: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      session = payload;
    } catch (err) {
      session = null;
    }
  }

  // Handle Login Page
  if (pathname === '/login') {
    if (session) {
      if (session.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/supervisor', request.url));
    }
    return NextResponse.next();
  }

  // Root Page Redirect
  if (pathname === '/') {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (session.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/supervisor', request.url));
  }

  // Admin Routes Protection
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    if (session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/supervisor', request.url));
    }
    return NextResponse.next();
  }

  // Supervisor Routes Protection
  if (pathname.startsWith('/supervisor')) {
    if (!session) {
      const url = new URL('/login', request.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
    // Both SUPERVISOR and ADMIN can access supervisor tools if needed
    if (session.role !== 'SUPERVISOR' && session.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
