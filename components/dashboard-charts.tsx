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

export default function DashboardCharts({ members }: { members: any[] }) {
  const today = new Date()

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

  // Monthly revenue chart
  const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(today.getFullYear(), i, 1)
    const monthRevenue = members.reduce((sum, member) => {
      if (new Date(member.joinDate) <= date && new Date(member.expiryDate) > date) {
        return sum + member.fee
      }
      return sum
    }, 0)
    return { month: date.toLocaleString("default", { month: "short" }), revenue: monthRevenue }
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
          <p className="text-3xl font-bold">{formatCurrency(members.filter((m) => new Date(m.expiryDate) > today).reduce((sum, m) => sum + m.fee, 0))}</p>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
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
                  innerRadius={60}
                  outerRadius={90}
                  labelLine
                  label={renderPieLabel}
                  dataKey="value"
                >
                  {statusDataFiltered.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <Label
                    position="center"
                    content={() => (
                      <text x={0} y={0} textAnchor="middle" dominantBaseline="middle">
                        <tspan className="fill-slate-700 text-xl font-bold">{statusTotal}</tspan>
                        <tspan x={0} dy={18} className="fill-slate-500 text-xs">Total</tspan>
                      </text>
                    )}
                  />
                </Pie>
              )}
              <Tooltip formatter={(val: number, name: string) => [val, name]} />
              <Legend />
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
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency as any} />
              <Tooltip formatter={(val: number) => [formatCurrency(val), "Revenue"]} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={joinDatesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="members" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
