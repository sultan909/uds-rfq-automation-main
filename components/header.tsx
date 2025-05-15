"use client"

import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { CurrencyToggle } from "@/components/currency-toggle"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  title: string
  subtitle?: string
  showNewRfq?: boolean
  showNewCustomer?: boolean
}

export function Header({ title, subtitle, showNewRfq = false, showNewCustomer }: HeaderProps) {
  const pathname = usePathname()

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <CurrencyToggle />
        {showNewRfq && <Button onClick={() => (window.location.href = "/rfq-management/new")}>New RFQ</Button>}
        {showNewCustomer && (
          <Button asChild>
            <a href="/customers/new">New Customer</a>
          </Button>
        )}
      </div>
    </div>
  )
}
