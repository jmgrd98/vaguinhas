// lib/nextAuth.ts
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
          const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/login`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              // Remove the Authorization header if your login endpoint doesn't need it
              // "Authorization": `Bearer ${process.env.NEXT_PUBLIC_JWT_SECRET}`,
            },
            body: JSON.stringify({ email, password }),
          });
          
          if (res.ok) {
            const data = await res.json();
            console.log('Login response:', data);
            
            // Return user object for NextAuth
            // Make sure to return id, not userId
            return {
              id: data.userId || data.id || data._id,
              email: data.email || email,
              // Include any other user data you need
              name: data.name,
            };
          }
          
          // Handle specific error cases
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
        
        const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/verify-magic-link`, {
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
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
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
    error: "/", // Error code passed in query string as ?error=
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug messages in development
  events: {
    async signIn({ user }) {
      console.log('User signed in:', user);
    },
    async signOut(message) {
      console.log('User signed out:', message);
    }
  }
};