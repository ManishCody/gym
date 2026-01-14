"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

export default function SubscriptionForm({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  defaultMonths = "1",
  defaultTotalFee = ""
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { months: number; totalFee: number }) => void
  loading?: boolean
  defaultMonths?: string
  defaultTotalFee?: string
}) {
  const [months, setMonths] = useState(defaultMonths)
  const [totalFee, setTotalFee] = useState(defaultTotalFee)
  
  const perMonth = (Number(totalFee) || 0) / (Number(months) || 1)
  const isValid = Number(months) > 0 && Number(totalFee) >= 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onSubmit({
      months: Number(months),
      totalFee: Number(totalFee)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
            <DialogDescription>
              Add a new subscription period for this member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="months">Months</Label>
              <Input
                id="months"
                type="number"
                min="1"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                placeholder="3"
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalFee">Total Fee (₹)</Label>
              <Input
                id="totalFee"
                type="number"
                min="0"
                step="0.01"
                value={totalFee}
                onChange={(e) => setTotalFee(e.target.value)}
                placeholder="3000"
                className="w-full"
                required
              />
              <p className="text-sm text-muted-foreground">
                Per month: ₹{perMonth.toFixed(2)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || loading}>
              {loading ? 'Processing...' : 'Extend Subscription'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
