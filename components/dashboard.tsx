"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MemberForm from "./member-form"
import MembersList from "./members-list"
import DashboardCharts from "./dashboard-charts"
import ExcelExport from "./excel-export"

export default function Dashboard({ setIsLoggedIn }: { setIsLoggedIn: (value: boolean) => void }) {
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    fetchMembers()
  }, [refreshTrigger])

  const fetchMembers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("gymToken")
    localStorage.removeItem("tokenTime")
    setIsLoggedIn(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Gym Management System</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="add-member">Add Member</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <DashboardCharts members={members} />
            <div className="mt-6">
              <ExcelExport members={members} />
            </div>
          </TabsContent>

          <TabsContent value="members">
            <MembersList
              members={members}
              isLoading={isLoading}
              onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
            />
          </TabsContent>

          <TabsContent value="add-member">
            <MemberForm onSuccess={() => setRefreshTrigger((prev) => prev + 1)} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
