// Test Copilot after fixes using proper tRPC format

async function testCopilot() {
  try {
    // First, we need to get a session cookie by accessing the dashboard
    // In dev mode with DEV_AUTO_LOGIN, a session should be created automatically

    const tRPCUrl = "http://localhost:3000/api/trpc/copilot.ask";
    
    // tRPC mutation format
    const payload = {
      host: "https://dbc-516436c3-b9dc.cloud.databricks.com",
      token: "dapi3c90775ad1d2ef75fdba80d9a56f59d5",
      catalog: "test_sistema",
      question: "Quais tabelas contêm dados sensíveis?"
    };

    console.log("Enviando pergunta ao Copilot...");
    console.log("URL:", tRPCUrl);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(tRPCUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("\nStatus:", response.status);
    console.log("Response:");
    console.log(text);

    // Check for error
    if (text.includes("Cannot read properties")) {
      console.log("\n❌ ERROR: .map() error still present!");
    } else if (text.includes("sensível") || text.includes("dados")) {
      console.log("\n✅ SUCCESS: Response received!");
    } else if (response.status === 200) {
      console.log("\n✅ SUCCESS: 200 response!");
    } else {
      console.log("\n⚠️  Check response above");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testCopilot();
