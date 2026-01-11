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
  const totalFee = Number(member.fee || 0) * Number(member.months || 0)
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })

  const truncateEmail = (email: string, maxLength = 20) => {
    if (!email) return "";
    return email.length > maxLength
      ? email.slice(0, maxLength) + "..."
      : email;
  };


  return (

    <Dialog open={!!member} onOpenChange={onClose}>
      <DialogContent className="w-full md:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
        <DialogTitle className="sr-only">Member Details</DialogTitle>
        <div className="space-y-6 p-2">
          <Card className=" p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="shrink-0 flex justify-center items-center">
                <div className="relative w-32 h-32 md:w-36 md:h-36  rounded-full overflow-hidden border-4 border-slate-200">
                  {member.photoUrl ? (
                    <Image src={member.photoUrl || "/placeholder.svg"} alt={member.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500">No Photo</div>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{member.name}</h2>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${isExpired ? "bg-red-100 text-red-800" : isExpiringSoon ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                      }`}
                  >
                    {isExpired ? "Expired" : isExpiringSoon ? "Expiring Soon" : "Active"}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{member.email}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="p-3 rounded-lg bg-slate-50">
                    <div className="text-xs text-slate-500">Expires</div>
                    <div className="text-sm font-medium">{expiryDate.toLocaleDateString()}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <div className="text-xs text-slate-500">Days Left</div>
                    <div className="text-sm font-medium">{Math.max(daysLeft, 0)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50">
                    <div className="text-xs text-slate-500">Phone</div>
                    <div className="text-sm font-medium">{member.phone}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">Subscription</h3>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Join Date</span>
                    <span className="font-medium">{new Date(member.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Duration</span>
                    <span className="font-medium">{member.months} months</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Monthly Fee</span>
                    <span className="font-medium">{inr.format(Number(member.fee || 0))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Fee</span>
                    <span className="font-semibold">{inr.format(totalFee)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900">Account</h3>
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Email: </span>
                    <span
                    className="font-medium break-all cursor-pointer"
                    title={member.email}   
>
                    {truncateEmail(member.email)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Phone:</span>
                  <span className="font-medium">{member.phone}</span>
                </div>
              </div>
            </div>
        </div>

        <div className="flex gap-3 mt-6">
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
      </DialogContent >
    </Dialog >
  )
}
