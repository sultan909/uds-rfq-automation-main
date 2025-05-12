"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Currency = "CAD" | "USD"

interface CurrencyContextType {
  currency: Currency
  toggleCurrency: () => void
  formatCurrency: (amount: number) => string
  convertCurrency: (amount: number, sourceCurrency?: Currency) => number
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("CAD")

  // Exchange rate (simplified for demo purposes)
  const CAD_TO_USD = 0.74
  const USD_TO_CAD = 1.35

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === "CAD" ? "USD" : "CAD"))
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const convertCurrency = (amount: number, sourceCurrency?: Currency): number => {
    const source = sourceCurrency || currency

    // If source and target currencies are the same, no conversion needed
    if (source === currency) {
      return amount
    }

    // Convert from source to target currency
    if (source === "CAD" && currency === "USD") {
      return amount * CAD_TO_USD
    } else {
      return amount * USD_TO_CAD
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatCurrency, convertCurrency }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
