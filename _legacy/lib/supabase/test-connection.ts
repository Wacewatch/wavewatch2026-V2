/**
 * Test Supabase connection with direct HTTP requests to see the actual error
 */
export async function testSupabaseConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return {
      success: false,
      error: "Missing environment variables",
      details: {
        hasUrl: !!url,
        hasKey: !!key,
      },
    }
  }

  try {
    console.log("[v0] Testing direct HTTP connection to Supabase...")
    console.log("[v0] URL:", url)
    console.log("[v0] Key length:", key.length)

    // Test avec une requête REST directe
    const response = await fetch(`${url}/rest/v1/tv_channels?select=id&limit=1`, {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    })

    console.log("[v0] HTTP Response status:", response.status)
    console.log("[v0] HTTP Response headers:", Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log("[v0] Raw response body:", responseText)

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: {
          status: response.status,
          body: responseText,
          headers: Object.fromEntries(response.headers.entries()),
        },
      }
    }

    try {
      const data = JSON.parse(responseText)
      return {
        success: true,
        message: "Connection successful",
        data,
      }
    } catch (jsonError) {
      return {
        success: false,
        error: "Invalid JSON response",
        details: {
          body: responseText,
          jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError),
        },
      }
    }
  } catch (error) {
    console.error("[v0] Test connection failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: error,
    }
  }
}
