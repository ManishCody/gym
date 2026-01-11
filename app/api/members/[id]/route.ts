import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId, type WithId, type Document } from "mongodb"

function serialize<T extends { _id: unknown }>(member: WithId<Document> | null): T | null {
  if (!member) return null
  return { ...member, _id: member._id.toString() } as unknown as T
}


export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const t0 = Date.now()
    const { id } = await context.params
    const body = await request.json()

    console.log("[PUT /api/members/:id] start", { id })

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const months = Number(body.months)
    const expiryDate = new Date(
      Date.now() + months * 30 * 24 * 60 * 60 * 1000
    ).toISOString()

    const db = await getDb()

    console.log('[PUT /api/members/:id] Updating member with ID:', id)
    console.log('[PUT /api/members/:id] Update data:', { ...body, expiryDate })

    // First, try to find the member to verify it exists
    const existingMember = await db.collection("members").findOne({ _id: new ObjectId(id) })
    console.log('[PUT /api/members/:id] Found member:', existingMember?._id)

    if (!existingMember) {
      console.warn('[PUT /api/members/:id] Member not found with ID:', id)
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    console.log('[PUT /api/members/:id] Attempting update with data:', {
      filter: { _id: new ObjectId(id) },
      update: { $set: { ...body, expiryDate } },
      options: { returnDocument: "after" as const }
    })
    
    const updateData = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      fee: body.fee,
      months: body.months,
      photoUrl: body.photoUrl,
      expiryDate: expiryDate
    }
    
    console.log('[PUT /api/members/:id] Update operation:', {
      filter: { _id: new ObjectId(id) },
      update: { $set: updateData },
      options: { returnDocument: 'after' }
    })
    
    // First try to update the document
    const updateResult = await db.collection("members").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )
    
    console.log('[PUT /api/members/:id] Update result:', updateResult)

    if (updateResult.matchedCount === 0) {
      console.error('[PUT /api/members/:id] Update failed - No document found')
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (updateResult.modifiedCount === 0) {
      console.log('[PUT /api/members/:id] No changes made to the document')
      // Still return success but indicate no changes were made
      const updatedMember = await db.collection("members").findOne({ _id: new ObjectId(id) })
      if (!updatedMember) {
        return NextResponse.json({ error: "Member not found after update" }, { status: 404 })
      }
      return NextResponse.json(serialize(updatedMember))
    }

    // Fetch the updated document
    const updatedMember = await db.collection("members").findOne({ _id: new ObjectId(id) })
    if (!updatedMember) {
      return NextResponse.json({ error: "Failed to fetch updated member" }, { status: 500 })
    }
    
    console.log("[PUT /api/members/:id] success in", Date.now() - t0, "ms")
    return NextResponse.json(serialize(updatedMember))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[PUT /api/members/:id] Error during update:', error)
    return NextResponse.json(
      { error: `Failed to update member: ${errorMessage}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params   // ✅ FIX

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const db = await getDb()
    const res = await db
      .collection("members")
      .deleteOne({ _id: new ObjectId(id) })

    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/members/:id] error:", error)
    return NextResponse.json({ error: "Failed to delete member" }, { status: 500 })
  }
}
