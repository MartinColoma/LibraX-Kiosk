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

    // Step 1: Find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, first_name, last_name, nfc_uid, role")
      .eq("nfc_uid", nfc_uid)
      .single();
    if (userError || !user)
      return res.status(404).json({ success: false, message: "User not found" });

    // Step 2: Find latest reader_number for today
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" format
    const { data: latest, error: latestError } = await supabase
      .from("attendance")
      .select("reader_number")
      .order("scan_time", { ascending: false })
      .gte("scan_time", `${today} 00:00:00`)
      .lt("scan_time", `${today} 23:59:59`)
      .limit(1)
      .single();

    const new_reader_number = latest?.reader_number ? latest.reader_number + 1 : 1;

    // Step 3: Insert new attendance record
    const { data: attendData, error: insertError } = await supabase
      .from("attendance")
      .insert([
        {
          user_id: user.user_id,
          nfc_uid,
          reader_number: new_reader_number,
          status: "Present"
        }
      ]);

    if (insertError)
      return res.status(500).json({ success: false, message: "Failed to record attendance" });

    // Step 4: Return with new reader number
    return res.status(200).json({
      success: true,
      user,
      reader_number: new_reader_number,
      scannedUid: nfc_uid
    });

  } catch (err: any) {
    console.error("Record API error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
