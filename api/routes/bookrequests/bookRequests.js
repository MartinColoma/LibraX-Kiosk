const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// POST /books/request
router.post("/request", async (req, res) => {
  const { nfc_uid, book_id } = req.body;
  if (!nfc_uid || !book_id) {
    return res.status(400).json({ success: false, message: "Missing nfc_uid or book_id" });
  }

  // Get user
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("user_id")
    .eq("nfc_uid", nfc_uid)
    .single();

  if (userError || !user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Get book
  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("book_id, available_copies")
    .eq("book_id", book_id)
    .single();

  if (bookError || !book) {
    return res.status(404).json({ success: false, message: "Book not found" });
  }

  if (book.available_copies <= 0) {
    return res.status(400).json({ success: false, message: "No available copies" });
  }

  // Create book request with status 'Pending Approval' (no copies deducted yet)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const { error: insertError } = await supabase
    .from("book_requests")
    .insert([{
      request_id: "req_" + Date.now(),
      user_id: user.user_id,
      book_id: book_id,
      request_date: new Date().toISOString(),
      due_date: dueDate.toISOString().slice(0,10),
      status: "Pending Approval"  // status set here
    }]);

  if (insertError) {
    return res.status(500).json({ success: false, message: "Failed to create request" });
  }

  // Do NOT deduct available_copies here

  return res.status(201).json({ success: true, message: "Book request created and pending approval" });
});

module.exports = router;
