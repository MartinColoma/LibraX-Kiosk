import express from "express";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import attendanceRoutes from "./routes/attendance.js";
import usersRoutes from "./routes/users.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/attendance", attendanceRoutes);
app.use("/users", usersRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "LibraX-Kiosk API running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
