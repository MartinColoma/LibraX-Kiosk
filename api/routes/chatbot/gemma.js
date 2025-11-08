const { init } = require("@heyputer/puter.js/src/init.cjs");

// You'll need your Puter auth token
// Get it from: https://puter.com/app/dev-center (look for API tokens)
const authToken = "YOUR_PUTER_AUTH_TOKEN_HERE";

const puter = init(authToken);

async function deployWorker() {
  try {
    console.log("Deploying worker...");
    
    const result = await puter.workers.create(
      "librax-chatbot",
      "/Earlypearly/Desktop/gemma.js"
    );
    
    console.log("✅ Worker deployed successfully!");
    console.log("Worker URL:", result.url);
    console.log("Full result:", result);
  } catch (error) {
    console.error("❌ Error deploying worker:", error.message);
    console.error("Full error:", error);
  }
}

deployWorker();