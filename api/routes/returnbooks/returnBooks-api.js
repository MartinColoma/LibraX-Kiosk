const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ===========================================
// GET /return-books/user-borrowed
// Get all borrowed books for a user
// ===========================================
router.get("/user-borrowed", async (req, res) => {
  try {
    console.log("📚 GET /user-borrowed endpoint called");
    console.log("Query params:", req.query);
    
    const { user_id, nfc_uid, student_id } = req.query;
    
    if (!user_id && !nfc_uid && !student_id) {
      console.log("❌ No user identifier provided");
      return res.status(400).json({ 
        success: false, 
        message: "Missing user identifier (user_id, nfc_uid, or student_id)" 
      });
    }

    // Find user first
    let userQuery = supabase.from("users").select("user_id, first_name, last_name, student_faculty_id");
    
    if (user_id) {
      console.log(`🔍 Searching by user_id: ${user_id}`);
      userQuery = userQuery.eq("user_id", user_id);
    }
    else if (nfc_uid) {
      console.log(`🔍 Searching by nfc_uid: ${nfc_uid}`);
      userQuery = userQuery.eq("nfc_uid", nfc_uid);
    }
    else if (student_id) {
      console.log(`🔍 Searching by student_id: ${student_id}`);
      userQuery = userQuery.eq("student_faculty_id", student_id);
    }

    const { data: user, error: userError } = await userQuery.single();
    
    if (userError || !user) {
      console.log("❌ User not found:", userError);
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    console.log("✅ User found:", user.user_id);

    // Get borrowed books with book details
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

    if (booksError) {
      console.error("❌ Error fetching borrowed books:", booksError);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch borrowed books",
        error: booksError.message
      });
    }

    console.log(`✅ Found ${borrowedBooks.length} borrowed books`);

    // Calculate overdue status
    const today = new Date();
    const booksWithStatus = borrowedBooks.map(book => {
      const dueDate = new Date(book.due_date);
      const isOverdue = dueDate < today;
      return {
        ...book,
        is_overdue: isOverdue,
        days_overdue: isOverdue ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)) : 0
      };
    });

    res.status(200).json({
      success: true,
      user: {
        user_id: user.user_id,
        name: `${user.first_name} ${user.last_name}`,
        student_faculty_id: user.student_faculty_id
      },
      borrowed_books: booksWithStatus,
      total_borrowed: booksWithStatus.length
    });
  } catch (err) {
    console.error("❌ Get borrowed books error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message
    });
  }
});

