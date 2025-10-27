import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "../utils/cors";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!handleCors(req, res)) return;

  if (req.method !== "POST")
    return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const { nfc_uid } = req.body as { nfc_uid?: string };
    if (!nfc_uid)
      return res.status(400).json({ success: false, message: "Missing NFC UID" });

    // ✅ Check if user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, first_name, last_name, nfc_uid")
      .eq("nfc_uid", nfc_uid)
      .single();

    if (userError || !user)
      return res.status(404).json({ success: false, message: "User not found" });

    // ✅ Log attendance
    const reader_number = Math.floor(Math.random() * 100) + 1;
    const { data: attendance, error: logError } = await supabase
      .from("attendance")
      .insert([{ user_id: user.user_id, nfc_uid: user.nfc_uid, reader_number }])
      .select()
      .single();

    if (logError)
      return res.status(500).json({ success: false, message: "Failed to log attendance" });

    return res.status(200).json({
      success: true,
      user: { first_name: user.first_name, last_name: user.last_name },
      reader_number,
      scannedUid: nfc_uid
    });

  } catch (err: any) {
    console.error("Record API error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
