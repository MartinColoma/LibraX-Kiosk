// /api/attendance/scan.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "../utils/cors";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // corrected env var name

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!handleCors(req, res)) return;

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { nfc_uid } = req.body as { nfc_uid?: string };

    if (!nfc_uid)
      return res.status(400).json({ error: "Missing NFC UID" });

    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, first_name, last_name, role, nfc_uid")
      .eq("nfc_uid", nfc_uid)
      .single();

    if (error || !user)
      return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, user });
  } catch (err: any) {
    console.error("Scan API error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}
