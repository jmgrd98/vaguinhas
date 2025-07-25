import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import { connectToDatabase } from "@/lib/mongodb";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.VAGUINHAS_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.VAGUINHAS_GOOGLE_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
      // issuer: "https://www.linkedin.com",
      authorization: {
        url: "https://www.linkedin.com/oauth/v2/authorization",
        params: {
          scope: "openid profile email",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      token: {
        url: "https://www.linkedin.com/oauth/v2/accessToken",
      },
      userinfo: {
        url: "https://api.linkedin.com/v2/userinfo",
      },
      wellKnown: "https://www.linkedin.com/oauth/.well-known/openid-configuration",
      async profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "linkedin" || account?.provider === "google") {
        console.log('ACCOUNT PROVIDER:', account.provider);
        console.log('USER:', user);
        try {
          const { db } = await connectToDatabase();
          
          // Check if user exists
          const existingUser = await db.collection("users").findOne({
            email: user.email?.toLowerCase()
          });

          if (!existingUser) {
            // For new users, create a minimal entry
            // Stack and seniority will be added in the callback page
            const result = await db.collection("users").insertOne({
              email: user.email?.toLowerCase(),
              name: user.name,
              image: user.image,
              oauthProvider: account.provider,
              oauthProviderId: user.id,
              confirmed: true, // OAuth users are pre-confirmed
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              // These will be updated in the callback
              stacks: [],
              seniorityLevel: "",
            });
            
            // Store the new user ID for session
            user.id = result.insertedId.toString();
          } else {
            // Update last login for existing users
            await db.collection("users").updateOne(
              { _id: existingUser._id },
              { 
                $set: { 
                  lastLogin: new Date(),
                  oauthProvider: account.provider,
                  oauthProviderId: user.id
                } 
              }
            );
            
            // Store existing user ID
            user.id = existingUser._id.toString();
          }

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to callback page after OAuth
      return `${baseUrl}/auth/callback`;
    },
    async session({ session, token }) {
      // Add user ID and email to session
      if (token && session.user) {
        session.user.id = token.userId as string;
        session.user.email = token.email as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.userId = user.id;
        token.email = user.email!;
        token.provider = account.provider;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};