import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        try {
          const { email, password } = credentials;
          
          // FIX 1: Use absolute URL for internal API calls
          const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });
          
          if (res.ok) {
            const data = await res.json();
            console.log('Login response:', data);
            
            return {
              id: data.userId || data.id || data._id,
              email: data.email || email,
              name: data.name,
            };
          }
          
          if (res.status === 401) {
            throw new Error('Invalid credentials');
          } else if (res.status === 403) {
            throw new Error('Email not confirmed');
          } else if (res.status === 404) {
            throw new Error('User not found');
          }
          
          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/auth/verify-magic-link`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: credentials.token }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            id: data.userId || data.id || data._id,
            email: data.email,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
    // FIX 2: Add redirect callback to handle custom redirects
    async redirect({ url, baseUrl }) {
      // If the url is a relative path, ensure it starts with a slash
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // If it's already an absolute URL on the same origin, allow it
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default redirect to home
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
  },
  // FIX 3: Improved cookie configuration for production
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Add domain for production if using subdomains
        ...(process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN 
          ? { domain: process.env.COOKIE_DOMAIN } 
          : {}),
      }
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
  },
  // FIX 4: Add trustHost for production
  // trustHost: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn({ user }) {
      console.log('User signed in:', user);
    },
    async signOut(message) {
      console.log('User signed out:', message);
    }
  }
};

export default authOptions;