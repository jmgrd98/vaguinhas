import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET in environment");

const tokenBodySchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }).transform(e => e.toLowerCase()),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json();
  const parseResult = tokenBodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { message: "E-mail inválido", errors: parseResult.error.errors },
      { status: 400 }
    );
  }

  const { email } = parseResult.data;
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  return NextResponse.json({ token });
}