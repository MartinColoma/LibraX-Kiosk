const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ===== Helper: Generate UUID =====
function generateId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===== POST /books/request - Request a book =====
router.post("/request", async (req, res) => {
  try {
    const { user_id, book_id } = req.body;

    if (!user_id || !book_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing user_id or book_id" 
      });
    }

    // Verify user exists
    const userResult = await supabase
      .from("users")
      .select("user_id, first_name, last_name, email, phone_number, student_faculty_id, address")
      .eq("user_id", user_id)
      .single();

    if (userResult.error || !userResult.data) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Verify book exists and has available copies
    const bookResult = await supabase
      .from("books")
      .select("book_id, title, available_copies, total_copies")
      .eq("book_id", book_id)
      .single();

    if (bookResult.error || !bookResult.data) {
      return res.status(404).json({ 
        success: false, 
        message: "Book not found" 
      });
    }

    if (bookResult.data.available_copies <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No copies available for this book" 
      });
    }

    // Get an available copy
    const copyResult = await supabase
      .from("book_copies")
      .select("copy_id")
      .eq("book_id", book_id)
      .eq("status", "Available")
      .limit(1)
      .single();

    const copy_id = copyResult.data ? copyResult.data.copy_id : null;

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create request
    const requestId = generateId();
    const insertResult = await supabase
      .from("book_requests")
      .insert([{
        request_id: requestId,
        user_id: user_id,
        book_id: book_id,
        copy_id: copy_id,
        due_date: dueDate.toISOString().split('T')[0],
        status: "Pending"
      }])
      .select();

    if (insertResult.error) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to create request" 
      });
    }

    // Update available copies
    await supabase
      .from("books")
      .update({ available_copies: bookResult.data.available_copies - 1 })
      .eq("book_id", book_id);

    // Mark copy as reserved
    if (copy_id) {
      await supabase
        .from("book_copies")
        .update({ status: "Reserved" })
        .eq("copy_id", copy_id);
    }

    return res.status(201).json({ 
      success: true, 
      message: "Book request created successfully",
      request: {
        request_id: requestId,
        user: userResult.data,
        book: bookResult.data,
        due_date: dueDate.toISOString().split('T')[0],
        status: "Pending"
      }
    });

  } catch (err) {
    console.error("Book request error:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ===== GET /books/request/:requestId - Get request details =====
router.get("/request/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;

    const result = await supabase
      .from("book_requests")
      .select(`
        request_id,
        user_id,
        book_id,
        copy_id,
        request_date,
        due_date,
        status,
        remarks
      `)
      .eq("request_id", requestId)
      .single();

    if (result.error || !result.data) {
      return res.status(404).json({ 
        success: false, 
        message: "Request not found" 
      });
    }

    // Get user details
    const userResult = await supabase
      .from("users")
      .select("user_id, first_name, last_name, email, phone_number, student_faculty_id, address")
      .eq("user_id", result.data.user_id)
      .single();

    // Get book details
    const bookResult = await supabase
      .from("books")
      .select("book_id, title, isbn, publisher, genre:categories(category_name)")
      .eq("book_id", result.data.book_id)
      .single();

    return res.status(200).json({ 
      success: true, 
      request: result.data,
      user: userResult.data,
      book: bookResult.data
    });

  } catch (err) {
    console.error("Get request error:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ===== POST /books/request/:requestId/approve - Approve a request =====
router.post("/request/:requestId/approve", async (req, res) => {
  try {
    const { requestId } = req.params;

    const updateResult = await supabase
      .from("book_requests")
      .update({ status: "Approved" })
      .eq("request_id", requestId)
      .select();

    if (updateResult.error) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to approve request" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Request approved",
      request: updateResult.data[0]
    });

  } catch (err) {
    console.error("Approve request error:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ===== POST /books/request/:requestId/reject - Reject a request =====
router.post("/request/:requestId/reject", async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get request details first to update book availability
    const getResult = await supabase
      .from("book_requests")
      .select("book_id, copy_id")
      .eq("request_id", requestId)
      .single();

    if (getResult.data) {
      // Update book available copies
      const bookResult = await supabase
        .from("books")
        .select("available_copies")
        .eq("book_id", getResult.data.book_id)
        .single();

      if (bookResult.data) {
        await supabase
          .from("books")
          .update({ available_copies: bookResult.data.available_copies + 1 })
          .eq("book_id", getResult.data.book_id);
      }

      // Release the copy
      if (getResult.data.copy_id) {
        await supabase
          .from("book_copies")
          .update({ status: "Available" })
          .eq("copy_id", getResult.data.copy_id);
      }
    }

    // Update request status
    const updateResult = await supabase
      .from("book_requests")
      .update({ status: "Rejected" })
      .eq("request_id", requestId)
      .select();

    if (updateResult.error) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to reject request" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Request rejected",
      request: updateResult.data[0]
    });

  } catch (err) {
    console.error("Reject request error:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

module.exports = router;
