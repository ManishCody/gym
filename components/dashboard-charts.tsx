"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EChart, formatCurrency } from "@/components/ui/echart"
import { useIsMobile } from "@/hooks/use-mobile"
import * as echarts from 'echarts/core'
import { useMemo } from 'react'

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

  // 1. Monthly Revenue Calculation - Shows last 3 months of previous year and current year
  const getMonthlyRevenue = (year: number, monthIndex: number, members: any[]) => {
    return members.reduce((total: number, member: any) => {
      const joinDate = new Date(member.joinDate);
      const expiryDate = new Date(member.expiryDate);
      const memberJoinYear = joinDate.getFullYear();
      const memberExpiryYear = expiryDate.getFullYear();
      const memberJoinMonth = joinDate.getMonth();
      const memberExpiryMonth = expiryDate.getMonth();
      
      if (
        (memberJoinYear < year || (memberJoinYear === year && memberJoinMonth <= monthIndex)) &&
        (memberExpiryYear > year || (memberExpiryYear === year && memberExpiryMonth >= monthIndex))
      ) {
        return total + (Number(member.fee) || 0);
      }
      return total;
    }, 0);
  };

  const currentYear = today.getFullYear();
  const monthlyRevenue: Array<{month: string, revenue: number, isPreviousYear?: boolean, isCurrentYear?: boolean}> = [];
  
  // Add previous year's last 3 months (Oct, Nov, Dec)
  for (let i = 9; i < 12; i++) {
    const monthName = new Date(currentYear - 1, i, 1).toLocaleString("default", { month: "short" });
    const revenue = getMonthlyRevenue(currentYear - 1, i, members);
    monthlyRevenue.push({
      month: `${monthName} '${(currentYear - 1).toString().slice(2)}`,
      revenue,
      isPreviousYear: true
    });
  }
  
  // Add current year's months up to current month
  for (let i = 0; i <= today.getMonth(); i++) {
    const monthName = new Date(currentYear, i, 1).toLocaleString("default", { month: "short" });
    const revenue = getMonthlyRevenue(currentYear, i, members);
    monthlyRevenue.push({
      month: `${monthName} '${currentYear.toString().slice(2)}`,
      revenue,
      isCurrentYear: true
    });
  }

  // 2. Member Sign-ups Calculation - Show last 3 months of previous year and current year
  const joinDatesData = [];
  
  // Add previous year's last 3 months (Oct, Nov, Dec)
  for (let i = 9; i < 12; i++) {
    const monthName = new Date(currentYear - 1, i, 1).toLocaleString("default", { month: "short" });
    const signUps = members.filter((member: any) => {
      const joinDate = new Date(member.joinDate);
      return joinDate.getFullYear() === currentYear - 1 && joinDate.getMonth() === i;
    }).length;
    
    joinDatesData.push({
      month: `${monthName} '${(currentYear - 1).toString().slice(2)}`,
      signUps,
      isPreviousYear: true
    });
  }
  
  // Add current year's months up to current month
  for (let i = 0; i <= today.getMonth(); i++) {
    const monthName = new Date(currentYear, i, 1).toLocaleString("default", { month: "short" });
    const signUps = members.filter((member: any) => {
      const joinDate = new Date(member.joinDate);
      return joinDate.getFullYear() === currentYear && joinDate.getMonth() === i;
    }).length;
    
    joinDatesData.push({
      month: `${monthName} '${currentYear.toString().slice(2)}`,
      signUps,
      isCurrentYear: true
    });
  }

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"]

  // Calculate membership plan distribution
  const membershipPlans = useMemo(() => {
    const planMap = new Map<string, number>();
    members.forEach(member => {
      const plan = member.plan || 'No Plan';
      planMap.set(plan, (planMap.get(plan) || 0) + 1);
    });
    return Array.from(planMap.entries()).map(([name, value]) => ({ name, value }));
  }, [members]);

  // Calculate subscription duration distribution
  const subscriptionDurations = useMemo(() => {
    const durationMap = new Map<number, number>();
    members.forEach(member => {
      const months = Number(member.months) || 0;
      durationMap.set(months, (durationMap.get(months) || 0) + 1);
    });
    return Array.from(durationMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([months, count]) => ({
        name: months === 1 ? '1 month' : `${months} months`,
        value: count
      }));
  }, [members]);

  // Calculate days remaining distribution
  const daysRemainingData = useMemo(() => {
    const today = new Date();
    const buckets = [
      { name: 'Expired', min: -Infinity, max: 0, count: 0 },
      { name: '0-7 days', min: 0, max: 7, count: 0 },
      { name: '8-30 days', min: 8, max: 30, count: 0 },
      { name: '1-3 months', min: 31, max: 90, count: 0 },
      { name: '3-6 months', min: 91, max: 180, count: 0 },
      { name: '6+ months', min: 181, max: Infinity, count: 0 },
    ];

    members.forEach(member => {
      const expiryDate = new Date(member.expiryDate);
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      for (const bucket of buckets) {
        if (daysLeft > bucket.min && daysLeft <= bucket.max) {
          bucket.count++;
          break;
        }
      }
    });

    return buckets.filter(b => b.count > 0);
  }, [members]);

  // Calculate fee distribution
  const feeDistribution = useMemo(() => {
    const feeMap = new Map<number, { count: number, total: number }>();
    
    members.forEach(member => {
      const fee = Number(member.fee) || 0;
      const roundedFee = Math.round(fee / 500) * 500; // Group by 500 increments
      const data = feeMap.get(roundedFee) || { count: 0, total: 0 };
      feeMap.set(roundedFee, {
        count: data.count + 1,
        total: data.total + fee
      });
    });

    return Array.from(feeMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([fee, data]) => ({
        name: `₹${fee.toLocaleString()}`,
        count: data.count,
        total: data.total
      }));
  }, [members]);

  // Calculate member growth data
  const memberGrowthData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const growthData = [];
    
    for (let i = 0; i < 12; i++) {
      const monthName = new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' });
      const monthMembers = members.filter(member => {
        const joinDate = new Date(member.joinDate);
        return joinDate.getFullYear() === currentYear && joinDate.getMonth() === i;
      });
      
      growthData.push({
        month: monthName,
        newMembers: monthMembers.length,
        revenue: monthMembers.reduce((sum, m) => sum + (Number(m.fee) || 0), 0)
      });
    }
    
    return growthData;
  }, [members]);

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
          <EChart 
            option={{
              tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b}: {c} ({d}%)'
              },
              legend: {
                show: !isMobile,
                bottom: 0,
                data: statusDataFiltered.map(item => item.name)
              },
              series: [
                {
                  name: 'Subscription Status',
                  type: 'pie',
                  radius: isMobile ? ['40%', '60%'] : ['45%', '70%'],
                  avoidLabelOverlap: false,
                  itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                  },
                  label: {
                    show: !isMobile,
                    formatter: '{b}: {c} ({d}%)',
                    position: 'outside'
                  },
                  emphasis: {
                    label: {
                      show: true,
                      fontSize: 16,
                      fontWeight: 'bold'
                    }
                  },
                  labelLine: {
                    show: !isMobile
                  },
                  data: statusDataFiltered.map((item, index) => ({
                    value: item.value,
                    name: item.name,
                    itemStyle: { color: COLORS[index % COLORS.length] }
                  }))
                }
              ]
            }} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
