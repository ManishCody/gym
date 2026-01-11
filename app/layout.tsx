import type { Metadata } from "next"
import type React from "react"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geist = localFont({
  src: "../public/fonts/geist/Geist-VariableFont_wght.ttf",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Gym Management System",
  description: "Gym membership management dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
