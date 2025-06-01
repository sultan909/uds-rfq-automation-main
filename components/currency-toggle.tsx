"use client"

import { useCurrency } from "@/contexts/currency-context"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"
import { useState } from "react"

export function CurrencyToggle({ showOverride = true }: { showOverride?: boolean } = {}) {
  const { currency, toggleCurrency, isManualRate, setManualRate, getUsdToCadRate } = useCurrency()
  const [showOverrideInput, setShowOverrideInput] = useState(false)
  const [manualInput, setManualInput] = useState("")

  const handleOverride = () => {
    const val = parseFloat(manualInput)
    if (!isNaN(val) && val > 0) {
      // Update the rate in context which will affect all currency conversions
      setManualRate(val)
      // Visual feedback
      const btn = document.activeElement as HTMLButtonElement
      if (btn) {
        const originalText = btn.textContent
        btn.textContent = 'Applied!'
        setTimeout(() => {
          btn.textContent = originalText
          setShowOverrideInput(false)
          setManualInput("")
        }, 1000)
      } else {
        setShowOverrideInput(false)
        setManualInput("")
      }
    }
  }

  const handleClear = () => {
    setManualRate(null)
    setManualInput("")
    setShowOverrideInput(false)
  }

  const currentRate = getUsdToCadRate()

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="flex items-center rounded-full gap-1.5 bg-muted/50 px-2 py-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 flex"
          onClick={toggleCurrency}
        >
          <DollarSign className="h-3.5 w-3.5 opacity-70 mr-1" />
          <span className="text-xs font-medium">{currency}</span>
        </Button>
        {showOverride && (
          <>
            <span className="text-xs text-muted-foreground">
              1 USD = {currentRate.toFixed(2)} CAD
              {isManualRate && " (Manual)"}
            </span>
            <button
              onClick={() => {
                if (isManualRate) {
                  // Clear the manual rate
                  handleClear();
                } else {
                  // Show input to set manual rate
                  setShowOverrideInput(!showOverrideInput);
                  setManualInput(currentRate.toString());
                }
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isManualRate ? "Clear" : "Set"}
            </button>
          </>
        )}
      </div>
      {showOverride && showOverrideInput && (
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center text-xs text-muted-foreground mb-1">
            Set exchange rate manually:
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded bg-muted/30 pr-1">
              <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground border-r">
                1 USD
              </span>
              <span className="px-2 text-xs">=</span>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                placeholder={currentRate.toString()}
                className="bg-transparent border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-1 text-xs w-20"
                aria-label="Exchange rate value"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleOverride();
                  }
                  if (e.key === 'Escape') {
                    setShowOverrideInput(false);
                    setManualInput("");
                  }
                }}
              />
              <span className="text-xs font-medium">
                CAD
              </span>
            </div>
            <Button variant="default" size="sm" onClick={handleOverride} className="h-8">
              Apply
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              setShowOverrideInput(false);
              setManualInput("");
            }} className="h-8">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
