"use client"

import { Button } from "@/components/ui/button"

export default function ExcelExport({ members }: { members: any[] }) {
  const handleExport = () => {
    const csvContent = [
      ["Name", "Email", "Phone", "Monthly Fee", "Join Date", "Expiry Date", "Status"],
      ...members.map((m) => {
        const expiryDate = new Date(m.expiryDate)
        const today = new Date()
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const status = daysLeft <= 0 ? "Expired" : daysLeft <= 30 ? "Expiring Soon" : "Active"

        return [
          m.name,
          m.email,
          m.phone,
          m.fee,
          new Date(m.joinDate).toLocaleDateString(),
          expiryDate.toLocaleDateString(),
          status,
        ]
      }),
    ]

    const csv = csvContent.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `gym-members-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return <Button onClick={handleExport}>Download Excel Report</Button>
}
