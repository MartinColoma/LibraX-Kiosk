const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const attendanceRouter = require("./routes/PatronAttendance/attendance");
const opacSearchRouter = require("./routes/OPAC/opacSearch");
const bookRequestRouter = require("./routes/bookrequests/bookRequests");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS setup
const corsOptions = {
  origin: [
    "http://localhost:5173",               // dev frontend
    "https://librax-kiosk.onrender.com"    // production frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight requests

// Routes
app.use("/attendance", attendanceRouter);
app.use("/opac", opacSearchRouter);
app.use("/books", bookRequestRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "LibraX-Kiosk API running on Render" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📡 CORS enabled for: http://localhost:5173, https://librax-kiosk.onrender.com`);
});