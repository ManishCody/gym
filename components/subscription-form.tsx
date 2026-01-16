"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { format, parseISO, isAfter } from 'date-fns'
import { AlertTriangle } from 'lucide-react'

export default function SubscriptionForm({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  defaultMonths = "1",
  defaultTotalFee = "",
  currentExpiry
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { 
    months: number; 
    totalFee: number;
    startDate?: string;
    startAfterDays?: number;
  }) => void
  loading?: boolean
  defaultMonths?: string
  defaultTotalFee?: string
  currentExpiry?: string
}) {
  const [months, setMonths] = useState(defaultMonths)
  const [totalFee, setTotalFee] = useState(defaultTotalFee)
  const [useFutureDate, setUseFutureDate] = useState(false)
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  
  const perMonth = (Number(totalFee) || 0) / (Number(months) || 1)
  const isValid = Number(months) > 0 && Number(totalFee) >= 0 && 
    (!useFutureDate || startDate)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    
    const submitData: any = {
      months: Number(months),
      totalFee: Number(totalFee)
    }
    
    if (useFutureDate && startDate) {
      // If scheduling for future, set the start date
      submitData.startDate = startDate
    }
    
    onSubmit(submitData)
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
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="future-date" 
                  checked={useFutureDate}
                  onCheckedChange={(checked) => {
                    setUseFutureDate(checked)
                    if (!checked) {
                      setStartDate(format(new Date(), 'yyyy-MM-dd'))
                    }
                  }}
                />
                <Label htmlFor="future-date">Schedule for future start</Label>
              </div>
              
              {useFutureDate && (
                <div className="pl-8 space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="start-date" className="text-sm font-normal">
                      Start date:
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => setStartDate(e.target.value)}
                      onFocus={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      className="w-full max-w-[200px]"
                    />
                  </div>
                  
                  {currentExpiry && (
                    <div className="text-xs text-muted-foreground">
                      <p>Current subscription expires: {format(parseISO(currentExpiry), 'MMM d, yyyy')}</p>
                      {new Date(currentExpiry) < new Date() && (
                        <p className="text-amber-600 mt-1">
                          Note: The current subscription has expired. A new subscription will start immediately if not scheduled for future.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {!useFutureDate && currentExpiry && new Date(currentExpiry) < new Date() && (
                <div className="pl-8">
                  <p className="text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4 inline-block mr-1" />
                    The current subscription has expired. A new subscription will start immediately.
                  </p>
                </div>
              )}
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
