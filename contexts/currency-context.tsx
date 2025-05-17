"use client"

import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

type Currency = "CAD" | "USD"

interface CurrencyContextType {
  currency: Currency
  toggleCurrency: () => void
  formatCurrency: (amount: number) => string
  convertCurrency: (amount: number, sourceCurrency?: Currency) => number
  fxRate: number
  fxRateLabel: string
  isManualRate: boolean
  setManualRate: (rate: number | null) => void
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("CAD")
  const [fxRates, setFxRates] = useState({ CAD_TO_USD: 0.74, USD_TO_CAD: 1.35 })
  const [manualRate, setManualRate] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/currency/rates")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setFxRates(data.data)
        }
      })
      .catch(() => {})
  }, [])

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

  // Determine the FX rate to use
  const fxRate = manualRate !== null
    ? manualRate
    : currency === "CAD"
      ? fxRates.USD_TO_CAD
      : fxRates.CAD_TO_USD

  // Label for the FX rate
  const fxRateLabel = currency === "CAD"
    ? `Rate: 1 CAD = ${fxRates.CAD_TO_USD.toFixed(4)} USD`
    : `Rate: 1 USD = ${fxRates.USD_TO_CAD.toFixed(4)} CAD`

  const isManualRate = manualRate !== null

  const convertCurrency = (amount: number, sourceCurrency?: Currency): number => {
    const source = sourceCurrency || currency
    if (source === currency) {
      return amount
    }
    // Use the current FX rate (manual or live)
    if (source === "CAD" && currency === "USD") {
      return amount * (manualRate !== null ? 1 / manualRate : fxRates.CAD_TO_USD)
    } else {
      return amount * fxRate
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, toggleCurrency, formatCurrency, convertCurrency, fxRate, fxRateLabel, isManualRate, setManualRate }}>
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
