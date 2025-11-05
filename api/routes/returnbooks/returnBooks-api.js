const express = require("express");
const { createClient } = require("@supabase/supabase-js");


const router = express.Router();


// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


// ===========================================
// GET /return-books/user-borrowed
// ===========================================
router.get("/user-borrowed", async (req, res) => {
  try {
    console.log("📚 GET /user-borrowed endpoint called");
    console.log("Query params:", req.query);


    let { user_id, nfc_uid, student_id } = req.query;


    if (student_id && student_id.includes(":")) student_id = student_id.split(":")[0];
    if (user_id && user_id.includes(":")) user_id = user_id.split(":")[0];


    if (!user_id && !nfc_uid && !student_id) {
      return res.status(400).json({
        success: false,
        message: "Missing user identifier (user_id, nfc_uid, or student_id)",
      });
    }


    let userQuery = supabase.from("users").select("user_id, first_name, last_name, student_faculty_id");


    if (user_id) userQuery = userQuery.eq("user_id", user_id);
    else if (nfc_uid) userQuery = userQuery.eq("nfc_uid", nfc_uid);
    else if (student_id) userQuery = userQuery.eq("student_faculty_id", student_id);


    const { data: user, error: userError } = await userQuery.single();
    if (userError || !user)
      return res.status(404).json({ success: false, message: "User not found" });


    const { data: borrowedBooks, error: booksError } = await supabase
      .from("borrowed_books")
      .select(`
        borrow_id,
        copy_id,
        book_id,
        borrow_date,
        due_date,
        status,
        fine_amount,
        books:book_id (
          title,
          subtitle,
          isbn,
          publisher,
          publication_year
        ),
        book_copies:copy_id (
          nfc_uid,
          book_condition,
          location
        )
      `)
      .eq("user_id", user.user_id)
      .in("status", ["Borrowed", "Overdue"])
      .order("borrow_date", { ascending: false });


    if (booksError)
      return res.status(500).json({
        success: false,
        message: "Failed to fetch borrowed books",
        error: booksError.message,
      });


    const today = new Date();
    const booksWithStatus = borrowedBooks.map((book) => {
      const dueDate = new Date(book.due_date);
      const isOverdue = dueDate < today;
      return {
        ...book,
        is_overdue: isOverdue,
        days_overdue: isOverdue ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)) : 0,
      };
    });


    res.status(200).json({
      success: true,
      user: {
        user_id: user.user_id,
        name: `${user.first_name} ${user.last_name}`,
        student_faculty_id: user.student_faculty_id,
      },
      borrowed_books: booksWithStatus,
      total_borrowed: booksWithStatus.length,
    });
  } catch (err) {
    console.error("❌ Get borrowed books error:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});


// ===========================================
// POST /return-books/request-scan
// ===========================================
router.post("/request-scan", async (req, res) => {
  try {
    const { sessionId, borrow_ids } = req.body;


    if (!sessionId || !borrow_ids || !Array.isArray(borrow_ids))
      return res.status(400).json({ success: false, message: "Missing sessionId or borrow_ids array" });


    const responseData = JSON.stringify({ borrow_ids, scan_type: "book_return" });


    const { data, error } = await supabase
      .from("scan_requests")
      .insert([{ session_id: sessionId, status: "pending", scan_type: "book_return", response: responseData }])
      .select();


    if (error)
      return res.status(500).json({ success: false, error: error.message });


    res.json({ success: true, requestId: data[0].id, request: data[0], borrow_ids });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ===========================================
// POST /return-books/scan-result
// ===========================================
router.post("/scan-result", async (req, res) => {
  try {
    const { requestId, nfc_uid } = req.body;
    if (!requestId || !nfc_uid)
      return res.status(400).json({ success: false, message: "Missing requestId or nfc_uid" });


    const numRequestId = parseInt(requestId, 10);


    const { data: scanRequest, error: scanError } = await supabase
      .from("scan_requests")
      .select("*")
      .eq("id", numRequestId)
      .eq("scan_type", "book_return")
      .limit(1)
      .maybeSingle();


    if (scanError || !scanRequest)
      return res.status(404).json({ success: false, message: "Scan request not found" });


    const responseData = JSON.parse(scanRequest.response || "{}");
    const borrow_ids = responseData.borrow_ids || [];


    const { data: bookCopy, error: copyError } = await supabase
      .from("book_copies")
      .select("copy_id, book_id, status")
      .eq("nfc_uid", nfc_uid)
      .limit(1)
      .maybeSingle();


    if (copyError || !bookCopy)
      return res.status(404).json({ success: false, message: "Book copy not found with this NFC UID" });


    const { data: borrowRecords, error: borrowError } = await supabase
      .from("borrowed_books")
      .select("*")
      .eq("copy_id", bookCopy.copy_id)
      .in("borrow_id", borrow_ids)
      .in("status", ["Borrowed", "Overdue"]);


    if (borrowError || !borrowRecords || borrowRecords.length === 0)
      return res.status(404).json({ success: false, message: "This book is not in your selected return list or already returned" });


    const borrowRecord = borrowRecords[0];


    // ✅ Update borrowed_books
    await supabase
      .from("borrowed_books")
      .update({
        status: "Returned",
        return_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("borrow_id", borrowRecord.borrow_id);


    // ✅ Update book_copies to Available
    await supabase
      .from("book_copies")
      .update({ status: "Available" })
      .eq("copy_id", bookCopy.copy_id);


    // ✅ Increment available_copies in books table
    const { error: incrementError } = await supabase.rpc("increment_available_copies", {
      target_book_id: bookCopy.book_id,
    });


    if (incrementError) {
      console.error("⚠️ Failed to increment available copies:", incrementError.message);
    }


    // ✅ Update scan_requests
    const remainingBorrowIds = borrow_ids.filter((id) => id !== borrowRecord.borrow_id);
    const updatedResponse = {
      ...responseData,
      returned_books: [...(responseData.returned_books || []), {
        borrow_id: borrowRecord.borrow_id,
        copy_id: bookCopy.copy_id,
        nfc_uid,
        returned_at: new Date().toISOString(),
      }],
      remaining_borrow_ids: remainingBorrowIds,
    };


    const newStatus = remainingBorrowIds.length === 0 ? "completed" : "pending";


    await supabase
      .from("scan_requests")
      .update({ status: newStatus, response: JSON.stringify(updatedResponse) })
      .eq("id", numRequestId);


    res.json({
      success: true,
      message: "Book returned successfully",
      returned_book: {
        borrow_id: borrowRecord.borrow_id,
        copy_id: bookCopy.copy_id,
        book_id: bookCopy.book_id,
      },
      remaining_books: remainingBorrowIds.length,
      all_books_returned: remainingBorrowIds.length === 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});


// ===========================================
// GET /return-books/scan-status
// ===========================================
router.get("/scan-status", async (req, res) => {
  try {
    const { requestId } = req.query;
    if (!requestId)
      return res.status(400).json({ success: false, message: "Missing requestId" });


    const numRequestId = parseInt(requestId, 10);


    const { data, error } = await supabase
      .from("scan_requests")
      .select("*")
      .eq("id", numRequestId)
      .eq("scan_type", "book_return")
      .limit(1)
      .maybeSingle();


    if (error || !data)
      return res.status(404).json({ success: false, message: "Scan request not found" });


    const responseData = JSON.parse(data.response || "{}");


    res.status(200).json({
      success: true,
      request: data,
      returned_books: responseData.returned_books || [],
      remaining_books: (responseData.remaining_borrow_ids || []).length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ===========================================
// POST /return-books/cancel-request
// ===========================================
router.post("/cancel-request", async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId)
      return res.status(400).json({ success: false, message: "Missing requestId" });


    const numRequestId = parseInt(requestId, 10);
    const { error } = await supabase
      .from("scan_requests")
      .delete()
      .eq("id", numRequestId)
      .eq("scan_type", "book_return");


    if (error)
      return res.status(500).json({ success: false, message: "Failed to cancel scan request" });


    res.status(200).json({ success: true, message: "Scan request cancelled" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ===========================================
// GET /return-books/get-pending-request
// ===========================================
router.get("/get-pending-request", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("scan_requests")
      .select("*")
      .eq("scan_type", "book_return")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();


    if (error || !data)
      return res.status(404).json({ success: false, message: "No pending requests" });


    res.json({ success: true, request: data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ===========================================
// GET /return-books/cleanup-old-requests
// ===========================================
router.get("/cleanup-old-requests", async (req, res) => {
  try {
    console.log("🕑 Starting cleanup of old scan requests...");

    // Calculate timestamp for 24 hours ago
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Delete scan requests older than 24 hours
    const { error } = await supabase
      .from("scan_requests")
      .delete()
      .eq("scan_type", "book_return")
      .lt("created_at", oneDayAgo);

    if (error) {
      console.error("❌ Cleanup error:", error.message);
      return res.status(500).json({ success: false, message: "Cleanup failed", error: error.message });
    }

    console.log("✅ Cleanup completed successfully - Deleted scan requests older than 24 hours");
    res.json({ success: true, message: "Old scan requests cleaned up successfully" });
  } catch (err) {
    console.error("❌ Cleanup error:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});


module.exports = router;