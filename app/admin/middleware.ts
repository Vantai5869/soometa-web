// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const adminCode = req.cookies.get('admin_code')?.value;

  const isAdminRoute = url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login');

  if (isAdminRoute && adminCode !== '000') {
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
