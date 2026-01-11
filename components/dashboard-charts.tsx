"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Label,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"

export default function DashboardCharts({ members }: { members: any[] }) {
  const today = new Date()
  const isMobile = useIsMobile()
  const chartHeight = isMobile ? 220 : 300

  // Calculate subscription status
  const activeMembers = members.filter((m) => new Date(m.expiryDate) > today).length
  const expiredMembers = members.filter((m) => new Date(m.expiryDate) <= today).length
  const expiringInDays = members.filter((m) => {
    const daysLeft = (new Date(m.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return daysLeft > 0 && daysLeft <= 30
  }).length

  // Subscription status pie chart data
  const statusData = [
    { name: "Active", value: activeMembers },
    { name: "Expiring Soon", value: expiringInDays },
    { name: "Expired", value: expiredMembers },
  ]
  const statusDataFiltered = statusData.filter((d) => d.value > 0)
  const statusTotal = statusData.reduce((s, d) => s + d.value, 0)

  // Helper: list billing month indices (0-11) in the current year for a member
  const billingMonthsForMember = (m: any) => {
    const months: number[] = []
    const join = new Date(m.joinDate)
    const joinYear = join.getUTCFullYear()
    const currentYear = today.getUTCFullYear()
    const startMonth = join.getUTCDate() === 1 ? join.getUTCMonth() : (join.getUTCMonth() + 1)
    const total = Number(m.months || 0)
    for (let k = 0; k < total; k++) {
      // absolute month index from year 0
      const absMonth = (joinYear * 12) + startMonth + k
      const y = Math.floor(absMonth / 12)
      const mIdx = absMonth % 12
      if (y === currentYear) months.push(mIdx)
    }
    return months
  }

  // Monthly revenue chart - allocate exactly `months` buckets per above rule
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), i, 1))
    const monthRevenue = members.reduce((sum, member) => {
      const months = billingMonthsForMember(member)
      return months.includes(i) ? sum + Number(member.fee || 0) : sum
    }, 0)
    return { month: monthStart.toLocaleString("default", { month: "short" }), revenue: monthRevenue }
  })

  // Member join dates
  const joinDatesData = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(today.getFullYear(), i, 1)
    const count = members.filter((m) => new Date(m.joinDate).getMonth() === i).length
    return { month: monthDate.toLocaleString("default", { month: "short" }), members: count }
  })

  const COLORS = ["#10b981", "#f59e0b", "#ef4444"]

  const formatCurrency = (val: number) => `₹${val.toLocaleString(undefined, { minimumFractionDigits: 0 })}`

  const RADIAN = Math.PI / 180
  const renderPieLabel = ({ cx, cy, midAngle, outerRadius, name, value, percent }: any) => {
    // Position label slightly outside the slice
    const radius = outerRadius + 14
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text x={x} y={y} fill="#334155" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
        {name}: {value} ({Math.round(percent * 100)}%)
      </text>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Stats Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Total Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{members.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Active Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">{activeMembers}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Expiring Soon (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-yellow-600">{expiringInDays}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Total Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // Calculate total monthly revenue from all active members
            const total = members
              .filter(member => new Date(member.expiryDate) > today) // Only active members
              .reduce((sum, member) => sum + Number(member.fee || 0), 0)
            
            return <p className="text-3xl font-bold">{formatCurrency(total)}</p>
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Total Revenue Earned</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // Calculate total revenue earned from all members (fee * months)
            const totalEarned = members.reduce((sum, member) => {
              return sum + (Number(member.fee || 0) * Number(member.months || 0))
            }, 0)
            
            return <p className="text-3xl font-bold text-purple-600">{formatCurrency(totalEarned)}</p>
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">New Members This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            const newMembers = members.filter(member => {
              const joinDate = new Date(member.joinDate);
              return joinDate.getMonth() === currentMonth && 
                     joinDate.getFullYear() === currentYear;
            }).length;
            
            return <p className="text-3xl font-bold text-blue-600">{newMembers}</p>
          })()}
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              {statusTotal === 0 ? (
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8">
                  No data
                </text>
              ) : (
                <Pie
                  data={statusDataFiltered}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 50 : 60}
                  outerRadius={isMobile ? 72 : 90}
                  labelLine={!isMobile}
                  label={isMobile ? false : renderPieLabel}
                  dataKey="value"
                >
                  {statusDataFiltered.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  {/* <Label
                    position="center"
                    content={() => (
                      <text x={0} y={0} textAnchor="middle" dominantBaseline="middle">
                        <tspan className="fill-slate-700 text-xl font-bold">{statusTotal}</tspan>
                        <tspan x={0} dy={18} className="fill-slate-500 text-xs">Total</tspan>
                      </text>
                    )}
                  /> */}
                </Pie>
              )}
              <Tooltip formatter={(val: number, name: string) => [val, name]} />
              {!isMobile && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Revenue */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Revenue Projection</CardTitle>
          <CardDescription>Expected revenue for active subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={monthlyRevenue} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis tickFormatter={formatCurrency as any} tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 42 : 60} />
              <Tooltip formatter={(val: number) => [formatCurrency(val), "Revenue"]} />
              {!isMobile && <Legend />}
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" dot={{ r: isMobile ? 2 : 3 }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Member Join Dates */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Member Sign-ups by Month</CardTitle>
          <CardDescription>New members joined each month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={joinDatesData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} width={isMobile ? 24 : 40} />
              <Tooltip />
              {!isMobile && <Legend />}
              <Bar dataKey="members" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
