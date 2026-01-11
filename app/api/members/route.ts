import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

function serialize(member: any) {
  if (!member) return member
  return { ...member, _id: member._id?.toString?.() ?? member._id }
}

export async function GET() {
  try {
    const t0 = Date.now()
    console.log("[GET /api/members] start")
    const db = await getDb()
    console.log("[GET /api/members] connected to DB")
    const docs = await db.collection("members").find({}).sort({ _id: -1 }).toArray()
    console.log(`"[GET /api/members] fetched ${docs.length} docs in ${Date.now() - t0}ms`)
    const data = docs.map(serialize)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[GET /api/members] error:", error)
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const t0 = Date.now()
    console.log("[POST /api/members] start")
    const body = await request.json()
    console.log("[POST /api/members] body keys:", Object.keys(body || {}))
    const months = Number.parseInt(body.months)
    // Normalize joinDate to start of day UTC and compute expiry using calendar months
    const join = body.joinDate ? new Date(body.joinDate) : new Date()
    const joinUtc = new Date(Date.UTC(join.getUTCFullYear(), join.getUTCMonth(), join.getUTCDate(), 0, 0, 0, 0))
    const addMonths = (d: Date, m: number) => {
      const year = d.getUTCFullYear()
      const month = d.getUTCMonth()
      const day = d.getUTCDate()
      const targetMonth = month + m
      const targetDate = new Date(Date.UTC(year, targetMonth, 1))
      // set date to min(original day, last day of target month)
      const lastDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth() + 1, 0)).getUTCDate()
      targetDate.setUTCDate(Math.min(day, lastDay))
      return targetDate
    }
    const expiryDate = addMonths(joinUtc, months).toISOString()
    console.log("[POST /api/members] computed joinDate:", joinUtc.toISOString(), "expiryDate:", expiryDate)

    const doc = { ...body, joinDate: joinUtc.toISOString(), expiryDate }
    const db = await getDb()
    console.log("[POST /api/members] connected to DB")
    const res = await db.collection("members").insertOne(doc)
    console.log("[POST /api/members] insertedId:", res.insertedId?.toString?.(), `in ${Date.now() - t0}ms`)
    const created = serialize({ _id: res.insertedId, ...doc })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error("[POST /api/members] error:", error)
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 })
  }
}
