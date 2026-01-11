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
    fee: member.fee.toString(),
    months: Math.ceil((new Date(member.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)).toString(),
    photo: null as File | null,
  })
  const [previewUrl, setPreviewUrl] = useState(member.photoUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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
        fee: Number.parseFloat(formData.fee),
        months: Number.parseInt(formData.months),
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
              <label className="text-sm font-medium">Monthly Fee (₹)</label>
              <Input name="fee" type="number" value={formData.fee} onChange={handleInputChange} step="0.01" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subscription Months</label>
              <Input name="months" type="number" value={formData.months} onChange={handleInputChange} min="1" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Photo (JPG, JPEG, PNG)</label>
              <Input name="photo" type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
            </div>
          </div>

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
