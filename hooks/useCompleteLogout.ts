import { useState } from 'react'
import { signOut } from 'next-auth/react'
// import { useRouter } from 'next/navigation'

export function useCompleteLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
//   const router = useRouter()
  
  const logout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      // Clear all localStorage items
      localStorage.removeItem('sessionToken')
      localStorage.clear()
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Signal other tabs about logout
      localStorage.setItem('logout-event', Date.now().toString())
      
      // Call custom logout endpoint
      await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      
      // Sign out with NextAuth
      await signOut({ redirect: false })
      
      // Force hard navigation to clear cache
      window.location.replace('/')
      
    } catch (error) {
      console.error('Logout error:', error)
      // Force navigation even on error
      window.location.replace('/')
    }
  }
  
  return { logout, isLoggingOut }
}