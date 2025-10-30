import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Optional: for local dev with Vite frontend
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' http://localhost:3000 http://localhost:5173; connect-src 'self' ws://localhost:5173; script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  );
  next();
});

// 🧠 AI Chat endpoint
app.post("/ai-chat", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ response: "Prompt is required" });

    const scriptPath = path.join(
      __dirname,
      "..",
      "backend",
      "LibraX_ChatBot",
      "ai",
      "libraX_Bot.py"
    );

    const pythonProcess = spawn("python", [scriptPath]);
    let stdoutData = "";
    let stderrData = "";

    // ✅ Write prompt to Python stdin
    pythonProcess.stdin.write(prompt);
    pythonProcess.stdin.end();

    // ✅ Collect stdout and stderr
    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (stderrData.trim()) {
        console.log("🐍 Python Debug:\n", stderrData);
      }

      if (code !== 0) {
        console.error(`Python exited with code ${code}`);
        return res
          .status(500)
          .json({ response: "Internal Server Error (Python failed)" });
      }

      // 🧩 Filter out any debug lines if Python accidentally prints something
      const cleanResponse = stdoutData
        .split("\n")
        .filter(
          (line) =>
            !line.trim().startsWith("DEBUG") &&
            !line.trim().startsWith("Traceback") &&
            !line.trim().startsWith("File")
        )
        .join("\n")
        .trim();

      if (!cleanResponse) {
        return res
          .status(500)
          .json({ response: "Empty response from chatbot." });
      }

      res.json({ response: cleanResponse });
    });
  } catch (err) {
    console.error("Chatbot API error:", err);
    res.status(500).json({ response: "Internal Server Error (API)." });
  }
});

app.listen(port, () => {
  console.log(`✅ API server running at http://localhost:${port}`);
});
