"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function NewRfqLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<string>("manual")
  
  // Set active tab based on current path
  useEffect(() => {
    if (pathname.endsWith("/manual-rfq")) {
      setActiveTab("manual")
    } else if (pathname.endsWith("/email-parser")) {
      setActiveTab("email")
    }
  }, [pathname])

  const handleTabChange = (value: string) => {
    if (value === "manual") {
      router.push("/rfq-management/new/manual-rfq")
    } else if (value === "email") {
      router.push("/rfq-management/new/email-parser") 
    }
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Create New RFQ" subtitle="Create a new request for quote" />
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-5xl mx-auto">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="manual">Manual RFQ</TabsTrigger>
                <TabsTrigger value="email">Email Parser</TabsTrigger>
              </TabsList>
              
              {children}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}