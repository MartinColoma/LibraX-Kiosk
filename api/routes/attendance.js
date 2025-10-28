const express = require("express");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(bodyParser.json());

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// POST /attendance/record
app.post("/attendance/record", async (req, res) => {
  try {
    const nfc_uid = req.body.nfc_uid;
    if (!nfc_uid) return res.status(400).json({ success: false, message: "Missing NFC UID" });

    // Step 1: Find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, first_name, last_name, nfc_uid, role")
      .eq("nfc_uid", nfc_uid)
      .single();

    if (userError || !user) return res.status(404).json({ success: false, message: "User not found" });

    // Step 2: Atomic counter for reader_number
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // upsert counter row for today
    const { data: counter, error: counterError } = await supabase
      .from("attendance_counter")
      .upsert({ day: today, last_number: 1 }, { onConflict: "day", returning: "representation" })
      .select("last_number")
      .single();

    if (counterError) throw counterError;

    // Determine next reader number
    const new_reader_number = counter?.last_number ? counter.last_number + 1 : 1;

    // Update counter to new last_number
    await supabase
      .from("attendance_counter")
      .update({ last_number: new_reader_number })
      .eq("day", today);

    // Step 3: Insert attendance
    const { error: insertError } = await supabase
      .from("attendance")
      .insert([{ user_id: user.user_id, nfc_uid, reader_number: new_reader_number, status: "Present" }]);

    if (insertError) throw insertError;

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Attendance API running on port ${PORT}`));
