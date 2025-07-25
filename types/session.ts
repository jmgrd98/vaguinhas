import "next-auth";

declare module "next-auth" {
  interface Profile {
    sub?: string;
    name?: string;
    email?: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
    headline?: string;
    industry?: string;
    locale?: string;
    profile?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      provider?: string;
      profile?: {
        headline?: string;
        industry?: string;
        location?: string;
        profileUrl?: string;
        vanityName?: string;
        givenName?: string;
        familyName?: string;
        emailType?: string;
      };
    };
  }
}