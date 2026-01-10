import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

function serialize(member: any) {
  if (!member) return member
  return { ...member, _id: member._id?.toString?.() ?? member._id }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const t0 = Date.now()
    const body = await request.json()
    const { id } = params
    console.log("[PUT /api/members/:id] start", { id, bodyKeys: Object.keys(body || {}) })

    const months = Number.parseInt(body.months)
    const expiryDate = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
    console.log("[PUT /api/members/:id] computed expiryDate:", expiryDate)

    const db = await getDb()
    console.log("[PUT /api/members/:id] connected to DB")
    const res = await db.collection("members").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...body, expiryDate } },
      { returnDocument: "after" }
    )

    if (!res) {
      console.warn("[PUT /api/members/:id] findOneAndUpdate returned empty result", { id })
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const updated = res.value
    if (!updated) {
      console.warn("[PUT /api/members/:id] no updated.value", { id })
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    console.log("[PUT /api/members/:id] success in", Date.now() - t0, "ms")
    return NextResponse.json(serialize(updated))
  } catch (error) {
    console.error("[PUT /api/members/:id] error:", error)
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    console.log("[DELETE /api/members/:id] start", { id })
    const db = await getDb()
    const res = await db.collection("members").deleteOne({ _id: new ObjectId(id) })
    if (res.deletedCount === 0) {
      console.warn("[DELETE /api/members/:id] not found", { id })
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }
    console.log("[DELETE /api/members/:id] success")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/members/:id] error:", error)
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 })
  }
}
