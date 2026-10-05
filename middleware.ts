import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // ── Vendor portal protection ──
  if (path.startsWith('/portal/vendor') && !user) {
    return NextResponse.redirect(new URL('/vendor-login', request.url));
  }
  if (path === '/vendor-login' && user) {
    const { data: vendor } = await supabase.rpc('get_my_vendor_profile');
    if (vendor?.[0]) {
      return NextResponse.redirect(new URL('/portal/vendor', request.url));
    }
  }

  // ── School portal protection ──
  if (
    path.startsWith('/portal/admin') ||
    path.startsWith('/portal/teacher') ||
    path.startsWith('/portal/student')
  ) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  if (path === '/login' && user) {
    return NextResponse.redirect(new URL('/portal/admin', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};