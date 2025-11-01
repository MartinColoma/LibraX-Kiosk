  const express = require("express");
  const { createClient } = require("@supabase/supabase-js");

  const router = express.Router();

  // -------------------------------
  // Supabase setup
  // -------------------------------
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // ===== Helper: Check if scan is for book request =====
  async function handleBookRequestScan(nfc_uid, requestId, supabase) {
    try {
      // Get the pending scan request
      const scanResult = await supabase
        .from("scan_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (!scanResult.data) return null;

      const responseData = JSON.parse(scanResult.data.response || '{}');
      
      // Check if this scan has a book_id (meaning it's for book request, not attendance)
      if (!responseData.book_id) return null;

      // Get user data
      const userResult = await supabase
        .from("users")
        .select("user_id, first_name, last_name, email, phone_number, student_faculty_id, address, date_registered, nfc_uid")
        .eq("nfc_uid", nfc_uid)
        .single();

      if (!userResult.data) return null;

      // Prepare book request response
      const fullResponse = {
        user: userResult.data,
        book_id: responseData.book_id,
        scannedUid: nfc_uid
      };

      // Update scan request to completed
      await supabase
        .from("scan_requests")
        .update({
          status: "completed",
          nfc_uid,
          response: JSON.stringify(fullResponse)
        })
        .eq("id", requestId);

      return fullResponse;
    } catch (error) {
      console.error("Book request scan error:", error);
      return null;
    }
  }

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
      .select("user_id, first_name, last_name, email, phone_number, address, date_registered, nfc_uid, role, student_faculty_id")
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

  // -------------------------------
  // POST /attendance/request-scan
  // -------------------------------
  router.post("/request-scan", async (req, res) => {
    try {
      const { sessionId, book_id } = req.body;
      if (!sessionId)
        return res.status(400).json({ success: false, message: "Missing sessionId" });

      // Check for existing pending scan
      const { data: existing, error: existingError } = await supabase
        .from("scan_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (existing && !existingError) {
        return res.json({
          success: true,
          message: "Pending scan already exists",
          requestId: existing.id,
          request: existing
        });
      }

      // Otherwise, create new one with optional book_id in response
      const responseData = book_id ? JSON.stringify({ book_id }) : null;
      
      const { data, error } = await supabase
        .from("scan_requests")
        .insert([{ 
          session_id: sessionId, 
          status: "pending",
          response: responseData
        }])
        .select();

      if (error) return res.status(500).json({ success: false, error });
      res.json({ success: true, requestId: data[0].id, request: data[0] });
    } catch (err) {
      console.error("Request-scan error:", err.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // -------------------------------
  // GET /attendance/scan-request
  // -------------------------------
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

  // -------------------------------
  // POST /attendance/scan-result
  // -------------------------------
  router.post("/scan-result", async (req, res) => {
    try {
      const { requestId, nfc_uid } = req.body;
      if (!requestId || !nfc_uid)
        return res.status(400).json({ success: false, message: "Missing requestId or nfc_uid" });

      // Check if this is a book request scan FIRST
      const bookRequestResult = await handleBookRequestScan(nfc_uid, requestId, supabase);
      if (bookRequestResult) {
        console.log("[Book Request Scan] Processing book request for:", bookRequestResult.user.first_name);
        return res.json({ 
          success: true, 
          type: "book_request",
          scan_request: bookRequestResult,
          message: "Book request scan completed"
        });
      }

      // If not book request, continue with normal attendance flow
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("user_id, first_name, last_name, nfc_uid, role, student_faculty_id")
        .eq("nfc_uid", nfc_uid)
        .single();

      if (!user || userError)
        return res.status(404).json({ success: false, message: "User not found" });

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

      const fullResponse = {
        user,
        reader_number: new_reader_number,
        scannedUid: nfc_uid
      };

      const { data: updatedScan, error: updateError } = await supabase
        .from("scan_requests")
        .update({
          status: "completed",
          nfc_uid,
          response: JSON.stringify(fullResponse)
        })
        .eq("id", requestId)
        .select();

      if (updateError)
        return res.status(500).json({ success: false, message: "Failed to complete scan request" });

      res.json({ success: true, scan_request: updatedScan[0], attendance: fullResponse });
    } catch (err) {
      console.error("Scan-result error:", err.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // -------------------------------
  // GET /attendance/scan-status
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

  // -------------------------------
  // POST /attendance/cancel-request
  // -------------------------------
  router.post("/cancel-request", async (req, res) => {
    try {
      const { requestId } = req.body;
      if (!requestId)
        return res.status(400).json({ success: false, message: "Missing requestId" });

      const { error } = await supabase
        .from("scan_requests")
        .delete()
        .eq("id", requestId);

      if (error)
        return res.status(500).json({ success: false, message: "Failed to cancel scan request" });

      res.status(200).json({ success: true, message: "Scan request cancelled" });
    } catch (err) {
      console.error("Cancel request error:", err.message);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  // Clears old attendance scan requests with status "pending" or "completed"
  router.post("/clear-old-requests", async (req, res) => {
    try {
      const { sessionId } = req.body;

      let query = supabase
        .from("scan_requests")
        .delete()
        .or('status.eq.pending,status.eq.completed');

      // If sessionId is provided, add filter for session_id equal to sessionId
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Failed to clear old requests:", error.message || error);
        return res.status(500).json({ success: false, message: "Failed to clear old requests" });
      }

      // Supabase does not always return a count of deleted rows.
      res.json({ success: true, clearedCount: data ? data.length : 0 });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Failed to clear old requests" });
    }
  });

  module.exports = router;
