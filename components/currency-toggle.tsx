"use client"

import { useCurrency } from "@/contexts/currency-context"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"
import { useState } from "react"

export function CurrencyToggle({ showOverride = true }: { showOverride?: boolean } = {}) {
  const { currency, toggleCurrency, fxRateLabel, isManualRate, setManualRate, fxRate } = useCurrency()
  const [showOverrideInput, setShowOverrideInput] = useState(false)
  const [manualInput, setManualInput] = useState("")

  const handleOverride = () => {
    const val = parseFloat(manualInput)
    if (!isNaN(val) && val > 0) {
      setManualRate(val)
      setShowOverrideInput(false)
    }
  }

  const handleClear = () => {
    setManualRate(null)
    setManualInput("")
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={toggleCurrency} className="flex items-center gap-1">
          <DollarSign className="h-4 w-4" />
          {currency}
        </Button>
        <span className="text-xs text-muted-foreground ml-2">{fxRateLabel}</span>
        {showOverride && (
          <>
            <Button variant="ghost" size="sm" onClick={() => setShowOverrideInput((v) => !v)}>
              {isManualRate ? "Edit Rate" : "Override Rate"}
            </Button>
            {isManualRate && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear
              </Button>
            )}
          </>
        )}
      </div>
      {showOverride && showOverrideInput && (
        <div className="flex items-center gap-2 mt-1">
          <input
            type="number"
            step="0.0001"
            min="0"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder={fxRate.toString()}
            className="border rounded px-2 py-1 text-xs w-28"
          />
          <Button variant="outline" size="sm" onClick={handleOverride}>
            Set
          </Button>
        </div>
      )}
    </div>
  )
}
