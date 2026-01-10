import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { password } = body || {}

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    if (!ADMIN_PASSWORD) {
      console.warn("[POST /api/login] ADMIN_PASSWORD is not set in environment")
      return NextResponse.json({ error: "Server auth not configured" }, { status: 500 })
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    if (password === ADMIN_PASSWORD) {
      // Generate a simple opaque token (sufficient for current localStorage use)
      const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      return NextResponse.json({ token })
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  } catch (error) {
    console.error("[POST /api/login] error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