// ===========================================
// POST /return-books/request-scan
// Initiate book return scan request
// ===========================================
router.post("/request-scan", async (req, res) => {
  try {
    console.log("📚 POST /request-scan endpoint called");
    
    const { sessionId, borrow_ids } = req.body;
    
    if (!sessionId || !borrow_ids || !Array.isArray(borrow_ids)) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing sessionId or borrow_ids array" 
      });
    }

    console.log(`📝 Creating scan request for ${borrow_ids.length} books`);

    // Check for existing pending scan
    const { data: existing, error: existingError } = await supabase
      .from("scan_requests")
      .select("*")
      .eq("status", "pending")
      .eq("scan_type", "book_return")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (existing && !existingError) {
      return res.json({
        success: true,
        message: "Pending book return scan already exists",
        requestId: existing.id,
        request: existing
      });
    }

    // Create new scan request with borrow_ids in response
    const responseData = JSON.stringify({ 
      borrow_ids,
      scan_type: "book_return"
    });
    
    const { data, error } = await supabase
      .from("scan_requests")
      .insert([{ 
        session_id: sessionId, 
        status: "pending",
        scan_type: "book_return",
        response: responseData
      }])
      .select();

    if (error) {
      console.error("Failed to create scan request:", error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    console.log(`✅ Scan request created: ${data[0].id}`);

    res.json({ 
      success: true, 
      requestId: data[0].id, 
      request: data[0],
      borrow_ids 
    });
  } catch (err) {
    console.error("Request-scan error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ===========================================
// POST /return-books/scan-result
// Process scanned book NFC for return
// ===========================================
router.post("/scan-result", async (req, res) => {
  try {
    const { requestId, nfc_uid } = req.body;
    
    if (!requestId || !nfc_uid) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing requestId or nfc_uid" 
      });
    }

    // Get the scan request
    const { data: scanRequest, error: scanError } = await supabase
      .from("scan_requests")
      .select("*")
      .eq("id", requestId)
      .eq("scan_type", "book_return")
      .single();

    if (scanError || !scanRequest) {
      return res.status(404).json({ 
        success: false, 
        message: "Scan request not found" 
      });
    }

    const responseData = JSON.parse(scanRequest.response || '{}');
    const borrow_ids = responseData.borrow_ids || [];

    if (borrow_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No books selected for return" 
      });
    }

    // Find the book copy by NFC UID
    const { data: bookCopy, error: copyError } = await supabase
      .from("book_copies")
      .select("copy_id, book_id, status")
      .eq("nfc_uid", nfc_uid)
      .single();

    if (copyError || !bookCopy) {
      return res.status(404).json({ 
        success: false, 
        message: "Book copy not found with this NFC UID" 
      });
    }

    // Check if this copy is in the selected books to return
    const { data: borrowRecord, error: borrowError } = await supabase
      .from("borrowed_books")
      .select("*")
      .eq("copy_id", bookCopy.copy_id)
      .in("borrow_id", borrow_ids)
      .in("status", ["Borrowed", "Overdue"])
      .single();

    if (borrowError || !borrowRecord) {
      return res.status(404).json({ 
        success: false, 
        message: "This book is not in your selected return list or already returned" 
      });
    }

    // Update the borrowed_books record
    const { error: updateError } = await supabase
      .from("borrowed_books")
      .update({
        status: "Returned",
        return_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("borrow_id", borrowRecord.borrow_id);

    if (updateError) {
      console.error("Failed to update borrow record:", updateError);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to process book return" 
      });
    }

    // Update book_copies status to Available
    await supabase
      .from("book_copies")
      .update({ status: "Available" })
      .eq("copy_id", bookCopy.copy_id);

    // Update available_copies count in books table
    await supabase.rpc('increment_available_copies', { 
      book_id_param: bookCopy.book_id 
    }).catch(err => console.warn("RPC call optional:", err));

    // Get updated list of remaining books to return
    const remainingBorrowIds = borrow_ids.filter(id => id !== borrowRecord.borrow_id);
    
    // Update scan request
    const updatedResponse = {
      ...responseData,
      returned_books: [...(responseData.returned_books || []), {
        borrow_id: borrowRecord.borrow_id,
        copy_id: bookCopy.copy_id,
        nfc_uid: nfc_uid,
        returned_at: new Date().toISOString()
      }],
      remaining_borrow_ids: remainingBorrowIds
    };

    const newStatus = remainingBorrowIds.length === 0 ? "completed" : "pending";

    await supabase
      .from("scan_requests")
      .update({
        status: newStatus,
        response: JSON.stringify(updatedResponse)
      })
      .eq("id", requestId);

    res.json({ 
      success: true, 
      message: "Book returned successfully",
      returned_book: {
        borrow_id: borrowRecord.borrow_id,
        copy_id: bookCopy.copy_id,
        book_id: bookCopy.book_id
      },
      remaining_books: remainingBorrowIds.length,
      all_books_returned: remainingBorrowIds.length === 0
    });
  } catch (err) {
    console.error("Scan-result error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ===========================================
// GET /return-books/scan-status
// Check the status of a return scan request
// ===========================================
router.get("/scan-status", async (req, res) => {
  try {
    const { requestId } = req.query;
    
    if (!requestId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing requestId" 
      });
    }

    const { data, error } = await supabase
      .from("scan_requests")
      .select("*")
      .eq("id", requestId)
      .eq("scan_type", "book_return")
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        message: "Scan request not found" 
      });
    }

    const responseData = JSON.parse(data.response || '{}');

    res.status(200).json({ 
      success: true, 
      request: data,
      returned_books: responseData.returned_books || [],
      remaining_books: (responseData.remaining_borrow_ids || []).length
    });
  } catch (err) {
    console.error("Scan status error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// ===========================================
// POST /return-books/cancel-request
// Cancel a book return scan request
// ===========================================
router.post("/cancel-request", async (req, res) => {
  try {
    const { requestId } = req.body;
    
    if (!requestId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing requestId" 
      });
    }

    const { error } = await supabase
      .from("scan_requests")
      .delete()
      .eq("id", requestId)
      .eq("scan_type", "book_return");

    if (error) {
      console.error("Failed to cancel request:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to cancel scan request" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Scan request cancelled" 
    });
  } catch (err) {
    console.error("Cancel request error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// Add this AFTER the existing POST /books/request endpoint

// ==================== GET USER BORROWED BOOKS ====================
router.get("/user-borrowed", async (req, res) => {
  try {
    const { user_id, student_id } = req.query;
    
    if (!user_id && !student_id) {
      return res.status(400).json({ 
        success: false, 
        message: "user_id or student_id required" 
      });
    }

    let query = supabase
      .from("borrowing_records")
      .select(`
        borrow_id,
        copy_id,
        book_id,
        borrow_date,
        due_date,
        status,
        fine_amount,
        is_overdue,
        days_overdue,
        books(title, subtitle, isbn, publisher, publication_year),
        book_copies(nfc_uid, book_condition, location),
        users(user_id, name, student_faculty_id)
      `)
      .eq("status", "Borrowed");

    if (user_id) {
      query = query.eq("user_id", user_id);
    } else if (student_id) {
      // First find user by student_id, then get borrowing records
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("user_id, name, student_faculty_id")
        .eq("student_faculty_id", student_id)
        .single();

      if (userError || !userData) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      query = query.eq("user_id", userData.user_id);
    }

    const { data: borrowedBooks, error: booksError } = await query;

    if (booksError) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch borrowed books",
        error: booksError.message 
      });
    }

    // Extract unique user info
    const user = borrowedBooks[0]?.users || null;
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    return res.status(200).json({ 
      success: true, 
      user: {
        user_id: user.user_id,
        name: user.name,
        student_faculty_id: user.student_faculty_id
      },
      borrowed_books: borrowedBooks 
    });
  } catch (error) {
    console.error("Error fetching borrowed books:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

// In-memory storage for scan requests (consider using Redis in production)
const scanRequests = {};
let requestIdCounter = 1;

// ==================== REQUEST SCAN SESSION ====================
router.post("/request-scan", async (req, res) => {
  try {
    const { sessionId, borrow_ids } = req.body;

    if (!sessionId || !borrow_ids || borrow_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "sessionId and borrow_ids required" 
      });
    }

    const requestId = requestIdCounter++;
    scanRequests[requestId] = {
      sessionId,
      borrow_ids,
      status: "pending",
      scanned_books: [],
      response: null,
      createdAt: new Date()
    };

    return res.status(200).json({ 
      success: true, 
      requestId 
    });
  } catch (error) {
    console.error("Error requesting scan:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to create scan request" 
    });
  }
});

// ==================== SCAN STATUS ====================
router.get("/scan-status", async (req, res) => {
  try {
    const { requestId } = req.query;

    if (!requestId || !scanRequests[requestId]) {
      return res.status(404).json({ 
        success: false, 
        message: "Request not found" 
      });
    }

    const request = scanRequests[requestId];

    // Check if all books have been scanned
    const remainingBooks = request.borrow_ids.length - request.scanned_books.length;

    return res.status(200).json({ 
      success: true, 
      request,
      returned_books: request.scanned_books,
      remaining_books: remainingBooks
    });
  } catch (error) {
    console.error("Error getting scan status:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to get scan status" 
    });
  }
});

// ==================== CANCEL REQUEST ====================
router.post("/cancel-request", async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId || !scanRequests[requestId]) {
      return res.status(404).json({ 
        success: false, 
        message: "Request not found" 
      });
    }

    delete scanRequests[requestId];

    return res.status(200).json({ 
      success: true, 
      message: "Request cancelled" 
    });
  } catch (error) {
    console.error("Error cancelling request:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to cancel request" 
    });
  }
});

