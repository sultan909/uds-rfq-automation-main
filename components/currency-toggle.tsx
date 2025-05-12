"use client"

import { useCurrency } from "@/contexts/currency-context"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency()

  return (
    <Button variant="outline" size="sm" onClick={toggleCurrency} className="flex items-center gap-1">
      <DollarSign className="h-4 w-4" />
      {currency}
    </Button>
  )
}
