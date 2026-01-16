"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Calendar, CalendarCheck } from "lucide-react"
import { format, addDays, isAfter, isBefore, parseISO, isToday, isTomorrow, differenceInDays } from 'date-fns'
import EditMemberForm from "./edit-member-form"
import MemberDetailModal from "./member-detail-modal"
import SubscriptionForm from "./subscription-form"

export default function MembersList({
  members,
  isLoading,
  onRefresh,
}: { members: any[]; isLoading: boolean; onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expiring-soon" | "expired">("all")
  const [subscriptionFormOpen, setSubscriptionFormOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)

  const calculateDaysLeft = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
    return format(date, 'MMM d, yyyy')
  }

  const handleAddSubClick = (id: string, currentExpiry?: string) => {
    setSelectedMemberId(id)
    setSelectedMember(members.find(m => m._id === id) || null)
    setSubscriptionFormOpen(true)
  }

  const handleSubscriptionSubmit = async (data: { 
    months: number; 
    totalFee: number;
    startDate?: string;
    startAfterDays?: number;
  }) => {
    if (!selectedMemberId) return
    try {
      const res = await fetch(`/api/members/${selectedMemberId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData?.error || "Failed to extend subscription")
      }
      onRefresh()
      setSubscriptionFormOpen(false)
    } catch (e) {
      console.error("Failed to extend subscription", e)
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())

    const daysLeft = calculateDaysLeft(member.expiryDate)
    const hasUpcoming = !!member.nextPeriod
    const startDate = member.nextPeriod?.startDate ? new Date(member.nextPeriod.startDate) : null
    const isUpcomingScheduled = hasUpcoming && startDate ? isAfter(startDate, new Date()) : false
    
    let matchesFilter = true

    if (filterStatus === "active") {
      matchesFilter = (daysLeft > 5) || (daysLeft <= 0 && hasUpcoming) || (daysLeft > 0 && daysLeft > 5)
    } else if (filterStatus === "expiring-soon") {
      matchesFilter = (daysLeft > 0 && daysLeft <= 5) || 
        (isUpcomingScheduled && startDate ? differenceInDays(startDate, new Date()) <= 5 : false)
    } else if (filterStatus === "expired") {
      matchesFilter = daysLeft <= 0 && !hasUpcoming
    }

    return matchesSearch && matchesFilter
  })

  const expiringCount = members.filter((m) => {
    const daysLeft = calculateDaysLeft(m.expiryDate)
    return daysLeft > 0 && daysLeft <= 5
  }).length

  const expiredCount = members.filter((m) => {
    const daysLeft = calculateDaysLeft(m.expiryDate)
    return daysLeft <= 0 && !m.nextPeriod
  }).length

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return

    try {
      const response = await fetch(`/api/members/${id}`, { method: "DELETE" })
      if (response.ok) {
        setSelectedMember(null)
        onRefresh()
      }
    } catch (error) {
      console.error("Error deleting member:", error)
    }
  }

  if (editingId) {
    const member = members.find((m) => m._id === editingId)
    return (
      <EditMemberForm
        member={member}
        onCancel={() => setEditingId(null)}
        onSuccess={() => {
          setEditingId(null)
          onRefresh()
        }}
      />
    )
  }

  return (
    <>
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="space-y-3 mb-6">
          {expiringCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">{expiringCount} Subscription(s) Expiring Soon</p>
                <p className="text-sm text-yellow-800">Members with subscriptions expiring within 5 days</p>
              </div>
            </div>
          )}
          {expiredCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">{expiredCount} Expired Subscription(s)</p>
                <p className="text-sm text-red-800">Members whose subscriptions have ended</p>
              </div>
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <div className="mt-4 space-y-4">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex justify-center md:justify-start gap-4 flex-wrap">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All ({members.length})
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
                className={filterStatus === "active" ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Active
              </Button>
              <Button
                variant={filterStatus === "expiring-soon" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("expiring-soon")}
                className={filterStatus === "expiring-soon" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Expiring Soon
              </Button>
              <Button
                variant={filterStatus === "expired" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("expired")}
                className={filterStatus === "expired" ? "bg-red-600 hover:bg-red-700" : ""}
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                Expired
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading members...</p>
          ) : filteredMembers.length === 0 ? (
            <p className="text-gray-500">No members found</p>
          ) : (
            <>
              {/* Desktop/tablet table */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Monthly Fee</th>
                      <th className="text-left p-2">Expires</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => {
                      const daysLeft = calculateDaysLeft(member.expiryDate)
                      const hasUpcoming = !!member.nextPeriod
                      const isExpiring = daysLeft <= 5 && daysLeft > 0
                      const isExpired = daysLeft <= 0 && !hasUpcoming
                      const labelText = isExpired
                        ? "Expired"
                        : daysLeft <= 0 && hasUpcoming
                        ? "Upcoming"
                        : daysLeft <= 5
                        ? `Expiring in (${daysLeft} days)`
                        : `Expiring in ${daysLeft} days`

                      return (
                        <tr
                          key={member._id}
                          className="border-b hover:bg-slate-50 cursor-pointer"
                          onClick={() => setSelectedMember(member)}
                        >
                          <td className="p-2">{member.name}</td>
                          <td className="p-2">{member.email}</td>
                          <td className="p-2">{member.phone}</td>
                          <td className="p-2">₹{member.fee.toFixed(2)}</td>
                          <td className="p-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                isExpired
                                  ? "bg-red-100 text-red-800"
                                  : isExpiring
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {labelText}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <Button
                                variant={member.nextPeriod ? "outline" : "default"}
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleAddSubClick(member._id, member.expiryDate) }}
                                className="min-w-[100px]"
                              >
                                {member.nextPeriod ? 'Modify Sub' : 'Add Sub'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditingId(member._id) }}>
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); handleDelete(member._id) }}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filteredMembers.map((member) => {
                  const daysLeft = calculateDaysLeft(member.expiryDate)
                  const hasUpcoming = !!member.nextPeriod
                  const isExpiring = daysLeft <= 5 && daysLeft > 0
                  const isExpired = daysLeft <= 0 && !hasUpcoming
                  const badge = isExpired
                    ? "bg-red-100 text-red-800"
                    : isExpiring
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                  const labelText = isExpired
                    ? "Expired"
                    : daysLeft <= 0 && hasUpcoming
                    ? "Upcoming"
                    : daysLeft <= 5
                    ? `Expiring in (${daysLeft} days)`
                    : `Expiring in ${daysLeft} days`
                  return (
                    <div
                      key={member._id}
                      className="rounded-lg border p-3 bg-white"
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-900">{member.name}</div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${badge}`}>
                          {labelText}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600 break-all">{member.email}</div>
                      <div className="mt-1 text-xs text-slate-600">{member.phone}</div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="text-slate-500">Fee</div>
                        <div className="font-medium">₹{member.fee.toFixed(2)}</div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="secondary" className="flex-1" onClick={(e) => { e.stopPropagation(); handleAddSubClick(member._id, member.expiryDate) }}>Add Sub</Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); setEditingId(member._id) }}>Edit</Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={(e) => { e.stopPropagation(); handleDelete(member._id) }}>Delete</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SubscriptionForm
        open={subscriptionFormOpen}
        onOpenChange={setSubscriptionFormOpen}
        onSubmit={handleSubscriptionSubmit}
        loading={false}
        currentExpiry={selectedMember?.expiryDate}
      />

      <MemberDetailModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onEdit={setEditingId}
        onDelete={handleDelete}
        onExtended={() => onRefresh()}
      />
    </>
  )
}
