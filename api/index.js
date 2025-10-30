const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const attendanceRouter = require("./routes/PatronAttendance/attendance"); 
const opacSearchRouter = require("./routes/opacSearch");
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
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight requests

// Routes
app.use("/attendance", attendanceRouter);
app.use("/opac", opacSearchRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "LibraX-Kiosk API running on Render" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
