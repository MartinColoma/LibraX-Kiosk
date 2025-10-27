// /api/utils/cors.ts
import { VercelRequest, VercelResponse } from "@vercel/node";

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const allowedOrigins = [
    "http://localhost:5173", // local dev (Vite default)
    "https://libra-x-kiosk.vercel.app", // production frontend
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return false;
  }

  return true;
}
