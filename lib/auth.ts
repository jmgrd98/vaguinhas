import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment");
}

/**
 * Creates a JWT session token for a user
 * @param userId - User ID to include in the token
 * @returns Signed JWT token
 */
export function createSessionToken(userId: string): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
}

/**
 * Verifies a JWT extracted from the Authorization header.
 * @param req - Next.js Request object
 * @returns Decoded JWT payload
 * @throws If header is missing, malformed, or token invalid
 */
export function verifyJwt(req: NextRequest): JwtPayload {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing Authorization header");
  }
  const token = authHeader.slice(7);
  return verifyToken(token);
}

/**
 * Verifies a JWT token string
 * @param token - JWT token to verify
 * @returns Decoded JWT payload
 * @throws If token is invalid or expired
 */
export function verifyToken(token: string): JwtPayload {
   if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string") throw new Error("Unexpected token payload");
    return decoded;
  } catch (err) {
    if (err instanceof JsonWebTokenError && err.name === "TokenExpiredError") {
      throw new Error("Invalid or expired JWT");
    }
    throw err;
  }
}