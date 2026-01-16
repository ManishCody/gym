import { NextResponse, type NextRequest } from "next/server"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { addDays } from 'date-fns'

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
    const startDate = body.startDate ? new Date(body.startDate) : null
    const startAfterDays = body.startAfterDays ? Number(body.startAfterDays) : null
    
    if (!months || months <= 0) {
      return NextResponse.json({ error: "Invalid months" }, { status: 400 })
    }
    if (!Number.isFinite(totalFee) || totalFee < 0) {
      return NextResponse.json({ error: "Invalid totalFee" }, { status: 400 })
    }
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid start date" }, { status: 400 })
    }
    if (startAfterDays !== null && (isNaN(startAfterDays) || startAfterDays < 0)) {
      return NextResponse.json({ error: "Invalid start after days" }, { status: 400 })
    }

    const db = await getDb()
    const member = await db.collection("members").findOne({ _id: new ObjectId(id) })
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Check if we're updating an existing upcoming subscription
    const existingNextPeriod = member.nextPeriod || {}
    const isUpdating = !!member.nextPeriod

    // Determine the start date for the subscription
    let joinUtc: Date
    let isImmediate = false
    
    if (startDate) {
      // Use the specified start date
      joinUtc = new Date(Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
        0, 0, 0, 0
      ))
      
      // If the start date is today or in the past, make it immediate
      if (joinUtc <= new Date()) {
        isImmediate = true
      }
    } else if (startAfterDays !== null) {
      // Calculate start date based on days from now
      const start = addDays(new Date(), startAfterDays)
      joinUtc = new Date(Date.UTC(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate(),
        0, 0, 0, 0
      ))
      isImmediate = joinUtc <= new Date()
    } else {
      // No start date specified, use current expiry or now
      const baseDate = member.expiryDate && new Date(member.expiryDate) > new Date() 
        ? new Date(member.expiryDate) 
        : new Date()
      
      joinUtc = new Date(Date.UTC(
        baseDate.getUTCFullYear(),
        baseDate.getUTCMonth(),
        baseDate.getUTCDate(),
        0, 0, 0, 0
      ))
      isImmediate = true
    }

    const expiryDate = addMonthsUTC(joinUtc, months).toISOString()
    const inrPerMonth = months > 0 ? totalFee / months : 0
    
    // If the subscription is immediate and there's no active subscription, 
    // or if the current subscription is expired, apply it immediately
    const isSubscriptionExpired = member.expiryDate && new Date(member.expiryDate) < new Date()
    
    if (isImmediate && (!member.expiryDate || isSubscriptionExpired)) {
      // Update the current subscription
      await db.collection("members").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            joinDate: joinUtc.toISOString(),
            expiryDate,
            fee: inrPerMonth,
            lastRenewal: new Date().toISOString(),
          },
          $unset: { nextPeriod: 1 }
        }
      )
      
      const updated = await db.collection("members").findOne({ _id: new ObjectId(id) })
      return NextResponse.json({ 
        ...updated, 
        _id: updated?._id?.toString?.() ?? updated?._id,
        activated: true
      })
    } else if (isImmediate) {
      // There's an active subscription, so set as next period
      const nextPeriod = {
        joinDate: joinUtc.toISOString(),
        expiryDate,
        months,
        fee: inrPerMonth,
        startDate: joinUtc.toISOString(),
        isPending: false
      }
      
      await db.collection("members").updateOne(
        { _id: new ObjectId(id) },
        { $set: { nextPeriod } }
      )
    } else {
      // Future-dated subscription
      const nextPeriod = {
        joinDate: joinUtc.toISOString(),
        expiryDate,
        months,
        fee: inrPerMonth,
        startDate: joinUtc.toISOString(),
        isPending: true
      }
      
      await db.collection("members").updateOne(
        { _id: new ObjectId(id) },
        { $set: { nextPeriod } }
      )
    }

    // Return the updated member
    const updated = await db.collection("members").findOne({ _id: new ObjectId(id) })
    return NextResponse.json({ 
      ...updated, 
      _id: updated?._id?.toString?.() ?? updated?._id,
      activated: isImmediate
    })
  } catch (error) {
    console.error("[POST /api/members/:id/extend] error:", error)
    return NextResponse.json({ error: "Failed to extend subscription" }, { status: 500 })
  }
}

// Add a new endpoint to check for and activate pending subscriptions
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const db = await getDb()
    const member = await db.collection("members").findOne({ _id: new ObjectId(id) })
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Check if there's a pending subscription that should be activated
    if (member.nextPeriod?.isPending && member.nextPeriod?.startDate) {
      const startDate = new Date(member.nextPeriod.startDate)
      const now = new Date()
      
      if (startDate <= now) {
        // Activate the pending subscription
        await db.collection("members").updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              joinDate: member.nextPeriod.joinDate,
              expiryDate: member.nextPeriod.expiryDate,
              fee: member.nextPeriod.fee,
              lastRenewal: new Date().toISOString(),
            },
            $unset: { nextPeriod: 1 }
          }
        )
        
        const updated = await db.collection("members").findOne({ _id: new ObjectId(id) })
        return NextResponse.json({ 
          ...updated, 
          _id: updated?._id?.toString?.() ?? updated?._id,
          activated: true
        })
      }
    }

    return NextResponse.json({ ...member, _id: member._id.toString(), activated: false })
  } catch (error) {
    console.error("[GET /api/members/:id/extend] error:", error)
    return NextResponse.json({ error: "Failed to check subscription status" }, { status: 500 })
  }
}
