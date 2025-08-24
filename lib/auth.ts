import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

type TokenPayload = { userId?: string; adminId?: string };

function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
}

function getAuthHeaderToken(req: NextRequest): { token?: string; hasHeader: boolean } {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { hasHeader: false };
  const token = authHeader.split(" ")[1];
  return { token, hasHeader: true };
}

// == USER ==
export function requireUser(req: NextRequest): TokenPayload | NextResponse {
  const { token, hasHeader } = getAuthHeaderToken(req);
  if (!hasHeader) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }
  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 401 });
  }
  return decoded;
}

export function optionalAuth(req: NextRequest): TokenPayload | null {
  const { token, hasHeader } = getAuthHeaderToken(req);
  if (!hasHeader || !token) return null;
  const decoded = verifyToken(token);
  return decoded ?? null;
}

// == ADMIN ==
export function requireAdmin(req: NextRequest): TokenPayload | NextResponse {
  const { token, hasHeader } = getAuthHeaderToken(req);
  if (!hasHeader || !token) {
    return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
  }
  const decoded = verifyToken(token);
  if (!decoded?.adminId) {
    return NextResponse.json({ success: false, message: "Invalid or expired token" }, { status: 401 });
  }
  return decoded;
}
