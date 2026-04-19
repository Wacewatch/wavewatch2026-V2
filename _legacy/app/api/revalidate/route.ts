import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path")

    if (!path) {
      return NextResponse.json({ error: "Missing path parameter" }, { status: 400 })
    }

    // Revalidate the specified path
    revalidatePath(path)

    return NextResponse.json({ revalidated: true, path, now: Date.now() })
  } catch (error) {
    console.error("Error revalidating:", error)
    return NextResponse.json({ error: "Error revalidating" }, { status: 500 })
  }
}
