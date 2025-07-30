// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: "/",
  },
});

export const config = {
  matcher: [
    // Remove the subscriber route from protection
    "/assinante/:path*",
    "/api/users/:path*"
  ],
};