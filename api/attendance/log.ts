// /api/attendance/log.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "../utils/cors";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!handleCors(req, res)) return;

  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { user_id, nfc_uid, reader_number } = req.body as {
      user_id?: string;
      nfc_uid?: string;
      reader_number?: number;
    };

    if (!user_id || !nfc_uid || !reader_number)
      return res.status(400).json({ error: "Missing required fields" });

    const { data, error } = await supabase
      .from("attendance")
      .insert([{ user_id, nfc_uid, reader_number }])
      .select();

    if (error) throw error;

    return res.status(201).json({ success: true, data: data[0] });
  } catch (err: any) {
    console.error("Attendance log error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
}
