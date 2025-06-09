import { NextRequest } from "next/server";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment");
}

/**
 * Verifies a JWT extracted from the Authorization header.
 * @param req - Next.js Request object
 * @returns Decoded JWT payload
 * @throws If header is missing, malformed, or token invalid
 */
export function verifyJwt(req: NextRequest): JwtPayload {
    console.log("REQ", req)
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing Authorization header");
  }
  const token = authHeader.slice(7);
  console.log('TOKEN', token)
  try {
    const decoded = jwt.verify(token, JWT_SECRET!);
    if (typeof decoded === "string") throw new Error("Unexpected token payload");
    return decoded;
  } catch (err) {
    if (err instanceof JsonWebTokenError && err.name === "TokenExpiredError") {
      throw new Error("Invalid or expired JWT");
    }
    throw err;
  }
}