import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// MAINTENANCE MODE: 2026-05-06
// To restore: delete this file and redeploy
// Then run: supabase projects unpause --project-ref eqqweshjxmtwhuekoahy

const MAINTENANCE_PAGE = '/maintenance'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === MAINTENANCE_PAGE) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'Service temporarily unavailable', maintenance: true },
      { status: 503 }
    )
  }

  const url = request.nextUrl.clone()
  url.pathname = MAINTENANCE_PAGE
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
