import NextAuth from "next-auth";
import { authOptions } from "@/lib/nextAuth";

const handler = NextAuth(authOptions);

// Export named HTTP method handlers
export const GET = handler;
export const POST = handler;