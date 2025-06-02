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
  getUsdToCadRate: () => number
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>("CAD")
  const [fxRates, setFxRates] = useState({ CAD_TO_USD: 0.74, USD_TO_CAD: 1.35 })
  const [manualRate, setManualRate] = useState<number | null>(null)

  useEffect(() => {
    // Fix the endpoint call - use the correct endpoint
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
    if (currency === "CAD") {
      return `$${amount.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    } else {
      return `US$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
  }

  // Always get the USD to CAD rate (the rate should always show 1 USD = X CAD)
  const getUsdToCadRate = (): number => {
    return manualRate !== null ? manualRate : fxRates.USD_TO_CAD
  }

  // Determine the FX rate to use for conversions based on current currency
  const fxRate = currency === "CAD" 
    ? getUsdToCadRate() // If displaying CAD, use USD_TO_CAD rate
    : (1 / getUsdToCadRate()) // If displaying USD, use the inverse (CAD_TO_USD)

  // Label should always show "1 USD = X CAD" regardless of selected currency
  const fxRateLabel = `1 USD = ${getUsdToCadRate().toFixed(4)} CAD`

  const isManualRate = manualRate !== null

  const convertCurrency = (amount: number, sourceCurrency?: Currency): number => {
    const source = sourceCurrency || currency
    if (source === currency) {
      return amount
    }
    
    const usdToCadRate = getUsdToCadRate()
    
    // Convert from source to target currency
    if (source === "USD" && currency === "CAD") {
      return amount * usdToCadRate
    } else if (source === "CAD" && currency === "USD") {
      return amount / usdToCadRate
    }
    
    return amount
  }

  const handleSetManualRate = (rate: number | null) => {
    setManualRate(rate)
    // In a real application, you might want to persist this to localStorage or backend
    if (rate !== null) {
      localStorage.setItem('manualFxRate', rate.toString())
    } else {
      localStorage.removeItem('manualFxRate')
    }
  }

  // Load manual rate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('manualFxRate')
    if (saved) {
      const rate = parseFloat(saved)
      if (!isNaN(rate) && rate > 0) {
        setManualRate(rate)
      }
    }
  }, [])

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      toggleCurrency, 
      formatCurrency, 
      convertCurrency, 
      fxRate, 
      fxRateLabel, 
      isManualRate, 
      setManualRate: handleSetManualRate,
      getUsdToCadRate
    }}>
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
