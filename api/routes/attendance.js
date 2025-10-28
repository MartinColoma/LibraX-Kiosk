import express from "express";
const router = express.Router();

// GET /attendance
router.get("/", (req, res) => {
  res.json({ message: "Attendance list" });
});

// POST /attendance/record
router.post("/record", (req, res) => {
  const { userId } = req.body;
  res.json({ message: `Recorded attendance for user ${userId}` });
});

export default router;
