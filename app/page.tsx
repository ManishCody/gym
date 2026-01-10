"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/login-form"
import Dashboard from "@/components/dashboard"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("gymToken")
    const tokenTime = localStorage.getItem("tokenTime")

    if (token && tokenTime) {
      const elapsed = Date.now() - Number.parseInt(tokenTime)
      const thirtyMinutesMs = 30 * 60 * 1000

      if (elapsed < thirtyMinutesMs) {
        setIsLoggedIn(true)
      } else {
        localStorage.removeItem("gymToken")
        localStorage.removeItem("tokenTime")
      }
    }

    setIsLoading(false)
  }, [])

  // Check token every minute
  useEffect(() => {
    if (!isLoggedIn) return

    const interval = setInterval(() => {
      const tokenTime = localStorage.getItem("tokenTime")
      if (tokenTime) {
        const elapsed = Date.now() - Number.parseInt(tokenTime)
        const thirtyMinutesMs = 30 * 60 * 1000

        if (elapsed >= thirtyMinutesMs) {
          localStorage.removeItem("gymToken")
          localStorage.removeItem("tokenTime")
          setIsLoggedIn(false)
        }
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [isLoggedIn])

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return isLoggedIn ? <Dashboard setIsLoggedIn={setIsLoggedIn} /> : <LoginForm setIsLoggedIn={setIsLoggedIn} />
}
