import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST")
    return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const { nfc_uid } = req.body;
    if (!nfc_uid) return res.status(400).json({ success: false, message: "Missing NFC UID" });

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, first_name, last_name, nfc_uid")
      .eq("nfc_uid", nfc_uid)
      .single();

    if (userError || !user) return res.status(404).json({ success: false, message: "User not found" });

    const reader_number = Math.floor(Math.random() * 100) + 1;

    const { data: attendance, error: logError } = await supabase
      .from("attendance")
      .insert([{ user_id: user.user_id, nfc_uid: user.nfc_uid, reader_number }])
      .select()
      .single();

    if (logError) return res.status(500).json({ success: false, message: "Failed to log attendance" });

    return res.status(200).json({
      success: true,
      user: { first_name: user.first_name, last_name: user.last_name },
      reader_number,
      scannedUid: nfc_uid
    });

  } catch (err: any) {
    console.error("Record API error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
