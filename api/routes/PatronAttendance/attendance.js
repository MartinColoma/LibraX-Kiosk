const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

// -------------------------------
// Supabase setup
// -------------------------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// -------------------------------
// POST /attendance/record - NFC scan
// -------------------------------
router.post("/record", async (req, res) => {
  try {
    const { nfc_uid } = req.body;
    if (!nfc_uid)
      return res.status(400).json({ success: false, message: "Missing NFC UID" });

    // Find user by NFC UID
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, first_name, last_name, nfc_uid, role, student_faculty_id")
      .eq("nfc_uid", nfc_uid)
      .single();

    if (userError || !user)
      return res.status(404).json({ success: false, message: "User not found" });

    // Get latest reader_number for today
    const today = new Date().toISOString().slice(0, 10);
    const { data: latest } = await supabase
      .from("attendance")
      .select("reader_number")
      .order("scan_time", { ascending: false })
      .gte("scan_time", `${today} 00:00:00`)
      .lt("scan_time", `${today} 23:59:59`)
      .limit(1)
      .single();

    const new_reader_number = latest?.reader_number ? latest.reader_number + 1 : 1;

    // Insert attendance
    const { error: insertError } = await supabase
      .from("attendance")
      .insert([{
        user_id: user.user_id,
        nfc_uid,
        reader_number: new_reader_number,
        status: "Present",
      }]);

    if (insertError)
      return res.status(500).json({ success: false, message: "Failed to record attendance" });

    return res.status(200).json({
      success: true,
      user,
      reader_number: new_reader_number,
      scannedUid: nfc_uid,
    });
  } catch (err) {
    console.error("Record API error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// -------------------------------
// POST /attendance/manual - Manual ID
// -------------------------------
router.post("/manual", async (req, res) => {
  try {
    const { student_id } = req.body;
    if (!student_id)
      return res.status(400).json({ success: false, message: "Missing Student/Faculty ID" });

    // Find user by student_faculty_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, first_name, last_name, nfc_uid, role, student_faculty_id")
      .eq("student_faculty_id", student_id)
      .single();

    if (userError || !user)
      return res.status(404).json({ success: false, message: "Student/Faculty ID not found" });

    // Get latest reader_number for today
    const today = new Date().toISOString().slice(0, 10);
    const { data: latest } = await supabase
      .from("attendance")
      .select("reader_number")
      .order("scan_time", { ascending: false })
      .gte("scan_time", `${today} 00:00:00`)
      .lt("scan_time", `${today} 23:59:59`)
      .limit(1)
      .single();

    const new_reader_number = latest?.reader_number ? latest.reader_number + 1 : 1;

    // Insert attendance (manual)
    const { error: insertError } = await supabase
      .from("attendance")
      .insert([{
        user_id: user.user_id,
        nfc_uid: null,
        reader_number: new_reader_number,
        status: "Present",
      }]);

    if (insertError)
      return res.status(500).json({ success: false, message: "Failed to record attendance" });

    return res.status(200).json({
      success: true,
      user,
      reader_number: new_reader_number,
    });
  } catch (err) {
    console.error("Manual attendance API error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
