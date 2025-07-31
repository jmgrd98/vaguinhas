import { useEffect } from 'react'
import { signOut } from 'next-auth/react'

export function useLogoutSync() {
  useEffect(() => {
    const syncLogout = (event: StorageEvent) => {
      if (event.key === 'logout-event' && event.newValue) {
        // Clear all client-side storage
        localStorage.clear()
        sessionStorage.clear()
        
        // Perform logout without redirect
        signOut({ redirect: false }).then(() => {
          // Redirect to homepage after signout completes
          window.location.replace('/')
        })
      }
    }

    window.addEventListener('storage', syncLogout)
    
    return () => {
      window.removeEventListener('storage', syncLogout)
    }
  }, [])
}