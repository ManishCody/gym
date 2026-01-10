"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"

export default function MemberDetailModal({
  member,
  onClose,
  onEdit,
  onDelete,
}: {
  member: any | null
  onClose: () => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  if (!member) return null

  const expiryDate = new Date(member.expiryDate)
  const today = new Date()
  const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isExpired = daysLeft <= 0
  const isExpiringSoon = daysLeft <= 30 && daysLeft > 0

  return (
    <Dialog open={!!member} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogTitle className="sr-only">Member Details</DialogTitle>
        <div className="space-y-6">
          {/* Profile Image */}
          <div className="flex justify-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-200">
              {member.photoUrl ? (
                <Image src={member.photoUrl || "/placeholder.svg"} alt={member.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500">
                  No Photo
                </div>
              )}
            </div>
          </div>

          {/* Member Details */}
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{member.name}</h2>
              <p className="text-sm text-slate-500">{member.email}</p>
            </div>

            {/* Subscription Status */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-slate-900 mb-2">Subscription Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isExpired
                        ? "bg-red-100 text-red-800"
                        : isExpiringSoon
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {isExpired ? "Expired" : isExpiringSoon ? "Expiring Soon" : "Active"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Expires:</span>
                  <span className="text-sm font-medium">{expiryDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Days Left:</span>
                  <span className="text-sm font-medium">{Math.max(daysLeft, 0)} days</span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-slate-900 mb-2">Contact Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Phone:</span>
                  <span className="text-sm font-medium">{member.phone}</span>
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-slate-900 mb-2">Subscription Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Monthly Fee:</span>
                  <span className="text-sm font-medium">₹{member.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Duration:</span>
                  <span className="text-sm font-medium">{member.months} months</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Join Date:</span>
                  <span className="text-sm font-medium">{new Date(member.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  onEdit(member._id)
                  onClose()
                }}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this member?")) {
                    onDelete(member._id)
                    onClose()
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
