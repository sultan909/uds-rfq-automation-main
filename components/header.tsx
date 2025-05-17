"use client"

import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { CurrencyToggle } from "@/components/currency-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { DatePicker } from "@/components/date-picker"
import Link from "next/link"
import { Settings as SettingsIcon } from "lucide-react"

interface HeaderProps {
  title: string
  subtitle?: string
  showDateFilter?: boolean
  showNewCustomer?: boolean
  showNewInventory?: boolean
  showNewRfq?: boolean
}

export function Header({ title, subtitle, showDateFilter, showNewCustomer, showNewInventory, showNewRfq }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {showDateFilter && (
            <div className="flex items-center gap-2">
              <DatePicker />
            </div>
          )}
          <ThemeToggle />
          <CurrencyToggle showOverride={false} />
          {showNewCustomer && (
            <Button asChild>
              <a href="/customers/new">New Customer</a>
            </Button>
          )}
          {showNewInventory && (
            <Button asChild>
              <a href="/inventory/new">New Item</a>
            </Button>
          )}
          <Link href="/settings" className="p-2 hover:bg-muted rounded-full" title="Settings">
            <SettingsIcon className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
