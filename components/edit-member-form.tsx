"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function EditMemberForm({ member, onCancel, onSuccess }: any) {
  // Debug: Log the initial member data
  console.log('Initial member data in EditMemberForm:', member)

  const [formData, setFormData] = useState({
    name: member.name,
    email: member.email,
    phone: member.phone,
    // treat fee as total fee in UI; compute from stored monthly fee * months
    fee: (Number(member.fee || 0) * Number(member.months || 0)).toString(),
    months: String(Number(member.months || 1)),
    joinDate: new Date(member.joinDate).toISOString().slice(0, 10),
    photo: null as File | null,
  })
  const [previewUrl, setPreviewUrl] = useState(member.photoUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [upcoming, setUpcoming] = useState(() => {
    if (!member.nextPeriod) return null as null | { months: string; totalFee: string }
    const m = Number(member.nextPeriod.months || 1)
    const fee = Number(member.nextPeriod.fee || 0)
    return {
      months: String(m),
      totalFee: (fee * m).toString(),
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = ["image/jpeg", "image/png"]
      if (!validTypes.includes(file.type)) {
        setError("Only JPG, JPEG, and PNG files are allowed")
        return
      }

      setFormData((prev) => ({ ...prev, photo: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError("")
    }
  }

  const handleUpcomingSubmit = async () => {
    if (!upcoming) return
    try {
      setIsLoading(true)
      const months = parseInt(upcoming.months || "0", 10)
      const totalFee = parseFloat(upcoming.totalFee || "0")
      if (!Number.isFinite(months) || months <= 0) throw new Error("Invalid upcoming months")
      if (!Number.isFinite(totalFee) || totalFee < 0) throw new Error("Invalid upcoming total fee")

      const res = await fetch(`/api/members/${member._id}/extend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months, totalFee }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to update upcoming subscription")
      }
      onSuccess()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Debug: Log the member data being used for the update
    console.log('Updating member with ID:', member._id)
    console.log('Current form data:', formData)

    setIsLoading(true)

    try {
      let photoUrl = member.photoUrl

      if (formData.photo) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
        if (!cloudName || !uploadPreset) {
          throw new Error("Cloudinary env not set: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET")
        }
        const photoFormData = new FormData()
        photoFormData.append("file", formData.photo)
        photoFormData.append("upload_preset", uploadPreset)
        const photoResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: photoFormData,
        })
        if (!photoResponse.ok) throw new Error("Photo upload failed")
        const photoData = await photoResponse.json()
        photoUrl = photoData.secure_url || photoData.url
      }

      // Debug: Log the API request details
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        // compute per-month fee from total
        fee: Number.parseFloat(formData.months || "0") > 0
          ? Number.parseFloat(formData.fee) / Number.parseFloat(formData.months)
          : 0,
        months: Number.parseInt(formData.months),
        joinDate: new Date(formData.joinDate).toISOString(),
        photoUrl,
      }
      
      console.log('Sending update request to:', `/api/members/${member._id}`)
      console.log('Update data:', updateData)

      const memberResponse = await fetch(`/api/members/${member._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!memberResponse.ok) throw new Error("Failed to update member")

      onSuccess()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Member</CardTitle>
        <CardDescription>Update member subscription details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input name="name" value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input name="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Total Fee (₹)</label>
              <Input name="fee" type="number" value={formData.fee} onChange={handleInputChange} step="0.01" />
              {formData.fee && formData.months && Number(formData.months) > 0 && (
                <p className="text-xs text-slate-500">Per-month: ₹{(Number(formData.fee) / Number(formData.months)).toFixed(2)}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subscription Months</label>
              <Input name="months" type="number" value={formData.months} onChange={handleInputChange} min="1" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Join Date</label>
              <Input name="joinDate" type="date" value={formData.joinDate} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Photo (JPG, JPEG, PNG)</label>
              <Input name="photo" type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
            </div>
          </div>

          {member.nextPeriod && (
            <div className="mt-6 space-y-3 border rounded-lg p-4">
              <h4 className="font-semibold">Upcoming Subscription</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Months</label>
                  <Input
                    type="number"
                    min="1"
                    value={upcoming?.months || ""}
                    onChange={(e) => setUpcoming((p) => (p ? { ...p, months: e.target.value } : p))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Total Fee (₹)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={upcoming?.totalFee || ""}
                    onChange={(e) => setUpcoming((p) => (p ? { ...p, totalFee: e.target.value } : p))}
                  />
                  {upcoming && Number(upcoming.months) > 0 && (
                    <p className="text-xs text-slate-500">Per-month: ₹{(Number(upcoming.totalFee || 0) / Number(upcoming.months)).toFixed(2)}</p>
                  )}
                </div>
              </div>
              <div>
                <Button type="button" variant="secondary" onClick={handleUpcomingSubmit} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Update Upcoming"}
                </Button>
              </div>
            </div>
          )}

          {previewUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Photo Preview</p>
              <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-32 h-32 object-cover rounded" />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Member"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
