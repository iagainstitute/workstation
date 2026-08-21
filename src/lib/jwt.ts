import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "iaga-admin-secret-key-2026-change-in-production"
);

export async function signToken(
  payload: any,
  expiresIn: string = "7d"
): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getAuthenticatedUser(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/iaga-auth-token=([^;]+)/);
  if (match) {
    const decoded = await verifyToken(decodeURIComponent(match[1]));
    if (decoded) return decoded;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const decoded = await verifyToken(authHeader.replace("Bearer ", ""));
    if (decoded) return decoded;
  } else if (authHeader) {
    const decoded = await verifyToken(authHeader);
    if (decoded) return decoded;
  }

  return null;
}
