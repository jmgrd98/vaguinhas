import NextAuth from "next-auth";
import { authOptions } from "@/lib/oauth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };