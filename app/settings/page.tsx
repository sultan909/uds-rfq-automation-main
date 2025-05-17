"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Card } from "@/components/ui/card"
import { CurrencyToggle } from "@/components/currency-toggle"

export default function SettingsPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Settings" subtitle="Manage application settings" />
        <div className="flex-1 overflow-auto p-4">
          <Card className="p-6 max-w-xl mx-auto">
            <h2 className="text-xl font-semibold mb-2">Currency Settings</h2>
            <p className="text-muted-foreground mb-4">
              Set your preferred currency and override the exchange rate if needed.
            </p>
            <CurrencyToggle showOverride={true} />
          </Card>
        </div>
      </div>
    </div>
  )
} 