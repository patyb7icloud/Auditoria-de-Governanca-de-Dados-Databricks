// First, authenticate by accessing dashboard, then test copilot
async function testCopilot() {
  const cookieJar = {};
  
  try {
    // Step 1: Visit dashboard to create session (with DEV_AUTO_LOGIN)
    console.log("Step 1: Creating session by visiting dashboard...");
    let response = await fetch("http://localhost:3000/dashboard/1", {
      redirect: "follow",
      headers: {
        "Cookie": Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join("; ")
      }
    });
    
    // Extract cookies from response
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      console.log("Cookies received from dashboard");
      const cookieParts = setCookie.split(";")[0].split("=");
      if (cookieParts.length === 2) {
        cookieJar[cookieParts[0]] = cookieParts[1];
      }
    }
    
    // Step 2: Make copilot request with session
    console.log("\nStep 2: Sending copilot question...");
    const payload = {
      host: "https://dbc-516436c3-b9dc.cloud.databricks.com",
      token: "dapi3c90775ad1d2ef75fdba80d9a56f59d5",
      catalog: "test_sistema",
      question: "Quais tabelas contêm dados sensíveis?"
    };
    
    response = await fetch("http://localhost:3000/api/trpc/copilot.ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": Object.entries(cookieJar).map(([k, v]) => `${k}=${v}`).join("; ")
      },
      body: JSON.stringify(payload),
    });
    
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response snippet:");
    console.log(text.substring(0, 500));
    
    if (text.includes("Cannot read properties")) {
      console.log("\n❌ ERROR: .map() error still present!");
    } else if (text.includes("sensível") || text.includes("dados")) {
      console.log("\n✅ SUCCESS: Response received!");
    } else if (response.status === 200 || response.status === 201) {
      console.log("\n✅ SUCCESS: Request accepted!");
    } else {
      console.log("\n⚠️ Need to check response");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testCopilot();
