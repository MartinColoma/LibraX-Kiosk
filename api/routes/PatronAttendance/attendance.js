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

router.post("/request-scan", async (req, res) => {
  const { sessionId } = req.body;
  const { data, error } = await supabase
    .from("scan_requests")
    .insert([{ session_id: sessionId, status: "pending" }])
    .select(); // to return inserted row
  if (error) return res.status(500).json({ success: false, error });
  res.json({ success: true, requestId: data[0].id });
});

router.get("/scan-request", async (req, res) => {
  const { data, error } = await supabase
    .from("scan_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (error || !data)
    return res.status(404).json({ success: false, message: "No scan requested" });
  res.json({ success: true, request: data });
});


router.post("/scan-result", async (req, res) => {
  const { requestId, nfc_uid } = req.body;
  // Find user by UID (as in your attendance.js)
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("user_id, first_name, last_name, nfc_uid, role, student_faculty_id")
    .eq("nfc_uid", nfc_uid)
    .single();
  if (!user || userError)
    return res.status(404).json({ success: false, message: "User not found" });

  // === Begin Attendance Logic (same as your scan/post) ===
  const today = new Date().toISOString().slice(0, 10);
  // Get latest reader number for today
  const { data: latest } = await supabase
    .from("attendance")
    .select("reader_number")
    .order("scan_time", { ascending: false })
    .gte("scan_time", `${today} 00:00:00`)
    .lt("scan_time", `${today} 23:59:59`)
    .limit(1)
    .single();
  const new_reader_number = latest?.reader_number ? latest.reader_number + 1 : 1;
  // Insert attendance record
  const { error: insertError } = await supabase
    .from("attendance")
    .insert([{
      user_id: user.user_id,
      nfc_uid,
      reader_number: new_reader_number,
      status: "Present"
    }]);
  if (insertError)
    return res.status(500).json({ success: false, message: "Failed to record attendance" });

  // Update scan_requests table with completed attendance and user info
  const fullResponse = {
    user,
    reader_number: new_reader_number,
    scannedUid: nfc_uid
  };
  const { data: updatedScan, error: updateError } = await supabase
    .from("scan_requests")
    .update({
      status: "completed",
      nfc_uid: nfc_uid,
      response: JSON.stringify(fullResponse)
    })
    .eq("id", requestId)
    .select();
  if (updateError)
    return res.status(500).json({ success: false, message: "Failed to complete scan request" });
  res.json({ success: true, scan_request: updatedScan[0], attendance: fullResponse });
});

// -------------------------------
// GET /attendance/scan-status?requestId=123
// -------------------------------
router.get("/scan-status", async (req, res) => {
  try {
    const { requestId } = req.query;
    if (!requestId)
      return res.status(400).json({ success: false, message: "Missing requestId" });

    const { data, error } = await supabase
      .from("scan_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error || !data)
      return res.status(404).json({ success: false, message: "Scan request not found" });

    return res.status(200).json({ success: true, request: data });
  } catch (err) {
    console.error("Scan status error:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


module.exports = router;