// ==================== PROCESS BOOK RETURN (from ESP32) ====================
router.post("/process-return", async (req, res) => {
  try {
    const { requestId, nfc_uid } = req.body;

    if (!requestId || !nfc_uid) {
      return res.status(400).json({ 
        success: false, 
        message: "requestId and nfc_uid required" 
      });
    }

    if (!scanRequests[requestId]) {
      return res.status(404).json({ 
        success: false, 
        message: "Request not found" 
      });
    }

    const request = scanRequests[requestId];

    // Find the book copy by NFC UID
    const { data: bookCopy, error: copyError } = await supabase
      .from("book_copies")
      .select("copy_id, book_id")
      .eq("nfc_uid", nfc_uid)
      .single();

    if (copyError || !bookCopy) {
      return res.status(404).json({ 
        success: false, 
        message: "Book not found" 
      });
    }

    // Find the corresponding borrow record
    const { data: borrowRecord, error: borrowError } = await supabase
      .from("borrowing_records")
      .select("borrow_id, user_id, copy_id")
      .eq("copy_id", bookCopy.copy_id)
      .in("borrow_id", request.borrow_ids)
      .eq("status", "Borrowed")
      .single();

    if (borrowError || !borrowRecord) {
      return res.status(404).json({ 
        success: false, 
        message: "Borrow record not found" 
      });
    }

    // Update borrow status to "Returned"
    const { error: updateError } = await supabase
      .from("borrowing_records")
      .update({ 
        status: "Returned",
        actual_return_date: new Date().toISOString()
      })
      .eq("borrow_id", borrowRecord.borrow_id);

    if (updateError) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to update borrow status" 
      });
    }

    // Add to scanned books
    if (!request.scanned_books.includes(borrowRecord.borrow_id)) {
      request.scanned_books.push(borrowRecord.borrow_id);
    }

    const remainingBooks = request.borrow_ids.length - request.scanned_books.length;

    return res.status(200).json({ 
      success: true, 
      message: "Book returned successfully",
      remaining_books: remainingBooks,
      borrow_id: borrowRecord.borrow_id
    });
  } catch (error) {
    console.error("Error processing return:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to process return" 
    });
  }
});


module.exports = router;