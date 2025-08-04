import { NextResponse } from 'next/server'

export async function POST() {
  const authCookies = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'next-auth.csrf-token',
    '__Secure-next-auth.csrf-token'
  ]
  
  const response = NextResponse.json(
    { success: true },
    {
      headers: {
        'Clear-Site-Data': '"cookies", "storage"',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    }
  )
  
  authCookies.forEach(cookieName => {
    response.headers.append('Set-Cookie', `${cookieName}=; Max-Age=-1; Path=/`)
  })
  
  return response
}