const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const router = express.Router();

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ===========================================
// GET /cleanup/device-logs
// ===========================================
router.get("/device-logs", async (req, res) => {
  try {
    console.log("🕑 Starting cleanup of device logs...");

    // Calculate timestamps
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Delete checking logs older than 10 minutes
    const { error: checkingError } = await supabase
      .from("device_logs")
      .delete()
      .lt("created_at", tenMinsAgo)
      .ilike("log_message", "%🔄 Checking for incoming scan request%");

    if (checkingError) {
      console.error("❌ Checking logs cleanup error:", checkingError.message);
    } else {
      console.log("✅ Checking logs cleaned (older than 10 minutes)");
    }

    // Delete non-error logs older than 3 days
    const { error: nonErrorError } = await supabase
      .from("device_logs")
      .delete()
      .lt("created_at", threeDaysAgo)
      .not("log_message", "ilike", "%❌%");

    if (nonErrorError) {
      console.error("❌ Non-error logs cleanup error:", nonErrorError.message);
    } else {
      console.log("✅ Non-error logs cleaned (older than 3 days)");
    }

    // Delete error logs older than 7 days
    const { error: errorLogsError } = await supabase
      .from("device_logs")
      .delete()
      .lt("created_at", sevenDaysAgo)
      .ilike("log_message", "%❌%");

    if (errorLogsError) {
      console.error("❌ Error logs cleanup error:", errorLogsError.message);
    } else {
      console.log("✅ Error logs cleaned (older than 7 days)");
    }

    if (checkingError || nonErrorError || errorLogsError) {
      return res.status(500).json({ 
        success: false, 
        message: "Partial cleanup failed", 
        errors: { 
          checkingError: checkingError?.message, 
          nonErrorError: nonErrorError?.message,
          errorLogsError: errorLogsError?.message 
        } 
      });
    }

    console.log("✅ Device logs cleanup completed successfully");
    res.json({ 
      success: true, 
      message: "Device logs cleaned up successfully",
      details: {
        checking_logs: "Deleted (older than 10 minutes)",
        non_error_logs: "Deleted (older than 3 days)",
        error_logs: "Deleted (older than 7 days)"
      }
    });
  } catch (err) {
    console.error("❌ Device logs cleanup error:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ===========================================
// GET /cleanup/scan-requests
// ===========================================
router.get("/scan-requests", async (req, res) => {
  try {
    console.log("🕑 Starting cleanup of old scan requests...");

    // Calculate timestamp for 24 hours ago
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Delete scan requests older than 24 hours
    const { error } = await supabase
      .from("scan_requests")
      .delete()
      .lt("created_at", oneDayAgo);

    if (error) {
      console.error("❌ Scan requests cleanup error:", error.message);
      return res.status(500).json({ success: false, message: "Cleanup failed", error: error.message });
    }

    console.log("✅ Scan requests cleanup completed successfully - Deleted requests older than 24 hours");
    res.json({ success: true, message: "Old scan requests cleaned up successfully" });
  } catch (err) {
    console.error("❌ Scan requests cleanup error:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ===========================================
// GET /cleanup/all
// ===========================================
router.get("/all", async (req, res) => {
  try {
    console.log("🕑 Starting cleanup of all old data...");

    // Calculate timestamps
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Delete checking logs older than 10 minutes
    const { error: checkingError } = await supabase
      .from("device_logs")
      .delete()
      .lt("created_at", tenMinsAgo)
      .ilike("log_message", "%🔄 Checking for incoming scan request%");

    // Delete non-error device logs older than 3 days
    const { error: nonErrorError } = await supabase
      .from("device_logs")
      .delete()
      .lt("created_at", threeDaysAgo)
      .not("log_message", "ilike", "%❌%");

    // Delete error logs older than 7 days
    const { error: errorLogsError } = await supabase
      .from("device_logs")
      .delete()
      .lt("created_at", sevenDaysAgo)
      .ilike("log_message", "%❌%");

    // Delete scan requests older than 24 hours
    const { error: requestsError } = await supabase
      .from("scan_requests")
      .delete()
      .lt("created_at", oneDayAgo);

    if (checkingError) {
      console.error("❌ Checking logs cleanup error:", checkingError.message);
    }
    if (nonErrorError) {
      console.error("❌ Non-error logs cleanup error:", nonErrorError.message);
    }
    if (errorLogsError) {
      console.error("❌ Error logs cleanup error:", errorLogsError.message);
    }
    if (requestsError) {
      console.error("❌ Scan requests cleanup error:", requestsError.message);
    }

    if (checkingError || nonErrorError || errorLogsError || requestsError) {
      return res.status(500).json({ 
        success: false, 
        message: "Partial cleanup failed", 
        errors: { 
          checkingError: checkingError?.message, 
          nonErrorError: nonErrorError?.message,
          errorLogsError: errorLogsError?.message,
          requestsError: requestsError?.message 
        } 
      });
    }

    console.log("✅ All cleanup completed successfully");
    res.json({ 
      success: true, 
      message: "All old data cleaned up successfully",
      details: {
        checking_logs: "Deleted (older than 10 minutes)",
        non_error_logs: "Deleted (older than 3 days)",
        error_logs: "Deleted (older than 7 days)",
        scan_requests: "Deleted (older than 24 hours)"
      }
    });
  } catch (err) {
    console.error("❌ Cleanup error:", err.message);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;