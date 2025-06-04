"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Check, Edit, X, Loader2 } from "lucide-react"

interface SkuMappingDetectorProps {
  skus: string[]
  customerId?: number
  onMapSkus: (mappings: { original: string; mapped: string }[]) => void
}

interface SkuSuggestion {
  original: string
  suggested: string
  description: string
  confidence: number
  source: 'inventory' | 'mapping' | 'variation'
}

export function SkuMappingDetector({ skus, customerId, onMapSkus }: SkuMappingDetectorProps) {
  const [suggestions, setSuggestions] = useState<SkuSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMappings, setSelectedMappings] = useState<{ [key: string]: string }>({})
  const [editingSuggestion, setEditingSuggestion] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>("")

  useEffect(() => {
    const fetchSkuSuggestions = async () => {
      if (!skus || skus.length === 0) {
        setSuggestions([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch('/api/rfq/sku-mapping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skus,
            customerId
          })
        })

        const data = await response.json()
        
        if (data.success && data.data.suggestions) {
          setSuggestions(data.data.suggestions)
        } else {
          setSuggestions([])
        }
      } catch (error) {
        console.error('Error fetching SKU suggestions:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    fetchSkuSuggestions()
  }, [skus, customerId])

  const handleAcceptSuggestion = (original: string, suggested: string) => {
    setSelectedMappings({
      ...selectedMappings,
      [original]: suggested,
    })
  }

  const handleRejectSuggestion = (original: string) => {
    const newMappings = { ...selectedMappings }
    delete newMappings[original]
    setSelectedMappings(newMappings)
  }

  const handleEditSuggestion = (original: string, suggested: string) => {
    setEditingSuggestion(original)
    setEditValue(suggested)
  }

  const handleSaveEdit = (original: string) => {
    if (editValue.trim()) {
      setSelectedMappings({
        ...selectedMappings,
        [original]: editValue.trim(),
      })
    }
    setEditingSuggestion(null)
  }

  const handleApplyMappings = () => {
    const mappings = Object.entries(selectedMappings).map(([original, mapped]) => ({
      original,
      mapped,
    }))
    onMapSkus(mappings)
  }

  // If loading, show loading state
  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Checking SKU Mappings...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  // If no non-standard SKUs are detected, don't render the component
  if (suggestions.length === 0) {
    return null
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'mapping': return 'bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300'
      case 'variation': return 'bg-purple-50 dark:bg-purple-950/30 dark:text-purple-300'
      case 'inventory': return 'bg-green-50 dark:bg-green-950/30 dark:text-green-300'
      default: return 'bg-gray-50 dark:bg-gray-950/30 dark:text-gray-300'
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'mapping': return 'Standard Mapping'
      case 'variation': return 'Customer Variation'
      case 'inventory': return 'Fuzzy Match'
      default: return source
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Non-Standard SKUs Detected ({suggestions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            We've detected {suggestions.length} non-standard SKU{suggestions.length > 1 ? 's' : ''} in this RFQ. Review the suggested mappings below.
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div key={suggestion.original} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{suggestion.original}</span>
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300">
                      Non-Standard
                    </Badge>
                    <Badge variant="outline" className={getSourceBadgeColor(suggestion.source)}>
                      {getSourceLabel(suggestion.source)}
                    </Badge>
                  </div>
                  {editingSuggestion === suggestion.original ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                        placeholder="Enter SKU"
                      />
                      <Button variant="outline" size="sm" onClick={() => handleSaveEdit(suggestion.original)}>
                        Save
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingSuggestion(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Suggested mapping:{" "}
                        <span className="font-medium">
                          {selectedMappings[suggestion.original] || suggestion.suggested}
                        </span>
                        {suggestion.description && (
                          <span> ({suggestion.description})</span>
                        )}
                      </div>
                      <div className="mt-1">
                        <Badge
                          variant="outline"
                          className={`${
                            suggestion.confidence >= 90 
                              ? "bg-green-50 dark:bg-green-950/30 dark:text-green-300" 
                              : suggestion.confidence >= 75
                              ? "bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-300"
                              : "bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300"
                          }`}
                        >
                          {suggestion.confidence}% Match
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editingSuggestion === suggestion.original ? null : selectedMappings[suggestion.original] ? (
                    <>
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">Accepted</span>
                      <Button variant="ghost" size="icon" onClick={() => handleRejectSuggestion(suggestion.original)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptSuggestion(suggestion.original, suggestion.suggested)}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Accept
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSuggestion(suggestion.original, suggestion.suggested)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onMapSkus([])}>
              Skip
            </Button>
            <Button onClick={handleApplyMappings} disabled={Object.keys(selectedMappings).length === 0}>
              Apply {Object.keys(selectedMappings).length} Mapping{Object.keys(selectedMappings).length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
