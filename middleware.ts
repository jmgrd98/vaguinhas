// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  // This function only runs if authorized callback returns true
  function middleware() {
    // Add cache control headers
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        // Log for debugging
        console.log('Auth check:', {
          pathname,
          hasToken: !!token,
          tokenEmail: token?.email
        })
        
        // Protect /assinante routes
        if (pathname.startsWith('/assinante')) {
          return !!token // Must have token
        }
        
        // Allow all other routes
        return true
      },
    },
    pages: {
      signIn: "/", // Redirect here if not authorized
    },
  }
)


export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    "/assinante/:path*",
    "/api/users/:id*",
  ],
};
