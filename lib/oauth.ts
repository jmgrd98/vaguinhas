import { NextAuthOptions, Profile, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { LinkedInProfile as NextAuthLinkedInProfile } from 'next-auth/providers/linkedin';

// Define custom types for extended profiles
interface LinkedInProfile extends NextAuthLinkedInProfile {
  sub: string;
  given_name?: string;
  family_name?: string;
  locale?: string;
  email_verified?: boolean;
  picture?: string;
  givenName?: string;
  familyName?: string;
  location?: string;
  emailType?: string | null;
}

interface GoogleProfile extends Profile {
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
  locale?: string;
}

interface ExtendedUser extends User {
  id: string;
  profile?: {
    headline: string;
    industry: string;
    location: string;
    profileUrl: string;
    givenName: string;
    familyName: string;
    emailType: string;
  };
  provider?: string;
}

interface ExtendedJWT extends JWT {
  userId?: string;
  provider?: string;
  headline?: string;
  industry?: string;
  location?: string;
  profileUrl?: string;
  givenName?: string;
  familyName?: string;
  emailType?: string;
}

interface UserDocument {
  _id?: ObjectId;
  email: string;
  name?: string | null;
  image?: string | null;
  oauthProvider: string;
  oauthProviderId: string;
  emailType: string | null;
  lastLogin: Date;
  updatedAt: Date;
  givenName?: string;
  familyName?: string;
  locale?: string;
  location?: string;
  emailVerified?: boolean;
  confirmed: boolean;
  isActive: boolean;
  createdAt: Date;
  stacks: string[];
  seniorityLevel: string;
  headline: string;
  industry: string;
  profileUrl: string;
}

// Add this helper function at the top of oauth.ts
function extractEmailType(email: string): string | null {
  const parts = email.split('@');
  if (parts.length < 2) return null;
  const domain = parts[1];
  const domainParts = domain.split('.');
  return domainParts.length > 1 ? domainParts[0] : null;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.VAGUINHAS_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.VAGUINHAS_GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      client: {
        token_endpoint_auth_method: "client_secret_post",
      },
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
        url: 'https://api.linkedin.com/v2/me',
        params: {
          projection: `(id,localizedFirstName,localizedLastName,vanityName,localizedHeadline,profilePicture(displayImage~digitalmediaAsset:playableStreams))`,
        },
      },
      wellKnown: "https://www.linkedin.com/oauth/.well-known/openid-configuration",
      async profile(profile: LinkedInProfile): Promise<LinkedInProfile> {
        console.log('Raw LinkedIn Profile:', profile);
        
        // Extract country from locale (e.g., "en_US" → "US")
        const location = profile.locale?.split('_')?.[1] || '';
        
        const result: LinkedInProfile = {
          id: profile.sub,
          name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
          sub: profile.sub,
          givenName: profile.given_name || '',
          familyName: profile.family_name || '',
          email: profile.email || '',
          email_verified: profile.email_verified || false,
          image: profile.picture || '',
          locale: profile.locale || '',
          location: location,
          emailType: extractEmailType(profile.email || ''),
          localizedFirstName: profile.localizedFirstName || '',
          localizedLastName: profile.localizedLastName || '',
          profilePicture: profile.profilePicture || null,
        };
        
        console.log('Processed LinkedIn Profile:', result);
        return result;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (account?.provider === "linkedin" || account?.provider === "google") {
        try {
          const { db } = await connectToDatabase();
          
          // Check if user exists with the provided email
          const existingUser = await db.collection<UserDocument>("users").findOne({
            email: user.email?.toLowerCase()
          });

          // If no user exists, block the sign-in (user needs to sign up first)
          if (!existingUser) {
            console.error(`Sign-in blocked: No user found with email ${user.email}`);
            throw new Error("NO_USER_FOUND");
          }

          // If user exists with a different provider, block the sign-in
          if (existingUser.oauthProvider !== account.provider) {
            console.error(`Sign-in blocked: User with email ${user.email} registered with ${existingUser.oauthProvider}, attempted to sign in with ${account.provider}`);
            throw new Error(`PROVIDER_MISMATCH:${existingUser.oauthProvider}`);
          }

          // User exists with the correct provider - update last login
          await db.collection<UserDocument>("users").updateOne(
            { _id: existingUser._id },
            { 
              $set: {
                lastLogin: new Date(),
                updatedAt: new Date(),
                // Update image in case it changed
                image: user.image || existingUser.image,
                // Update name in case it changed
                name: user.name || existingUser.name
              }
            }
          );
          
          // Set the MongoDB _id as the user id
          user.id = existingUser._id.toString();
          console.log('User signed in successfully with ID:', user.id);
          
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          // Re-throw specific errors to be handled by NextAuth
          if (error instanceof Error && 
              (error.message === 'NO_USER_FOUND' || 
               error.message.startsWith('PROVIDER_MISMATCH:'))) {
            throw error;
          }
          return false;
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback - URL:', url);
      
      // Parse the URL to check for fromLogin parameter
      const urlObj = new URL(url, baseUrl);
      const fromLogin = urlObj.searchParams.get('fromLogin');
      
      // Preserve the fromLogin parameter in the callback URL
      const callbackUrl = new URL(`${baseUrl}/auth/callback`);
      if (fromLogin === 'true') {
        callbackUrl.searchParams.set('fromLogin', 'true');
      }
      
      return callbackUrl.toString();
    },
    async session({ session, token }) {
      const extendedToken = token as ExtendedJWT;
      
      if (extendedToken && session.user) {
        const user = session.user as ExtendedUser;
        user.id = extendedToken.userId!;
        user.email = extendedToken.email!;
        user.provider = extendedToken.provider;
        
        // Add profile info to session
        user.profile = {
          headline: extendedToken.headline || '',
          industry: extendedToken.industry || '',
          location: extendedToken.location || '',
          profileUrl: extendedToken.profileUrl || '',
          givenName: extendedToken.givenName || '',
          familyName: extendedToken.familyName || '',
          emailType: extendedToken.emailType || ''
        };
      }
      return session;
    },
    async jwt({ token, user, account, profile }) {
      console.log('JWT Callback - Profile:', profile);
      
      const extendedToken = token as ExtendedJWT;
      
      if (account && user) {
        extendedToken.userId = user.id;
        extendedToken.email = user.email!;
        extendedToken.provider = account.provider;
        
        // Type-safe profile handling
        if (account.provider === "linkedin" && profile) {
          const linkedInProfile = profile as LinkedInProfile;
          extendedToken.headline = undefined; // LinkedIn v2 doesn't provide this
          extendedToken.industry = undefined; // LinkedIn v2 doesn't provide this
          extendedToken.location = linkedInProfile.location;
          extendedToken.profileUrl = undefined; // LinkedIn v2 doesn't provide this
          extendedToken.givenName = linkedInProfile.givenName;
          extendedToken.familyName = linkedInProfile.familyName;
          extendedToken.emailType = linkedInProfile.emailType || undefined;
        } else if (account.provider === "google" && profile) {
          const googleProfile = profile as GoogleProfile;
          extendedToken.givenName = googleProfile.given_name;
          extendedToken.familyName = googleProfile.family_name;
          extendedToken.emailType = extractEmailType(user.email || '') || undefined;
        }
      }
      
      console.log('JWT Callback - Token:', extendedToken);
      return extendedToken;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};

// Separate function to handle user registration/signup
export async function createUser(
  email: string,
  provider: string,
  providerId: string,
  profile: Partial<UserDocument>
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const { db } = await connectToDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection<UserDocument>("users").findOne({
      email: email.toLowerCase()
    });
    
    if (existingUser) {
      return { 
        success: false, 
        error: `User already exists with provider: ${existingUser.oauthProvider}` 
      };
    }
    
    // Create new user
    const newUser: Omit<UserDocument, '_id'> = {
      email: email.toLowerCase(),
      name: profile.name || null,
      image: profile.image || null,
      oauthProvider: provider,
      oauthProviderId: providerId,
      emailType: extractEmailType(email),
      lastLogin: new Date(),
      updatedAt: new Date(),
      givenName: profile.givenName || '',
      familyName: profile.familyName || '',
      locale: profile.locale || '',
      location: profile.location || '',
      emailVerified: profile.emailVerified || false,
      confirmed: true,
      isActive: true,
      createdAt: new Date(),
      stacks: [],
      seniorityLevel: "",
      headline: "",
      industry: "",
      profileUrl: "",
    };
    
    const result = await db.collection<UserDocument>("users").insertOne(newUser);
    
    return { 
      success: true, 
      userId: result.insertedId.toString() 
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { 
      success: false, 
      error: "Failed to create user" 
    };
  }
}

export default authOptions;