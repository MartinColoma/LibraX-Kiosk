import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Add relaxed Content Security Policy header middleware for development
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' http://localhost:3000 http://localhost:5173; connect-src 'self' ws://localhost:5173; script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  );
  next();
});

app.post("/ai-chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ response: "Prompt is required" });
    }

    const scriptPath = path.join(__dirname, "..", "backend", "LibraX_ChatBot", "ai", "libraX_Bot.py");

    const pythonProcess = spawn("python", [scriptPath]);
    let aiResponse = "";
    let errorResponse = "";

    pythonProcess.stdin.write(prompt);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on("data", (data) => {
      aiResponse += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorResponse += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (errorResponse) {
        console.warn("Python script stderr output:", errorResponse);
      }

      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        return res.status(500).json({ response: "Internal Server Error (Python chatbot failed)." });
      }

      if (!aiResponse) {
        return res.status(500).json({ response: "Internal Server Error (Empty chatbot response)." });
      }

      res.json({ response: aiResponse.trim() });
    });
  } catch (error) {
    console.error("Chatbot API error:", error);
    res.status(500).json({ response: "Internal Server Error (API)." });
  }
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
