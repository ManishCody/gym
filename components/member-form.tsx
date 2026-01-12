"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function MemberForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    fee: "",
    months: "",
    photo: null as File | null,
    joinDate: new Date().toISOString().slice(0, 10),
    photoUrl: "https://res.cloudinary.com/dd5hqylnm/image/upload/v1768110379/xd1cktchdsgyugzmc4xy.jpg"
  })
  const [previewUrl, setPreviewUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

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
    setSuccess("")

    if (!formData.name || !formData.email || !formData.phone || !formData.fee || !formData.months || !formData.joinDate) {
      setError("All fields except photo are required")
      return
    }

    setIsLoading(true)

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      if (!cloudName || !uploadPreset) {
        throw new Error("Cloudinary env not set: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET")
      }

      let photoUrl = formData.photoUrl;
      
      // Only upload photo if a new one was selected
      if (formData.photo) {
        const photoFormData = new FormData();
        photoFormData.append("file", formData.photo);
        photoFormData.append("upload_preset", uploadPreset);

        const photoResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: photoFormData,
        });

        if (!photoResponse.ok) throw new Error("Photo upload failed");
        const photoData = await photoResponse.json();
        photoUrl = photoData.secure_url || photoData.url;
      }

      // Save member to database
      const memberResponse = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          fee: Number.parseFloat(formData.fee),
          months: Number.parseInt(formData.months),
          photoUrl: photoUrl,
          joinDate: new Date(formData.joinDate).toISOString(),
        }),
      })

      if (!memberResponse.ok) throw new Error("Failed to save member")

      setSuccess("Member added successfully!")
      setFormData({ 
        name: "", 
        email: "", 
        phone: "", 
        fee: "", 
        months: "", 
        photo: null, 
        joinDate: new Date().toISOString().slice(0, 10),
        photoUrl: "https://res.cloudinary.com/dd5hqylnm/image/upload/v1768110036/c8g3yefrr8kjaul0ww6l.jpg"
      })
      setPreviewUrl("")

      setTimeout(() => {
        onSuccess()
      }, 1000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-4 md:p-6">
      <CardHeader>
        <CardTitle>Add New Member</CardTitle>
        <CardDescription>Register a new gym member with subscription details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Member name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email address"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone number" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Fee (₹)</label>
              <Input
                name="fee"
                type="number"
                value={formData.fee}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subscription Months</label>
              <Input
                name="months"
                type="number"
                value={formData.months}
                onChange={handleInputChange}
                placeholder="12"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Join Date</label>
              <Input
                name="joinDate"
                type="date"
                value={formData.joinDate}
                onChange={handleInputChange}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Photo (JPG, JPEG, PNG)</label>
              <Input name="photo" type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange} />
            </div>
          </div>

          {previewUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Photo Preview</p>
              <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-24 h-24 md:w-32 md:h-32 object-cover rounded" />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">{success}</p>}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Adding Member..." : "Add Member"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
