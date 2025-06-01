"use client"

import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { CurrencyToggle } from "@/components/currency-toggle"
import { ThemeToggle } from "@/components/theme-toggle"
import { DatePicker } from "@/components/date-picker"
import Link from "next/link"
import { useCurrency } from "@/contexts/currency-context"

interface HeaderProps {
  title: string
  subtitle?: string
  showDateFilter?: boolean
  showNewCustomer?: boolean
  showNewInventory?: boolean
  showNewRfq?: boolean
}

function CurrencyRateDisplay() {
  const { getUsdToCadRate, isManualRate } = useCurrency();
  
  return (
    <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded-md">
      1 USD = {getUsdToCadRate().toFixed(2)} CAD
      {isManualRate && <span className="ml-1 text-orange-600">(Manual)</span>}
    </div>
  );
}

export function Header({
  title,
  subtitle,
  showDateFilter,
  showNewCustomer,
  showNewInventory,
  showNewRfq,
}: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex-1">
          <h1 className="text-lg font-semibold leading-6">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground leading-5">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {showDateFilter && (
            <div className="flex items-center gap-2">
              <DatePicker />
            </div>
          )}
          <ThemeToggle />
          <CurrencyToggle showOverride={false} />
          <CurrencyRateDisplay />
<<<<<<< Updated upstream
         
=======
>>>>>>> Stashed changes
        </div>
      </div>
    </header>
  )
}
