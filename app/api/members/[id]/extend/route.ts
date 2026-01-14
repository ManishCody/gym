import { NextResponse, type NextRequest } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

function addMonthsUTC(start: Date, months: number) {
  const year = start.getUTCFullYear()
  const month = start.getUTCMonth()
  const day = start.getUTCDate()
  const targetMonth = month + months
  const targetDate = new Date(Date.UTC(year, targetMonth, 1))
  const lastDay = new Date(Date.UTC(targetDate.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate()
  targetDate.setUTCDate(Math.min(day, lastDay))
  return targetDate
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const body = await request.json()
    const months = Number.parseInt(body.months)
    const totalFee = Number.parseFloat(body.totalFee)
    if (!months || months <= 0) {
      return NextResponse.json({ error: "Invalid months" }, { status: 400 })
    }
    if (!Number.isFinite(totalFee) || totalFee < 0) {
      return NextResponse.json({ error: "Invalid totalFee" }, { status: 400 })
    }

    const db = await getDb()
    const member = await db.collection("members").findOne({ _id: new ObjectId(id) })
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Guard: only one upcoming period allowed
    if (member.nextPeriod) {
      return NextResponse.json({ error: "Upcoming subscription already exists" }, { status: 409 })
    }

    const inrPerMonth = months > 0 ? totalFee / months : 0

    // Base start = current expiry (UTC start of that date)
    const prevExpiry = member.expiryDate ? new Date(member.expiryDate) : new Date()
    const joinUtc = new Date(Date.UTC(
      prevExpiry.getUTCFullYear(),
      prevExpiry.getUTCMonth(),
      prevExpiry.getUTCDate(),
      0, 0, 0, 0
    ))

    const expiryDate = addMonthsUTC(joinUtc, months).toISOString()

    const nextPeriod = {
      joinDate: joinUtc.toISOString(),
      expiryDate,
      months,
      fee: inrPerMonth,
    }

    await db.collection("members").updateOne(
      { _id: new ObjectId(id) },
      { $set: { nextPeriod } }
    )

    const updated = await db.collection("members").findOne({ _id: new ObjectId(id) })
    return NextResponse.json({ ...updated, _id: updated?._id?.toString?.() ?? updated?._id })
  } catch (error) {
    console.error("[POST /api/members/:id/extend] error:", error)
    return NextResponse.json({ error: "Failed to extend subscription" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const body = await request.json()
    const months = Number.parseInt(body.months)
    const totalFee = Number.parseFloat(body.totalFee)
    if (!months || months <= 0) {
      return NextResponse.json({ error: "Invalid months" }, { status: 400 })
    }
    if (!Number.isFinite(totalFee) || totalFee < 0) {
      return NextResponse.json({ error: "Invalid totalFee" }, { status: 400 })
    }

    const db = await getDb()
    const member = await db.collection("members").findOne({ _id: new ObjectId(id) })
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }
    if (!member.nextPeriod) {
      return NextResponse.json({ error: "No upcoming subscription to edit" }, { status: 404 })
    }

    const inrPerMonth = months > 0 ? totalFee / months : 0

    // Keep nextPeriod start date; recalc expiry using calendar months
    const baseJoin = new Date(member.nextPeriod.joinDate)
    const joinUtc = new Date(Date.UTC(
      baseJoin.getUTCFullYear(),
      baseJoin.getUTCMonth(),
      baseJoin.getUTCDate(),
      0, 0, 0, 0
    ))

    const expiryDate = addMonthsUTC(joinUtc, months).toISOString()

    const nextPeriod = {
      joinDate: joinUtc.toISOString(),
      expiryDate,
      months,
      fee: inrPerMonth,
    }

    await db.collection("members").updateOne(
      { _id: new ObjectId(id) },
      { $set: { nextPeriod } }
    )

    const updated = await db.collection("members").findOne({ _id: new ObjectId(id) })
    return NextResponse.json({ ...updated, _id: updated?._id?.toString?.() ?? updated?._id })
  } catch (error) {
    console.error("[PATCH /api/members/:id/extend] error:", error)
    return NextResponse.json({ error: "Failed to update upcoming subscription" }, { status: 500 })
  }
}
