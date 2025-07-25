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
    async signIn({ user, account, profile }) {
      if (account?.provider === "linkedin" || account?.provider === "google") {
        try {
          const { db } = await connectToDatabase();
          const emailType = extractEmailType(user.email!);

          // Type assertion based on provider
          const extendedProfile = account.provider === "linkedin" 
            ? profile as LinkedInProfile 
            : profile as GoogleProfile;

          // Prepare base user data
          const userData: Partial<UserDocument> = {
            email: user.email?.toLowerCase(),
            name: user.name,
            image: user.image,
            oauthProvider: account.provider,
            oauthProviderId: account.providerAccountId || user.id,
            emailType,
            lastLogin: new Date(),
            updatedAt: new Date(),
          };

          // Add LinkedIn-specific fields (from OpenID Connect)
          if (account.provider === "linkedin" && 'given_name' in extendedProfile) {
            const linkedInProfile = extendedProfile as LinkedInProfile;
            userData.givenName = linkedInProfile.givenName || linkedInProfile.given_name;
            userData.familyName = linkedInProfile.familyName || linkedInProfile.family_name;
            userData.locale = linkedInProfile.locale;
            userData.location = linkedInProfile.location;
            userData.emailVerified = linkedInProfile.email_verified;
          }

          // Add Google-specific fields
          if (account.provider === "google" && 'given_name' in extendedProfile) {
            const googleProfile = extendedProfile as GoogleProfile;
            userData.givenName = googleProfile.given_name;
            userData.familyName = googleProfile.family_name;
            userData.emailVerified = googleProfile.email_verified;
            userData.locale = googleProfile.locale;
          }

          // Check if user exists
          const existingUser = await db.collection<UserDocument>("users").findOne({
            email: user.email?.toLowerCase()
          });

          if (!existingUser) {
            // New user - create with all fields
            const newUser: Omit<UserDocument, '_id'> = {
              email: userData.email!,
              name: userData.name,
              image: userData.image,
              oauthProvider: userData.oauthProvider!,
              oauthProviderId: userData.oauthProviderId!,
              emailType: userData.emailType!,
              lastLogin: userData.lastLogin!,
              updatedAt: userData.updatedAt!,
              givenName: userData.givenName || '',
              familyName: userData.familyName || '',
              locale: userData.locale || '',
              location: userData.location || '',
              emailVerified: userData.emailVerified || false,
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
            
            // Set the MongoDB _id as the user id
            user.id = result.insertedId.toString();
            console.log('Created new user with ID:', user.id);
          } else {
            // Existing user - update with new info
            await db.collection<UserDocument>("users").updateOne(
              { _id: existingUser._id },
              { 
                $set: userData,
                // Preserve existing fields that aren't in the OAuth response
                $setOnInsert: {
                  headline: existingUser.headline || "",
                  industry: existingUser.industry || "",
                  profileUrl: existingUser.profileUrl || "",
                  stacks: existingUser.stacks || [],
                  seniorityLevel: existingUser.seniorityLevel || ""
                }
              }
            );
            user.id = existingUser._id.toString();
            console.log('Updated existing user with ID:', user.id);
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
      console.log('URL:', url);
      // Always redirect to callback page after OAuth
      return `${baseUrl}/auth/callback`;
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
    signIn: "/",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};