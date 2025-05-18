
"use client"

// This is just a redirect page that will automatically navigate the user to the manual-rfq sub-route
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function NewRfqPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to the manual RFQ form by default
    router.replace("/rfq-management/new/manual-rfq")
  }, [router])
  
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-pulse">Redirecting...</div>
    </div>
  )
}